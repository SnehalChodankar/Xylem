package com.xylem.tracking;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.Calendar;

@CapacitorPlugin(
    name = "SmsTracker",
    permissions = {
        @Permission(
            alias = "sms",
            strings = {
                Manifest.permission.READ_SMS
            }
        )
    }
)
public class SmsTrackerPlugin extends Plugin {

    @PluginMethod
    public void requestSmsPermission(PluginCall call) {
        String token = call.getString("token");
        String userId = call.getString("userId");
        String allowedSenders = call.getString("allowedSenders", "");

        if (token != null && userId != null) {
            SharedPreferences prefs = getContext().getSharedPreferences("XylemPrefs", Context.MODE_PRIVATE);
            prefs.edit()
                .putString("xylem_session_token", token)
                .putString("xylem_user_id", userId)
                .putString("xylem_allowed_senders", allowedSenders)
                .apply();
        }

        if (getPermissionState("sms") != com.getcapacitor.PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "smsPermsCallback");
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void clearSmsCredentials(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences("XylemPrefs", Context.MODE_PRIVATE);
        prefs.edit().clear().apply();
        JSObject ret = new JSObject();
        ret.put("cleared", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void syncTodaySms(PluginCall call) {
        if (getPermissionState("sms") != com.getcapacitor.PermissionState.GRANTED) {
            call.reject("SMS Permission not granted");
            return;
        }

        JSArray messages = new JSArray();
        
        // Get start of today (midnight)
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        long startOfDay = cal.getTimeInMillis();

        try {
            Uri inboxUri = Uri.parse("content://sms/inbox");
            String[] projection = new String[]{"address", "body", "date"};
            String selection = "date >= ?";
            String[] selectionArgs = new String[]{String.valueOf(startOfDay)};
            String sortOrder = "date DESC";

            Cursor cursor = getContext().getContentResolver().query(inboxUri, projection, selection, selectionArgs, sortOrder);

            if (cursor != null) {
                while (cursor.moveToNext()) {
                    String address = cursor.getString(cursor.getColumnIndexOrThrow("address"));
                    String body = cursor.getString(cursor.getColumnIndexOrThrow("body"));
                    
                    JSObject msg = new JSObject();
                    msg.put("sender", address);
                    msg.put("message", body);
                    messages.put(msg);
                }
                cursor.close();
            }

            JSObject ret = new JSObject();
            ret.put("messages", messages);
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Failed to read SMS: " + e.getMessage());
        }
    }

    @PermissionCallback
    public void smsPermsCallback(PluginCall call) {
        if (getPermissionState("sms") == com.getcapacitor.PermissionState.GRANTED) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", false);
            call.resolve(ret);
        }
    }
}
