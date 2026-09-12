package com.deeni.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/**
 * دفعة ٦٣: بيستقبل منبّه الأذان الدقيق (AlarmManager) وقت دخول وقت الصلاة فعليًا، ويبدأ خدمة تشغيل
 * الأذان الكامل (AzanPlaybackService)، وبعدين يعيد جدولة نفس المنبّه تلقائيًا لليوم التالي (لأن منبهات
 * AlarmManager تطلق مرة واحدة بس، مش متكررة زي الإشعارات المجدولة).
 */
public class AzanAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;

        try {
            Intent serviceIntent = new Intent(context, AzanPlaybackService.class);
            serviceIntent.putExtras(intent);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        } catch (Exception ignore) {
            // فشل بدء الخدمة (نادر) — لا داعي يعطّل إعادة جدولة الغد
        }

        try {
            String key = intent.getStringExtra("key");
            String name = intent.getStringExtra("name");
            int hour = intent.getIntExtra("hour", -1);
            int minute = intent.getIntExtra("minute", -1);
            int second = intent.getIntExtra("second", 0);
            String soundType = intent.getStringExtra("soundType");
            String source = intent.getStringExtra("source");
            if (key != null && hour >= 0 && minute >= 0 && source != null) {
                AzanScheduler.rescheduleNextDay(context, key, name, hour, minute, second, soundType, source);
            }
        } catch (Exception ignore) {}
    }
}
