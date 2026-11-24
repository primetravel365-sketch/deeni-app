package com.deeni.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.Intent;
import android.os.Build;

/**
 * دفعة ٦٣: بيستقبل منبّه الأذان الدقيق (AlarmManager) وقت دخول وقت الصلاة فعليًا، ويبدأ خدمة تشغيل
 * الأذان الكامل (AzanPlaybackService)، وبعدين يعيد جدولة نفس المنبّه تلقائيًا لليوم التالي (لأن منبهات
 * AlarmManager تطلق مرة واحدة بس، مش متكررة زي الإشعارات المجدولة).
 *
 * تعديل لاحق (إصلاح انحراف الأذان الكامل): بدل ما يعيد استخدام نفس الساعة/الدقيقة القديمة المخزّنة في
 * الـ intent extras (اللي كانت بتسبب تجمّد الوقت وابتعاده عن الوقت الحقيقي كل يوم مفتوحش فيه التطبيق)،
 * بقى ينادي AzanScheduler.rescheduleWithRecalculation اللي بتحسب وقت الصلاة الحقيقي لبكرة محليًا.
 */
public class AzanAlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;

        // Guard against duplicate delivery of the same prayer alarm.
        String alarmKey = intent.getStringExtra("key");
        // Ignore pending text reminders created by older app versions.
        if (alarmKey == null || alarmKey.isEmpty() || alarmKey.startsWith("reminder_")) return;
        long now = System.currentTimeMillis();
        long scheduled = intent.getLongExtra("scheduledAtMillis", 0L);
        if (scheduled > 0L && now >= scheduled && now - scheduled <= 30000L) {
            SharedPreferences guard = context.getSharedPreferences("deeni_azan_receiver_guard_v1", Context.MODE_PRIVATE);
            long last = guard.getLong(alarmKey, 0L);
            if (last == scheduled) return;
            guard.edit().putLong(alarmKey, scheduled).commit();

            try {
                startPrayerAudio(context, intent);
            } catch (Exception ignore) {
                // فشل بدء الخدمة (نادر) — لا داعي يعطّل إعادة جدولة الغد
            }

        }

        try {
            String key = intent.getStringExtra("key");
            String name = intent.getStringExtra("name");
            String soundType = intent.getStringExtra("soundType");
            String source = intent.getStringExtra("source");
            if (key != null && source != null) {
                AzanScheduler.rescheduleWithRecalculation(context, key, name, soundType, source);
            }
        } catch (Exception ignore) {}
    }
    private void startPrayerAudio(Context context, Intent intent) {
        Intent serviceIntent = new Intent(context, AzanPlaybackService.class);
        serviceIntent.putExtras(intent);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }

}
