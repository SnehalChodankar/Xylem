package com.xylem.tracking;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * SmsWorker: A WorkManager Worker that reliably POSTs an intercepted SMS to the
 * Xylem webhook. WorkManager guarantees execution even through:
 *   - Android Doze Mode (screen off, idle)
 *   - Network failures (it queues and retries automatically)
 *   - App process kills (it persists work across restarts)
 *   - The 10-second goAsync() deadline (WorkManager has no such limit)
 */
public class SmsWorker extends Worker {

    private static final String TAG = "SmsWorker";

    // These keys match what SmsReceiver.java passes via WorkManager Data
    public static final String KEY_SENDER  = "sender";
    public static final String KEY_MESSAGE = "message";

    public SmsWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        // 1. Read the SMS data passed in by SmsReceiver
        String sender  = getInputData().getString(KEY_SENDER);
        String message = getInputData().getString(KEY_MESSAGE);

        // 2. Read the user's auth token and ID from native SharedPreferences
        SharedPreferences prefs = getApplicationContext()
                .getSharedPreferences("XylemPrefs", Context.MODE_PRIVATE);
        String token  = prefs.getString("xylem_session_token", null);
        String userId = prefs.getString("xylem_user_id", null);

        if (token == null || userId == null) {
            Log.w(TAG, "No credentials found in XylemPrefs — aborting without retry.");
            // Return FAILURE (not RETRY) because retrying won't help without credentials.
            return Result.failure();
        }

        if (sender == null || message == null) {
            Log.w(TAG, "Missing sender or message data — aborting.");
            return Result.failure();
        }

        try {
            // 3. Build and fire the POST request to the Xylem webhook
            URL url = new URL("https://xylems.vercel.app/api/webhooks/sms");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; utf-8");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(30000); // 30s — WorkManager has no time limit
            conn.setReadTimeout(30000);

            JSONObject json = new JSONObject();
            json.put("sender", sender);
            json.put("message", message);
            json.put("token", token);
            json.put("userId", userId);

            byte[] input = json.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(input, 0, input.length);
            }

            int responseCode = conn.getResponseCode();
            conn.disconnect();

            Log.d(TAG, "Webhook response code: " + responseCode);

            if (responseCode >= 200 && responseCode < 300) {
                // 4. Success! Show a local notification to the user.
                showLocalNotification(getApplicationContext(), sender);
                return Result.success();
            } else if (responseCode >= 500) {
                // Server-side error (e.g., Vercel cold start failure): RETRY
                Log.w(TAG, "Server error " + responseCode + " — will retry.");
                return Result.retry();
            } else {
                // Client-side error (e.g., 400 bad request): don't bother retrying
                Log.e(TAG, "Client error " + responseCode + " — will not retry.");
                return Result.failure();
            }

        } catch (Exception e) {
            // Network exception (no internet, timeout): RETRY
            // WorkManager will exponentially back off (30s → 1m → 2m → 4m…)
            Log.e(TAG, "Network exception — will retry: " + e.getMessage());
            return Result.retry();
        }
    }

    private void showLocalNotification(Context context, String sender) {
        String channelId = "xylem_sms_alerts";
        android.app.NotificationManager nm =
                (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            android.app.NotificationChannel channel = new android.app.NotificationChannel(
                    channelId, "SMS Tracking Alerts",
                    android.app.NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription("Alerts for newly tracked bank SMS messages");
            if (nm != null) nm.createNotificationChannel(channel);
        }

        android.content.Intent launchIntent =
                context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent == null) return;
        launchIntent.setFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK |
                android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M
                ? android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
                : android.app.PendingIntent.FLAG_UPDATE_CURRENT;

        android.app.PendingIntent pi = android.app.PendingIntent.getActivity(
                context, 0, launchIntent, flags);

        int iconResId = context.getResources()
                .getIdentifier("ic_launcher", "mipmap", context.getPackageName());
        if (iconResId == 0) iconResId = android.R.drawable.ic_dialog_info;

        android.app.Notification.Builder builder;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            builder = new android.app.Notification.Builder(context, channelId);
        } else {
            builder = new android.app.Notification.Builder(context);
        }

        builder.setSmallIcon(iconResId)
                .setContentTitle("New Transaction Staged")
                .setContentText("A transaction from " + sender + " is ready for review.")
                .setContentIntent(pi)
                .setAutoCancel(true);

        if (nm != null) nm.notify((int) System.currentTimeMillis(), builder.build());
    }
}
