package com.xylem.tracking;

import com.getcapacitor.BridgeActivity;

import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SmsTrackerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
