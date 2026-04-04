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
        if (!"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) return;

        Bundle bundle = intent.getExtras();
        if (bundle == null) return;

        Object[] pdus = (Object[]) bundle.get("pdus");
        if (pdus == null) return;

        // Read user-configured allowed sender patterns from XylemPrefs (set by SmsTrackerPlugin)
        SharedPreferences prefs = context.getSharedPreferences("XylemPrefs", Context.MODE_PRIVATE);
        String allowedSendersStr = prefs.getString("xylem_allowed_senders", "");

        for (Object pdu : pdus) {
            SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
            String sender = smsMessage.getDisplayOriginatingAddress();
            String messageBody = smsMessage.getMessageBody();

            Log.d(TAG, "SMS received from: " + sender);

            // Only forward SMS from user-configured allowed senders
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

            Log.d(TAG, "Allowed sender matched: " + sender + " — forwarding to Xylem webhook");
            final PendingResult pendingResult = goAsync();
            forwardToXylemAPI(context, sender, messageBody, pendingResult);
        }
    }

    private void forwardToXylemAPI(Context context, String sender, String message, PendingResult pendingResult) {
        SharedPreferences prefs = context.getSharedPreferences("XylemPrefs", Context.MODE_PRIVATE);
        String token = prefs.getString("xylem_session_token", null);
        String userId = prefs.getString("xylem_user_id", null);

        Log.d(TAG, "Token present: " + (token != null) + ", UserId present: " + (userId != null));

        if (token == null || userId == null) {
            Log.w(TAG, "Aborting — no credentials stored. Re-enable SMS tracking in Settings.");
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

                if (code >= 200 && code < 300) {
                    showLocalNotification(context, sender);
                }

                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Webhook POST failed: " + e.getMessage(), e);
            } finally {
                pendingResult.finish();
            }
        });
    }

    private void showLocalNotification(Context context, String sender) {
        String channelId = "xylem_sms_alerts";
        android.app.NotificationManager notificationManager = (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            android.app.NotificationChannel channel = new android.app.NotificationChannel(
                    channelId,
                    "SMS Tracking Alerts",
                    android.app.NotificationManager.IMPORTANCE_DEFAULT
            );
            channel.setDescription("Alerts for newly tracked bank SMS messages");
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }

        // Open the app when the notification is tapped
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent == null) return;
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        int flags = android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M 
                ? android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE 
                : android.app.PendingIntent.FLAG_UPDATE_CURRENT;
        
        android.app.PendingIntent pendingIntent = android.app.PendingIntent.getActivity(context, 0, launchIntent, flags);

        int iconResId = context.getResources().getIdentifier("ic_launcher", "mipmap", context.getPackageName());
        if (iconResId == 0) {
            iconResId = android.R.drawable.ic_dialog_info;
        }

        android.app.Notification.Builder builder;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            builder = new android.app.Notification.Builder(context, channelId);
        } else {
            builder = new android.app.Notification.Builder(context);
        }

        builder.setSmallIcon(iconResId)
               .setContentTitle("New Transaction Staged")
               .setContentText("A new transaction from " + sender + " is ready for your review.")
               .setContentIntent(pendingIntent)
               .setAutoCancel(true);

        if (notificationManager != null) {
            notificationManager.notify((int) System.currentTimeMillis(), builder.build());
        }
    }
}
