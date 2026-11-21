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

    // The Fajr follow-up is opt-in and needs a confirmed iqama interval.
    // Zero disables the follow-up until actual iqama settings are supplied.
    static void setFajrIqamaMinutes(Context context, int minutes) {
        if (minutes < 0 || minutes > 180) return;
        context.getSharedPreferences("deeni_fajr_followup_v1", Context.MODE_PRIVATE)
                .edit().putInt("iqamaMinutes", minutes).apply();
    }

    static void persistLocation(Context context, double lat, double lon, int method) {
        if (!Double.isFinite(lat) || !Double.isFinite(lon)
                || lat < -90.0 || lat > 90.0 || lon < -180.0 || lon > 180.0) return;
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

    /**
     * Find the next prayer occurrence after an alarm was delivered.
     * An alarm may be delivered after midnight (Doze / device time adjustments),
     * so assuming "tomorrow" can inadvertently skip today's prayer.
     */
    static void rescheduleWithRecalculation(Context context, String key, String name, String soundType, String source) {
        try {
            SharedPreferences loc = context.getSharedPreferences(LOC_PREFS, Context.MODE_PRIVATE);
            if (!loc.contains("lat") || !loc.contains("lon")) {
                armTomorrowFromPersisted(context, key, name, soundType, source);
                return;
            }

            double lat = loc.getFloat("lat", 0f);
            double lon = loc.getFloat("lon", 0f);
            int method = loc.getInt("method", 16);
            long now = System.currentTimeMillis();
            Calendar date = Calendar.getInstance();

            // Check actual dates rather than reusing yesterday's clock time.
            // We intentionally do not arm a second copy of a just-fired alarm.
            for (int day = 0; day < 3; day++) {
                int[] hms = calculatePrayerHms(date, key, lat, lon, method);
                if (hms != null) {
                    Calendar trigger = (Calendar) date.clone();
                    trigger.set(Calendar.HOUR_OF_DAY, hms[0]);
                    trigger.set(Calendar.MINUTE, hms[1]);
                    trigger.set(Calendar.SECOND, hms[2]);
                    trigger.set(Calendar.MILLISECOND, 0);
                    if (trigger.getTimeInMillis() > now + 1000L) {
                        persist(context, key, name, hms[0], hms[1], hms[2], soundType, source);
                        Integer reqCode = REQUEST_CODES.get(key);
                        if (reqCode != null) {
                            armAlarmForDate(context, reqCode, key, name, hms[0], hms[1], hms[2],
                                            soundType, source, date);
                        }
                        return;
                    }
                }
                date.add(Calendar.DAY_OF_YEAR, 1);
            }
            armTomorrowFromPersisted(context, key, name, soundType, source);
        } catch (Exception ignore) {
            armTomorrowFromPersisted(context, key, name, soundType, source);
        }
    }

    /** Keep tomorrow's alarm alive if saved location or calculation is unavailable. */
    private static void armTomorrowFromPersisted(Context context, String key, String name,
                                                 String soundType, String source) {
        Integer reqCode = REQUEST_CODES.get(key);
        if (reqCode == null) return;
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int hour = sp.getInt(key + "_hour", -1);
        int minute = sp.getInt(key + "_minute", -1);
        int second = sp.getInt(key + "_second", 0);
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) return;
        Calendar tomorrow = Calendar.getInstance();
        tomorrow.add(Calendar.DAY_OF_YEAR, 1);
        armAlarmForDate(context, reqCode, key, name, hour, minute, second,
                        soundType, source, tomorrow);
    }

    static void rearmAllFromPersisted(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            SharedPreferences loc = context.getSharedPreferences(LOC_PREFS, Context.MODE_PRIVATE);
            boolean hasLocation = loc.contains("lat") && loc.contains("lon");
            for (String key : REQUEST_CODES.keySet()) {
                if (!sp.getBoolean(key + "_set", false)) continue;
                String name = sp.getString(key + "_name", key);
                String soundType = sp.getString(key + "_soundType", null);
                String source = sp.getString(key + "_source", null);
                if (source == null) continue;

                // After a reboot or timezone change, persisted clock times can be stale.
                // Recalculate today's next occurrence using the saved coordinates.
                if (hasLocation) {
                    try {
                        Calendar target = Calendar.getInstance();
                        int method = loc.getInt("method", 16);
                        double lat = loc.getFloat("lat", 0f);
                        double lon = loc.getFloat("lon", 0f);
                        int[] hms = calculatePrayerHms(target, key, lat, lon, method);
                        if (hms == null) throw new IllegalStateException("Invalid calculated prayer time");
                        Calendar trigger = (Calendar) target.clone();
                        trigger.set(Calendar.HOUR_OF_DAY, hms[0]);
                        trigger.set(Calendar.MINUTE, hms[1]);
                        trigger.set(Calendar.SECOND, hms[2]);
                        trigger.set(Calendar.MILLISECOND, 0);
                        if (trigger.getTimeInMillis() <= System.currentTimeMillis()) {
                            target.add(Calendar.DAY_OF_YEAR, 1);
                            hms = calculatePrayerHms(target, key, lat, lon, method);
                            if (hms == null) throw new IllegalStateException("Invalid calculated prayer time");
                        }
                        persist(context, key, name, hms[0], hms[1], hms[2], soundType, source);
                        Integer reqCode = REQUEST_CODES.get(key);
                        if (reqCode != null) {
                            armAlarmForDate(context, reqCode, key, name, hms[0], hms[1], hms[2],
                                            soundType, source, target);
                        }
                        continue;
                    } catch (Exception ignored) {
                        // Fall back to persisted values only when calculation fails.
                    }
                }

                int hour = sp.getInt(key + "_hour", -1);
                int minute = sp.getInt(key + "_minute", -1);
                int second = sp.getInt(key + "_second", 0);
                if (hour < 0 || minute < 0) continue;
                Integer reqCode = REQUEST_CODES.get(key);
                if (reqCode != null) {
                    armAlarm(context, reqCode, key, name, hour, minute, second, soundType, source);
                }
            }
        } catch (Exception ignore) {}
    }

    private static int[] calculatePrayerHms(Calendar date, String key,
                                            double lat, double lon, int method) {
        double tz = PrayTimeCalculator.timezoneOffsetHours(date);
        PrayTimeCalculator.Times times = PrayTimeCalculator.compute(
                date.get(Calendar.YEAR), date.get(Calendar.MONTH) + 1,
                date.get(Calendar.DAY_OF_MONTH), lat, lon, tz, method, 1);
        double time;
        switch (key) {
            case "fajr": time = times.fajr; break;
            case "dhuhr": time = times.dhuhr; break;
            case "asr": time = times.asr; break;
            case "maghrib": time = times.maghrib; break;
            case "isha": time = times.isha; break;
            default: return null;
        }
        if (Double.isNaN(time) || Double.isInfinite(time)) return null;
        return PrayTimeCalculator.hms(time);
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

    /**
     * Schedule the recalculated prayer for the actual target calendar date.
     * Without this, tomorrow's later clock time can accidentally be armed for today,
     * causing a duplicate adhan a few hours after the current prayer.
     */
    private static void armAlarmForDate(Context context, int reqCode, String key, String name,
                                        int hour, int minute, int second, String soundType,
                                        String source, Calendar targetDate) {
        Calendar target = (Calendar) targetDate.clone();
        target.set(Calendar.HOUR_OF_DAY, hour);
        target.set(Calendar.MINUTE, minute);
        target.set(Calendar.SECOND, second);
        target.set(Calendar.MILLISECOND, 0);
        armAlarmAt(context, reqCode, key, name, hour, minute, second, soundType, source,
                   target.getTimeInMillis());
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

            armAlarmAt(context, reqCode, key, name, hour, minute, second, soundType, source,
                       cal.getTimeInMillis());
        } catch (Exception ignore) {}
    }

    private static void armAlarmAt(Context context, int reqCode, String key, String name,
                                   int hour, int minute, int second, String soundType,
                                   String source, long triggerAtMillis) {
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            Intent intent = new Intent(context, AzanAlarmReceiver.class);
            intent.putExtra("key", key);
            intent.putExtra("name", name);
            intent.putExtra("hour", hour);
            intent.putExtra("minute", minute);
            intent.putExtra("second", second);
            intent.putExtra("soundType", soundType);
            intent.putExtra("source", source);
            intent.putExtra("scheduledAtMillis", triggerAtMillis);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_IMMUTABLE : 0);
            PendingIntent pi = PendingIntent.getBroadcast(context, reqCode, intent, flags);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (am.canScheduleExactAlarms()) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
                } else {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
                }
            } else {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pi);
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
