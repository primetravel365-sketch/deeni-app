package com.deeni.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;

/**
 * دفعة ٦٣: خدمة أمامية (Foreground Service) بتشغّل صوت الأذان الكامل فعليًا بنفسها عبر MediaPlayer،
 * بدل الاعتماد على "صوت قناة إشعار" (NotificationChannel.sound) زي ما كان الحال قبل كده.
 *
 * السبب الجذري الحقيقي للمشكلة ("الله أكبر الله أكبر" ثم توقف مفاجئ في كل الصلوات): أندرويد بيوقف صوت
 * قناة الإشعار تلقائيًا بعد ثواني قليلة جدًا (٤-٦ ثواني تقريبًا، مرتبط بمدة ظهور نافذة الإشعار المنبثقة
 * heads-up ثم اختفائها) — لأن قنوات الإشعارات (NotificationChannel) مصمَّمة أصلًا لنغمات تنبيه قصيرة،
 * مش لتسجيل أذان كامل ممكن ياخد دقيقة أو أكتر. هذا خطأ معماري حقيقي في الطريقة اللي كان بيتشغّل بيها
 * الأذان الكامل من البداية (موثّق بصراحة في تعليق AzanSoundPlugin.java القديم كتعديل غير مُختبَر على جهاز
 * حقيقي وقت إضافته). الحل الصحيح المتّبع في تطبيقات الأذان الاحترافية: تشغيل الصوت بمشغّل مستقل
 * (MediaPlayer) جوه خدمة تفضل شغالة لحد ما الأذان يخلص طبيعيًا، بعيدًا تمامًا عن دورة حياة أي إشعار.
 */
public class AzanPlaybackService extends Service {

