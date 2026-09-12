package com.deeni.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * دفعة ٦٣: إعادة تشغيل الجهاز بتمسح كل منبّهات AlarmManager المجدوَلة — هنا بنعيد ضبط منبّهات الأذان
 * الكامل الخمسة من البيانات المحفوظة محليًا (SharedPreferences) بمجرد ما الجهاز يخلص إقلاع، بدون
 * الحاجة لفتح التطبيق يدويًا الأول.
 */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            AzanScheduler.rearmAllFromPersisted(context);
        } catch (Exception ignore) {}
    }
}
