package com.deeni.app;

import android.content.BroadcastReceiver;
import android.content.Context;
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
            String soundType = intent.getStringExtra("soundType");
            String source = intent.getStringExtra("source");
            if (key != null && source != null) {
                AzanScheduler.rescheduleWithRecalculation(context, key, name, soundType, source);
            }
        } catch (Exception ignore) {}
    }
}
