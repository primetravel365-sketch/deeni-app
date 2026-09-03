package com.deeni.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // تسجيل إضافة (دفعة ٣٠): استثناء التطبيق من توفير البطارية — عشان يقدر يبعت تنبيهات الأذان
        // حتى لو النظام حاول يقفله في الخلفية (مشكلة شائعة جدًا في أجهزة شاومي/أوبو/هواوي)
        registerPlugin(BatteryOptimPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
