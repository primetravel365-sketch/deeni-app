package com.deeni.app;

import java.util.Calendar;

/**
 * Islamic night starts at today's Maghrib and ends at the following day's Fajr.
 * Never calculate night using today's Fajr (which precedes Maghrib).
 */
final class NightTimeCalculator {
    private NightTimeCalculator() {}

    static final class Night {
        final long maghribMillis;
        final long nextFajrMillis;
        final long midpointMillis;
        final long lastThirdMillis;

        Night(long maghrib, long fajr, long midpoint, long lastThird) {
            maghribMillis = maghrib;
            nextFajrMillis = fajr;
            midpointMillis = midpoint;
            lastThirdMillis = lastThird;
        }
    }

    static Night calculate(Calendar today, double lat, double lon, int methodId, int asrFactor) {
        if (!Double.isFinite(lat) || !Double.isFinite(lon) ||
                lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            throw new IllegalArgumentException("Invalid coordinates");
        }
        Calendar tomorrow = (Calendar) today.clone();
        tomorrow.add(Calendar.DAY_OF_YEAR, 1);
        PrayTimeCalculator.Times todayTimes = PrayTimeCalculator.compute(
                today.get(Calendar.YEAR), today.get(Calendar.MONTH) + 1,
                today.get(Calendar.DAY_OF_MONTH), lat, lon,
                PrayTimeCalculator.timezoneOffsetHours(today), methodId, asrFactor);
        PrayTimeCalculator.Times tomorrowTimes = PrayTimeCalculator.compute(
                tomorrow.get(Calendar.YEAR), tomorrow.get(Calendar.MONTH) + 1,
                tomorrow.get(Calendar.DAY_OF_MONTH), lat, lon,
                PrayTimeCalculator.timezoneOffsetHours(tomorrow), methodId, asrFactor);

        long maghrib = atClock(today, todayTimes.maghrib);
        long fajr = atClock(tomorrow, tomorrowTimes.fajr);
        long duration = fajr - maghrib;
        if (duration <= 0 || duration >= 24L * 60 * 60 * 1000) {
            throw new IllegalStateException("Invalid night duration");
        }
        return new Night(maghrib, fajr, maghrib + duration / 2,
                maghrib + (duration * 2) / 3);
    }

    private static long atClock(Calendar date, double decimalHours) {
        if (!Double.isFinite(decimalHours)) {
            throw new IllegalArgumentException("Invalid astronomical prayer time");
        }
        int[] hms = PrayTimeCalculator.hms(decimalHours);
        Calendar time = (Calendar) date.clone();
        time.set(Calendar.HOUR_OF_DAY, hms[0]);
        time.set(Calendar.MINUTE, hms[1]);
        time.set(Calendar.SECOND, hms[2]);
        time.set(Calendar.MILLISECOND, 0);
        return time.getTimeInMillis();
    }
}
