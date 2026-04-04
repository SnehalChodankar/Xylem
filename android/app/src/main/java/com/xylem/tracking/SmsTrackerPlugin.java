package com.xylem.tracking;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "SmsTracker",
    permissions = {
        @Permission(
            alias = "sms",
            strings = {
                Manifest.permission.READ_SMS,
                Manifest.permission.RECEIVE_SMS
            }
        )
    }
)
public class SmsTrackerPlugin extends Plugin {

    @PluginMethod
    public void requestSmsPermission(PluginCall call) {
        String token = call.getString("token");
        String userId = call.getString("userId");
        // Comma-separated list of sender patterns from the user's mapping config (e.g. "BOBSMS,HDFCBK")
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
