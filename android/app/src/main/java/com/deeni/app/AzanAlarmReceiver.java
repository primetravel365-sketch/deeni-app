package com.deeni.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
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
        if (alarmKey == null || alarmKey.isEmpty()) return;
        long now = System.currentTimeMillis();
        long scheduled = intent.getLongExtra("scheduledAtMillis", 0L);
        if (scheduled > 0L && now >= scheduled && now - scheduled <= 30000L) {
            SharedPreferences guard = context.getSharedPreferences("deeni_azan_receiver_guard_v1", Context.MODE_PRIVATE);
            long last = guard.getLong(alarmKey, 0L);
            if (last == scheduled) return;
            guard.edit().putLong(alarmKey, scheduled).commit();

            try {
                if (alarmKey.startsWith("reminder_")) {
                    showReminder(context, intent.getStringExtra("name"), alarmKey);
                } else {
                    startPrayerAudio(context, intent);
                }
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

    @SuppressWarnings("deprecation")
    private void showReminder(Context context, String name, String key) {
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null || !manager.areNotificationsEnabled()) return;
        String channel = "islamiyat_prayer_reminders";
        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(new NotificationChannel(
                    channel, "التنبيه قبل الصلاة", NotificationManager.IMPORTANCE_HIGH));
            builder = new Notification.Builder(context, channel);
        } else {
            builder = new Notification.Builder(context).setDefaults(Notification.DEFAULT_ALL)
                    .setPriority(Notification.PRIORITY_HIGH);
        }
        Intent launch = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launch != null) {
            builder.setContentIntent(PendingIntent.getActivity(context, key.hashCode(), launch,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }
        manager.notify(key, 0, builder.setSmallIcon(context.getApplicationInfo().icon)
                .setContentTitle("اقترب أذان " + name).setContentText("باقي خمس دقائق")
                .setAutoCancel(true).build());
    }
}
