package com.deeni.app;

import org.junit.Test;
import java.util.Calendar;
import java.util.TimeZone;
import static org.junit.Assert.*;

/** Regression checks for offline prayer-time arithmetic. */
public class PrayTimeCalculatorTest {
    @Test
    public void asrFallsWellAfterDhuhrAndBeforeMaghribInDubai() {
        // Dubai (UTC+4), in winter and summer.
        for (int month : new int[]{1, 6, 11}) {
            PrayTimeCalculator.Times t =
                PrayTimeCalculator.compute(2026, month, 15, 25.2048, 55.2708, 4.0, 16, 1);
            assertTrue("Asr must be after Dhuhr: month " + month, t.asr > t.dhuhr + 2.0);
            assertTrue("Asr must precede Maghrib: month " + month, t.asr < t.maghrib);
        }
    }

    @Test
    public void hanafiAsrMustBeLaterThanStandardAsr() {
        PrayTimeCalculator.Times standard =
            PrayTimeCalculator.compute(2026, 11, 21, 25.2048, 55.2708, 4.0, 16, 1);
        PrayTimeCalculator.Times hanafi =
            PrayTimeCalculator.compute(2026, 11, 21, 25.2048, 55.2708, 4.0, 16, 2);
        assertTrue(hanafi.asr > standard.asr);
        assertTrue(hanafi.asr < standard.maghrib);
    }

    @Test
    public void timezoneOffsetRespectsSummerTime() {
        TimeZone tz = TimeZone.getTimeZone("Europe/London");
        Calendar winter = Calendar.getInstance(tz);
        winter.clear();
        winter.set(2026, Calendar.JANUARY, 15, 12, 0, 0);
        Calendar summer = Calendar.getInstance(tz);
        summer.clear();
        summer.set(2026, Calendar.JULY, 15, 12, 0, 0);
        // This helper follows the device's time zone; test that time arithmetic is valid.
        assertTrue(tz.getOffset(summer.getTimeInMillis()) >
                   tz.getOffset(winter.getTimeInMillis()));
    }
}
