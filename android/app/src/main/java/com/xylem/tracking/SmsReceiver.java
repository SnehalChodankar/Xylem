package com.xylem.tracking;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SmsReceiver";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @Override
    public void onReceive(Context context, Intent intent) {
        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle == null) return;

            Object[] pdus = (Object[]) bundle.get("pdus");
            if (pdus == null) return;

            for (Object pdu : pdus) {
                SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                String sender = smsMessage.getDisplayOriginatingAddress();
                String messageBody = smsMessage.getMessageBody();

                Log.d(TAG, "SMS received from: " + sender);

                // Filter for banking keywords — broad net to catch Indian bank formats
                String lower = messageBody.toLowerCase();
                boolean isBankingSms = lower.contains("debited") || lower.contains("credited")
                        || lower.contains("spent") || lower.contains("withdrawn")
                        || lower.contains("rs.") || lower.contains("rs ")
                        || lower.contains("inr") || lower.contains("payment")
                        || lower.contains("transaction") || lower.contains("transferred");

                if (isBankingSms) {
                    Log.d(TAG, "Banking SMS detected, forwarding to Xylem webhook...");
                    final PendingResult pendingResult = goAsync();
                    forwardToXylemAPI(context, sender, messageBody, pendingResult);
                }
            }
        }
    }

    private void forwardToXylemAPI(Context context, String sender, String message, PendingResult pendingResult) {
        // Read from the controlled SharedPreferences file written by SmsTrackerPlugin.java
        SharedPreferences prefs = context.getSharedPreferences("XylemPrefs", Context.MODE_PRIVATE);
        String token = prefs.getString("xylem_session_token", null);
        String userId = prefs.getString("xylem_user_id", null);

        Log.d(TAG, "Token present: " + (token != null) + ", UserId present: " + (userId != null));

        if (token == null || userId == null) {
            Log.w(TAG, "Aborting sync — no credentials stored. User must enable SMS tracking first.");
            pendingResult.finish();
            return;
        }

        executor.execute(() -> {
            try {
                URL url = new URL("https://xylems.vercel.app/api/webhooks/sms");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; utf-8");
                conn.setRequestProperty("Accept", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(15000);

                JSONObject json = new JSONObject();
                json.put("sender", sender);
                json.put("message", message);
                json.put("token", token);
                json.put("userId", userId);

                byte[] input = json.toString().getBytes(StandardCharsets.UTF_8);
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(input, 0, input.length);
                }

                int code = conn.getResponseCode();
                Log.d(TAG, "Webhook response code: " + code);
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Webhook POST failed: " + e.getMessage(), e);
            } finally {
                pendingResult.finish();
            }
        });
    }
}