    private static final String CHANNEL_ID = "azan_playback_fg_v1";
    private static final int NOTIF_ID = 7801;
    private static final long MAX_DURATION_MS = 6 * 60 * 1000; // حد أقصى أمان (٦ دقايق) لو فشل onCompletion لأي سبب
    private static final String ACTION_STOP = "com.deeni.app.action.STOP_AZAN";

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private Handler failSafeHandler;
    private Runnable failSafeRunnable;
    private boolean fajrFollowupStarted;
    private String activePrayerKey;
    private long scheduledAtMillis;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelfSafely();
            return START_NOT_STICKY;
        }

        // A second alarm can reach the same Service instance while a previous
        // recording is still playing. Release the old player and callbacks first
        // so that overlapping audio and stale timeout callbacks cannot accumulate.
        releasePlaybackResources();

        fajrFollowupStarted = false;
        activePrayerKey = intent != null ? intent.getStringExtra("key") : null;
        scheduledAtMillis = intent == null ? 0L : intent.getLongExtra("prayerAtMillis",
                intent.getLongExtra("scheduledAtMillis", 0L));
        String prayerName = intent != null ? intent.getStringExtra("name") : null;
        String soundType = intent != null ? intent.getStringExtra("soundType") : null;
        String source = intent != null ? intent.getStringExtra("source") : null;

        ensureChannel();
        try {
            startForeground(NOTIF_ID, buildNotification(prayerName));
        } catch (Exception ignore) {}

        Uri adhan = resolveUri(soundType, source);
        if (adhan == null) {
            stopSelfSafely();
            return START_NOT_STICKY;
        }
        acquireWakeLock();
        failSafeHandler = new Handler(Looper.getMainLooper());
        failSafeRunnable = this::stopSelfSafely;
        failSafeHandler.postDelayed(failSafeRunnable, MAX_DURATION_MS);
        playPrayerSequence(adhan);
        return START_NOT_STICKY;
    }

    private void playPrayerSequence(Uri adhan) {
        int lead = AzanScheduler.announcementLeadMillis(activePrayerKey);
        Uri announcement = lead == 0 ? null : resolveUri("bundled", "adhan_" + activePrayerKey + "_now");
        long remaining = Math.max(0L, scheduledAtMillis - System.currentTimeMillis());
        if (announcement == null) {
            if (lead != 0 && remaining > 0L) {
                failSafeHandler.postDelayed(() -> startAdhan(adhan), remaining);
            } else {
                startAdhan(adhan);
            }
            return;
        }
        try {
            preparePlayer(announcement);
            mediaPlayer.setOnCompletionListener(player ->
                    failSafeHandler.postDelayed(() -> startAdhan(adhan), 2000L));
            mediaPlayer.setOnErrorListener((player, what, extra) -> {
                failSafeHandler.postDelayed(() -> startAdhan(adhan),
                        Math.max(0L, scheduledAtMillis - System.currentTimeMillis()));
                return true;
            });
            mediaPlayer.start();
        } catch (Exception error) {
            failSafeHandler.postDelayed(() -> startAdhan(adhan),
                    Math.max(0L, scheduledAtMillis - System.currentTimeMillis()));
        }
    }

    private void preparePlayer(Uri source) throws Exception {
        if (mediaPlayer != null) mediaPlayer.release();
        mediaPlayer = new MediaPlayer();
        mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build());
        mediaPlayer.setDataSource(getApplicationContext(), source);
        mediaPlayer.prepare();
    }

    private void startAdhan(Uri source) {
        try {
            preparePlayer(source);
            mediaPlayer.setOnCompletionListener(player -> {
                if (!tryStartFajrFollowup(player)) startPostAdhanDua();
            });
            mediaPlayer.setOnErrorListener((player, what, extra) -> {
                stopSelfSafely();
                return true;
            });
            mediaPlayer.start();
        } catch (Exception error) {
            stopSelfSafely();
        }
    }

    /**
     * Plays the Fajr phrase once after the complete Fajr adhan and before
     * the actual iqama, only if the user supplied a real iqama interval.
     * Missing local audio means no follow-up; never starts a network stream.
     */
    private boolean tryStartFajrFollowup(MediaPlayer player) {
        if (fajrFollowupStarted || !"fajr".equals(activePrayerKey)
                || scheduledAtMillis <= 0L) return false;
        int rawId = getResources().getIdentifier(
                "fajr_khayr_min_al_nawm", "raw", getPackageName());
        if (rawId == 0) return false;
        android.content.SharedPreferences preferences =
                getSharedPreferences("deeni_fajr_followup_v1", Context.MODE_PRIVATE);
        int iqamaMinutes = preferences.getInt("iqamaMinutes", 0);
        if (iqamaMinutes < 1 || iqamaMinutes > 180) return false;
        long now = System.currentTimeMillis();
        // Allow the bundled 33.4-second clip to finish before iqama.
        long deadline = scheduledAtMillis + iqamaMinutes * 60000L;
        if (now < scheduledAtMillis) return false;
        if (now + 95000L >= deadline && now + 35000L >= deadline) return false;
        java.text.SimpleDateFormat formatter = new java.text.SimpleDateFormat(
                "yyyy-MM-dd", java.util.Locale.ROOT);
        String date = formatter.format(new java.util.Date(scheduledAtMillis));
        if (date.equals(preferences.getString("lastPlayedDay", ""))) return false;
        try {
            fajrFollowupStarted = true;
            player.reset();
            player.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build());
            player.setDataSource(getApplicationContext(), Uri.parse(
                    "android.resource://" + getPackageName() + "/" + rawId));
            player.setOnCompletionListener(mp -> startPostAdhanDua());
            player.setOnErrorListener((mp, what, extra) -> {
                startPostAdhanDua();
                return true;
            });
            player.prepare();
            if (System.currentTimeMillis() + player.getDuration() + 500L >= deadline
                    || !preferences.edit().putString("lastPlayedDay", date).commit()) {
                startPostAdhanDua();
                return true;
            }
            player.start();
            return true;
        } catch (Exception e) {
            startPostAdhanDua();
            return true;
        }
    }

    private void startPostAdhanDua() {
        if (!"fajr".equals(activePrayerKey) && !"dhuhr".equals(activePrayerKey)
                && !"asr".equals(activePrayerKey) && !"maghrib".equals(activePrayerKey)
                && !"isha".equals(activePrayerKey)) {
            stopSelfSafely();
            return;
        }
        Uri dua = resolveUri("bundled", "post_adhan_dua");
        if (dua == null) {
            stopSelfSafely();
            return;
        }
        try {
            preparePlayer(dua);
            mediaPlayer.setOnCompletionListener(player -> stopSelfSafely());
            mediaPlayer.setOnErrorListener((player, what, extra) -> {
                stopSelfSafely();
                return true;
            });
            failSafeHandler.removeCallbacks(failSafeRunnable);
            failSafeHandler.postDelayed(failSafeRunnable, mediaPlayer.getDuration() + 5000L);
            mediaPlayer.start();
        } catch (Exception error) {
            stopSelfSafely();
        }
    }

    private Uri resolveUri(String soundType, String source) {
        if (source == null || source.length() == 0) return null;
        try {
            if ("real".equals(soundType)) {
                // Never stream the adhan. Only a locally cached content URI is allowed.
                Uri local = Uri.parse(source);
                return "content".equalsIgnoreCase(local.getScheme()) ? local : null;
            }
            if (!"bundled".equals(soundType) || !source.matches("[a-z][a-z0-9_]*")) {
                return null;
            }
            // Fail clearly when a selected bundled voice was not packaged in res/raw.
            int rawId = getResources().getIdentifier(source, "raw", getPackageName());
            return rawId == 0 ? null : Uri.parse("android.resource://" + getPackageName() + "/" + rawId);
        } catch (Exception e) {
            return null;
        }
    }

    private void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "deeni:azan_playback");
                wakeLock.acquire(MAX_DURATION_MS + 5000);
            }
        } catch (Exception ignore) {}
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null && nm.getNotificationChannel(CHANNEL_ID) == null) {
                NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "تشغيل الأذان الكامل",
                        NotificationManager.IMPORTANCE_LOW);
                ch.setDescription("إشعار مرافق أثناء تشغيل صوت الأذان الكامل — بدون صوت خاص به (الصوت الفعلي بيتشغّل بشكل مستقل عن الإشعار نفسه)");
                ch.setSound(null, null);
                nm.createNotificationChannel(ch);
            }
        }
    }

    private Notification buildNotification(String prayerName) {
        Intent stopIntent = new Intent(this, AzanPlaybackService.class);
        stopIntent.setAction(ACTION_STOP);
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT
                | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent stopPending = PendingIntent.getService(this, 7802, stopIntent, piFlags);

        String title = prayerName != null ? ((activePrayerKey != null && activePrayerKey.startsWith("iqama_") ? "إقامة " : "أذان ") + prayerName + " 🕌") : "أذان 🕌";
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setOnlyAlertOnce(true)
                .setContentText("جاري تشغيل تنبيه الصلاة — اضغط إيقاف")
                .setSmallIcon(getApplicationInfo().icon)
                .setOngoing(true)
                .setContentIntent(stopPending)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .addAction(0, "إيقاف", stopPending)
                .build();
    }

    private void releasePlaybackResources() {
        try {
            if (failSafeHandler != null && failSafeRunnable != null) {
                failSafeHandler.removeCallbacksAndMessages(null);
            }
        } catch (Exception ignore) {}
        failSafeRunnable = null;
        failSafeHandler = null;

        MediaPlayer player = mediaPlayer;
        mediaPlayer = null;
        if (player != null) {
            try {
                if (player.isPlaying()) player.stop();
            } catch (Exception ignore) {}
            try {
                player.release();
            } catch (Exception ignore) {}
        }

        PowerManager.WakeLock lock = wakeLock;
        wakeLock = null;
        if (lock != null) {
            try {
                if (lock.isHeld()) lock.release();
            } catch (Exception ignore) {}
        }
    }

    private void stopSelfSafely() {
        releasePlaybackResources();
        try {
            stopForeground(true);
        } catch (Exception ignore) {}
        stopSelf();
    }

    @Override
    public void onDestroy() {
        releasePlaybackResources();
        super.onDestroy();
    }
}

