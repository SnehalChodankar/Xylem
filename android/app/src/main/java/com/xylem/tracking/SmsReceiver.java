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
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                        String sender = smsMessage.getDisplayOriginatingAddress();
                        String messageBody = smsMessage.getMessageBody();

                        Log.d(TAG, "SMS intercepted securely from " + sender);

                        // Only process banking-style keywords immediately to save battery
                        if (messageBody.toLowerCase().contains("debited") || messageBody.toLowerCase().contains("credited") || messageBody.toLowerCase().contains("spent") || messageBody.toLowerCase().contains("withdrawn") || messageBody.toLowerCase().contains("rs.") || messageBody.toLowerCase().contains("inr")) {
                            forwardToXylemAPI(context, sender, messageBody);
                        }
                    }
                }
            }
        }
    }

    private void forwardToXylemAPI(Context context, String sender, String message) {
        SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        
        // Capacitor Preferences stores objects natively as strings.
        String token = prefs.getString("xylem_session_token", null);
        String userId = prefs.getString("xylem_user_id", null);

        if (token == null || userId == null) {
            Log.w(TAG, "Sync aborted. User is logged out natively or tracking disabled natively.");
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

                JSONObject json = new JSONObject();
                json.put("sender", sender);
                json.put("message", message);
                json.put("token", token);
                json.put("userId", userId);

                String jsonInputString = json.toString();

                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonInputString.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }

                int code = conn.getResponseCode();
                Log.d(TAG, "Xylem Bank Sync Status: " + code);
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Sync failed executing payload forwarder. Server offline?", e);
            }
        });
    }
}
