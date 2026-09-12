package com.deeni.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Map;

/**
 * دفعة ٦٣: مجدوِل الأذان الكامل — بديل عن الاعتماد على "صوت قناة إشعار" (اللي أندرويد بيوقفه تلقائيًا
 * بعد ثواني قليلة). هنا كل صلاة بتاخد منبّه دقيق (AlarmManager.setExactAndAllowWhileIdle) مستقل تمامًا
 * عن أي إشعار، وبيعيد جدولة نفسه تلقائيًا لليوم التالي فور إطلاقه (AzanAlarmReceiver)، وبيتحفظ في
 * SharedPreferences عشان BootReceiver يقدر يعيد ضبطه لو الجهاز اتقفل وبدأ من جديد (إعادة التشغيل بتمسح
 * أي منبّه AlarmManager مجدوَل).
 */
class AzanScheduler {

    private static final String PREFS = "deeni_azan_full_schedule_v1";

    private static final Map<String, Integer> REQUEST_CODES = new HashMap<>();
    static {
        REQUEST_CODES.put("fajr", 9001);
        REQUEST_CODES.put("dhuhr", 9002);
        REQUEST_CODES.put("asr", 9003);
        REQUEST_CODES.put("maghrib", 9004);
        REQUEST_CODES.put("isha", 9005);
    }

    static void schedule(Context context, String key, String name, int hour, int minute, int second, String soundType, String source) {
        Integer reqCode = REQUEST_CODES.get(key);
        if (reqCode == null) return;
        persist(context, key, name, hour, minute, second, soundType, source);
        armAlarm(context, reqCode, key, name, hour, minute, second, soundType, source);
    }

    static void rescheduleNextDay(Context context, String key, String name, int hour, int minute, int second, String soundType, String source) {
        Integer reqCode = REQUEST_CODES.get(key);
        if (reqCode == null) return;
        armAlarm(context, reqCode, key, name, hour, minute, second, soundType, source);
    }

    static void rearmAllFromPersisted(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            for (String key : REQUEST_CODES.keySet()) {
                if (!sp.getBoolean(key + "_set", false)) continue;
                String name = sp.getString(key + "_name", key);
                int hour = sp.getInt(key + "_hour", -1);
                int minute = sp.getInt(key + "_minute", -1);
                int second = sp.getInt(key + "_second", 0);
                String soundType = sp.getString(key + "_soundType", null);
                String source = sp.getString(key + "_source", null);
                if (hour < 0 || minute < 0 || source == null) continue;
                Integer reqCode = REQUEST_CODES.get(key);
                if (reqCode == null) continue;
                armAlarm(context, reqCode, key, name, hour, minute, second, soundType, source);
            }
        } catch (Exception ignore) {}
    }

    static void cancelAll(Context context) {
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            for (Map.Entry<String, Integer> entry : REQUEST_CODES.entrySet()) {
                try {
                    Intent intent = new Intent(context, AzanAlarmReceiver.class);
                    int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_IMMUTABLE : 0);
                    PendingIntent pi = PendingIntent.getBroadcast(context, entry.getValue(), intent, flags);
                    if (am != null) am.cancel(pi);
                    pi.cancel();
                } catch (Exception ignore) {}
            }
        } catch (Exception ignore) {}
        clearPersisted(context);
    }

    private static void armAlarm(Context context, int reqCode, String key, String name, int hour, int minute, int second, String soundType, String source) {
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            Calendar cal = Calendar.getInstance();
            cal.set(Calendar.HOUR_OF_DAY, hour);
            cal.set(Calendar.MINUTE, minute);
            cal.set(Calendar.SECOND, second);
            cal.set(Calendar.MILLISECOND, 0);
            if (cal.getTimeInMillis() <= System.currentTimeMillis()) {
                cal.add(Calendar.DAY_OF_YEAR, 1);
            }

            Intent intent = new Intent(context, AzanAlarmReceiver.class);
            intent.putExtra("key", key);
            intent.putExtra("name", name);
            intent.putExtra("hour", hour);
            intent.putExtra("minute", minute);
            intent.putExtra("second", second);
            intent.putExtra("soundType", soundType);
            intent.putExtra("source", source);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_IMMUTABLE : 0);
            PendingIntent pi = PendingIntent.getBroadcast(context, reqCode, intent, flags);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (am.canScheduleExactAlarms()) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
                } else {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
                }
            } else {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
            }
        } catch (Exception ignore) {}
    }

    private static void persist(Context context, String key, String name, int hour, int minute, int second, String soundType, String source) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            sp.edit()
                .putString(key + "_name", name)
                .putInt(key + "_hour", hour)
                .putInt(key + "_minute", minute)
                .putInt(key + "_second", second)
                .putString(key + "_soundType", soundType)
                .putString(key + "_source", source)
                .putBoolean(key + "_set", true)
                .apply();
        } catch (Exception ignore) {}
    }

    private static void clearPersisted(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            sp.edit().clear().apply();
        } catch (Exception ignore) {}
    }
}
