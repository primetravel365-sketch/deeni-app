package com.deeni.app;

import org.junit.Test;
import java.util.Calendar;
import java.util.TimeZone;
import static org.junit.Assert.*;

/** Verifies night spans today's Maghrib through the next day's Fajr. */
public class NightTimeCalculatorTest {
    @Test
    public void midnightAndLastThirdWithinNight() {
        Calendar day = Calendar.getInstance(TimeZone.getTimeZone("Asia/Dubai"));
        day.clear();
        day.set(2026, Calendar.NOVEMBER, 21, 12, 0, 0);
        NightTimeCalculator.Night n =
            NightTimeCalculator.calculate(day, 25.2048, 55.2708, 16, 1);
        long night = n.nextFajrMillis - n.maghribMillis;
        assertTrue("Night must last longer than six hours", night > 6 * 3600000L);
        assertTrue("Night must be shorter than 18 hours", night < 18 * 3600000L);
        assertEquals(n.maghribMillis + night / 2, n.midpointMillis);
        assertEquals(n.maghribMillis + 2 * night / 3, n.lastThirdMillis);
        assertTrue(n.maghribMillis < n.midpointMillis);
        assertTrue(n.midpointMillis < n.lastThirdMillis);
        assertTrue(n.lastThirdMillis < n.nextFajrMillis);
    }

    @Test
    public void localNightChangesWithLocation() {
        Calendar day = Calendar.getInstance(TimeZone.getTimeZone("Asia/Dubai"));
        day.clear();
        day.set(2026, Calendar.NOVEMBER, 21, 12, 0, 0);
        NightTimeCalculator.Night dubai = NightTimeCalculator.calculate(day, 25.20, 55.27, 16, 1);
        NightTimeCalculator.Night abuDhabi = NightTimeCalculator.calculate(day, 24.45, 54.37, 16, 1);
        assertNotEquals(dubai.maghribMillis, abuDhabi.maghribMillis);
    }
}
