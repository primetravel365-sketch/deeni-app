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

class AzanScheduler {

    private static final String PREFS = "deeni_azan_full_schedule_v1";
    private static final String LOC_PREFS = "deeni_azan_location_v1";

    private static final Map<String, Integer> REQUEST_CODES = new HashMap<>();
    static {
        REQUEST_CODES.put("fajr", 9001);
        REQUEST_CODES.put("dhuhr", 9002);
        REQUEST_CODES.put("asr", 9003);
        REQUEST_CODES.put("maghrib", 9004);
        REQUEST_CODES.put("isha", 9005);
    }

    static void persistLocation(Context context, double lat, double lon, int method) {
        try {
            SharedPreferences sp = context.getSharedPreferences(LOC_PREFS, Context.MODE_PRIVATE);
            sp.edit().putFloat("lat", (float) lat).putFloat("lon", (float) lon).putInt("method", method).apply();
        } catch (Exception ignore) {}
    }

    static void schedule(Context context, String key, String name, int hour, int minute, int second, String soundType, String source) {
        Integer reqCode = REQUEST_CODES.get(key);
        if (reqCode == null) return;
        persist(context, key, name, hour, minute, second, soundType, source);
        armAlarm(context, reqCode, key, name, hour, minute, second, soundType, source);
    }

    /** يعيد جدولة الصلاة القادمة (غدًا عادة) بحساب الوقت الحقيقي محليًا بدل تكرار نفس الساعة القديمة. */
    static void rescheduleWithRecalculation(Context context, String key, String name, String soundType, String source) {
        try {
            SharedPreferences loc = context.getSharedPreferences(LOC_PREFS, Context.MODE_PRIVATE);
            if (!loc.contains("lat")) {
                // لا يوجد موقع محفوظ بعد (أول تشغيل قبل أي مزامنة) — رجوع للسلوك القديم كحل احتياطي
                return;
            }
            double lat = loc.getFloat("lat", 0f);
            double lon = loc.getFloat("lon", 0f);
            int method = loc.getInt("method", 16);

            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.DAY_OF_YEAR, 1); // نحسب لبكرة لأن ده بينادى بعد ما أذان اليوم يخلص
            double tz = PrayTimeCalculator.timezoneOffsetHours(cal);

            PrayTimeCalculator.Times times = PrayTimeCalculator.compute(
                    cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH),
                    lat, lon, tz, method, 1);

            double decimalTime;
            switch (key) {
                case "fajr": decimalTime = times.fajr; break;
                case "dhuhr": decimalTime = times.dhuhr; break;
                case "asr": decimalTime = times.asr; break;
                case "maghrib": decimalTime = times.maghrib; break;
                case "isha": decimalTime = times.isha; break;
                default: return;
            }
            int[] hms = PrayTimeCalculator.hms(decimalTime);
            persist(context, key, name, hms[0], hms[1], hms[2], soundType, source);
            Integer reqCode = REQUEST_CODES.get(key);
            if (reqCode != null) armAlarm(context, reqCode, key, name, hms[0], hms[1], hms[2], soundType, source);
        } catch (Exception ignore) {
            // في حال أي خطأ حسابي غير متوقع، لا نكسر التطبيق — الجدولة القادمة عبر فتح التطبيق ستُصحّح الوضع
        }
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
