package com.xylem.tracking;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.Data;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;

import java.util.concurrent.TimeUnit;

/**
 * SmsReceiver: A BroadcastReceiver that wakes up when an SMS arrives.
 *
 * Its ONLY job is to:
 *  1. Check if the sender is in the user's allowed list.
 *  2. Enqueue a WorkManager task (SmsWorker) with the SMS data.
 *
 * The actual network call is handled by SmsWorker, which:
 *  - Runs with no time limit (unlike goAsync() which only allows 10 seconds)
 *  - Retries automatically on network failures with exponential backoff
 *  - Survives Android Doze mode and process kills
 *  - Requires a CONNECTED network before it even tries
 */
public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) return;

        Bundle bundle = intent.getExtras();
        if (bundle == null) return;

        Object[] pdus = (Object[]) bundle.get("pdus");
        if (pdus == null) return;

        // Read user-configured allowed sender patterns from XylemPrefs
        SharedPreferences prefs = context.getSharedPreferences("XylemPrefs", Context.MODE_PRIVATE);
        String allowedSendersStr = prefs.getString("xylem_allowed_senders", "");

        for (Object pdu : pdus) {
            SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
            String sender = smsMessage.getDisplayOriginatingAddress();
            String messageBody = smsMessage.getMessageBody();

            Log.d(TAG, "SMS received from: " + sender);

            // Filter: only forward SMS from the user-configured allowed senders list
            boolean isAllowedSender = false;
            if (sender != null && !allowedSendersStr.isEmpty()) {
                String upperSender = sender.toUpperCase();
                for (String pattern : allowedSendersStr.split(",")) {
                    if (!pattern.trim().isEmpty() && upperSender.contains(pattern.trim().toUpperCase())) {
                        isAllowedSender = true;
                        break;
                    }
                }
            }

            if (!isAllowedSender) {
                Log.d(TAG, "Sender not in allowed list, skipping: " + sender);
                continue;
            }

            Log.d(TAG, "Allowed sender matched: " + sender + " — enqueuing WorkManager job.");

            // Package the SMS data into a WorkManager Data object
            Data inputData = new Data.Builder()
                    .putString(SmsWorker.KEY_SENDER, sender)
                    .putString(SmsWorker.KEY_MESSAGE, messageBody)
                    .build();

            // Require a CONNECTED network before the worker runs.
            // WorkManager will queue the job and wait for connectivity automatically.
            Constraints constraints = new Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build();

            // Build the work request with exponential backoff starting at 30 seconds.
            // If SmsWorker returns Result.retry(), WorkManager will retry at:
            // 30s → 1m → 2m → 4m → 8m… (up to a max of 5 hours)
            OneTimeWorkRequest smsWork = new OneTimeWorkRequest.Builder(SmsWorker.class)
                    .setInputData(inputData)
                    .setConstraints(constraints)
                    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
                    .build();

            // Enqueue the work. WorkManager persists this to disk — it will
            // survive even if the app process is killed before the job runs.
            WorkManager.getInstance(context).enqueue(smsWork);

            Log.d(TAG, "WorkManager job enqueued for sender: " + sender);
        }
    }
}
