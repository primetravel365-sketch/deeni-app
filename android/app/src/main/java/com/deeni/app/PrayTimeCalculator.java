package com.deeni.app;

import java.util.Calendar;
import java.util.TimeZone;

/**
 * حساب مواقيت الصلاة فلكيًا محليًا (بدون إنترنت) — نفس المعادلة الفلكية العامة
 * (موقع الشمس + معادلة الزمن) التي تعتمد عليها أغلب حاسبات مواقيت الصلاة، بما فيها APIs
 * مثل Aladhan. الهدف: تقليل الفرق عن الوقت الحقيقي لأقل درجة ممكنة حتى لو لم يُفتح
 * التطبيق لعدة أيام.
 */
class PrayTimeCalculator {

    // زوايا الحساب لكل طريقة (id مطابق لأكواد Aladhan method) — [fajrAngle, ishaAngle]
    // ishaAngle = -1 يعني "دقائق بعد المغرب" بدل زاوية (زي أم القرى)
    static double[] anglesForMethod(int methodId) {
        switch (methodId) {
            case 16: return new double[]{18.2, 18.2};   // Dubai
            case 4:  return new double[]{18.5, -90};    // Umm al-Qura (Makkah) — 90 دقيقة بعد المغرب
            case 3:  return new double[]{18, 17};        // Muslim World League
            case 5:  return new double[]{19.5, 17.5};    // Egyptian General Authority
            case 1:  return new double[]{18, 18};         // University of Islamic Sciences, Karachi
            case 2:  return new double[]{15, 15};         // ISNA
            case 15: return new double[]{18, 18};         // Moonsighting Committee (تقريبي)
            default: return new double[]{18.2, 18.2};    // افتراضي: Dubai
        }
    }

    static class Times {
        double fajr, sunrise, dhuhr, asr, maghrib, isha;
    }

    /** يحسب المواقيت الست (بالساعات العشرية، توقيت محلي) ليوم معيّن عند إحداثيات معيّنة. */
    static Times compute(int year, int month, int day, double lat, double lng, double tzHours,
                          int methodId, int asrFactor) {
        double[] angles = anglesForMethod(methodId);
        double fajrAngle = angles[0];
        double ishaAngle = angles[1];

        double jd = julianDate(year, month, day) - lng / (15.0 * 24.0);

        double[] sun = sunPosition(jd);
        double decl = sun[0];
        double eqt = sun[1];

        double dhuhr = fixHour(12 - eqt);
        double asr = dhuhr + asrTime(asrFactor, decl, lat);
        double sunrise = dhuhr - sunAngleTime(0.833, decl, lat, true);
        double maghrib = dhuhr + sunAngleTime(0.833, decl, lat, false);
        double fajr = dhuhr - sunAngleTime(fajrAngle, decl, lat, true);
        double isha;
        if (ishaAngle < 0) {
            isha = maghrib + (-ishaAngle) / 60.0; // دقائق بعد المغرب
        } else {
            isha = dhuhr + sunAngleTime(ishaAngle, decl, lat, false);
        }

        Times t = new Times();
        t.fajr = fixHour(fajr + tzHours - lng / 15.0);
        t.sunrise = fixHour(sunrise + tzHours - lng / 15.0);
        t.dhuhr = fixHour(dhuhr + tzHours - lng / 15.0);
        t.asr = fixHour(asr + tzHours - lng / 15.0);
        t.maghrib = fixHour(maghrib + tzHours - lng / 15.0);
        t.isha = fixHour(isha + tzHours - lng / 15.0);
        return t;
    }

    /** يرجع {hour, minute, second} صحيحة لوقت صلاة معيّن، لتاريخ اليوم أو غدًا. */
    static int[] hms(double decimalHours) {
        decimalHours = fixHour(decimalHours);
        int h = (int) decimalHours;
        double mFull = (decimalHours - h) * 60;
        int m = (int) mFull;
        int s = (int) Math.round((mFull - m) * 60);
        if (s == 60) { s = 0; m++; }
        if (m == 60) { m = 0; h++; }
        if (h == 24) h = 0;
        return new int[]{h, m, s};
    }

    // ---------- فلك أساسي (معادلات عامة معروفة — موقع الشمس / معادلة الزمن) ----------

    private static double julianDate(int year, int month, int day) {
        if (month <= 2) { year -= 1; month += 12; }
        double a = Math.floor(year / 100.0);
        double b = 2 - a + Math.floor(a / 4.0);
        return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
    }

    private static double[] sunPosition(double jd) {
        double d = jd - 2451545.0;
        double g = fixAngle(357.529 + 0.98560028 * d);
        double q = fixAngle(280.459 + 0.98564736 * d);
        double l = fixAngle(q + 1.915 * dsin(g) + 0.020 * dsin(2 * g));
        double e = 23.439 - 0.00000036 * d;
        double ra = darctan2(dcos(e) * dsin(l), dcos(l)) / 15.0;
        ra = fixHour(ra);
        double decl = darcsin(dsin(e) * dsin(l));
        double eqt = q / 15.0 - ra;
        return new double[]{decl, eqt};
    }

    private static double sunAngleTime(double angle, double decl, double lat, boolean morning) {
        double val = (-dsin(angle) - dsin(lat) * dsin(decl)) / (dcos(lat) * dcos(decl));
        val = Math.max(-1, Math.min(1, val));
        double h = darccos(val) / 15.0;
        return h;
    }

    private static double asrTime(int factor, double decl, double lat) {
        double val = darccot(factor + dtan(Math.abs(lat - decl)));
        return val / 15.0;
    }

    private static double fixHour(double v) { v = v - 24.0 * Math.floor(v / 24.0); return v; }
    private static double fixAngle(double v) { v = v - 360.0 * Math.floor(v / 360.0); return v; }
    private static double dsin(double d) { return Math.sin(Math.toRadians(d)); }
    private static double dcos(double d) { return Math.cos(Math.toRadians(d)); }
    private static double dtan(double d) { return Math.tan(Math.toRadians(d)); }
    private static double darcsin(double x) { return Math.toDegrees(Math.asin(x)); }
    private static double darccos(double x) { return Math.toDegrees(Math.acos(x)); }
    private static double darctan2(double y, double x) { return Math.toDegrees(Math.atan2(y, x)); }
    private static double darccot(double x) { return Math.toDegrees(Math.atan(1.0 / x)); }

    /** فرق التوقيت المحلي عن UTC بالساعات، للتاريخ المعطى (يراعي التوقيت الصيفي لو موجود). */
    static double timezoneOffsetHours(Calendar cal) {
        TimeZone tz = TimeZone.getDefault();
        return tz.getOffset(cal.getTimeInMillis()) / 3600000.0;
    }
}
