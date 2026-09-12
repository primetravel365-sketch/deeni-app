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

        String prayerName = intent != null ? intent.getStringExtra("name") : null;
        String soundType = intent != null ? intent.getStringExtra("soundType") : null;
        String source = intent != null ? intent.getStringExtra("source") : null;

        ensureChannel();
        try {
            startForeground(NOTIF_ID, buildNotification(prayerName));
        } catch (Exception ignore) {}

        try {
            Uri uri = resolveUri(soundType, source);
            if (uri == null) {
                stopSelfSafely();
                return START_NOT_STICKY;
            }

            acquireWakeLock();

            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build());
            mediaPlayer.setDataSource(getApplicationContext(), uri);
            mediaPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                @Override
                public void onCompletion(MediaPlayer mp) {
                    stopSelfSafely();
                }
            });
            mediaPlayer.setOnErrorListener(new MediaPlayer.OnErrorListener() {
                @Override
                public boolean onError(MediaPlayer mp, int what, int extra) {
                    stopSelfSafely();
                    return true;
                }
            });
            mediaPlayer.prepare();
            mediaPlayer.start();

            failSafeHandler = new Handler(Looper.getMainLooper());
            failSafeRunnable = new Runnable() {
                @Override
                public void run() {
                    stopSelfSafely();
                }
            };
            failSafeHandler.postDelayed(failSafeRunnable, MAX_DURATION_MS);
        } catch (Exception e) {
            stopSelfSafely();
        }
        return START_NOT_STICKY;
    }

    private Uri resolveUri(String soundType, String source) {
        if (source == null || source.length() == 0) return null;
        try {
            if ("real".equals(soundType)) {
                return Uri.parse(source); // content:// URI جاهز من ملف مؤذن مُنزَّل مسبقًا
            }
            // "bundled" — اسم مورد raw مُضمَّن جوه التطبيق (بدون امتداد)
            return Uri.parse("android.resource://" + getPackageName() + "/raw/" + source);
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

        String title = prayerName != null ? ("أذان " + prayerName + " 🕌") : "أذان 🕌";
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText("جاري تشغيل الأذان الكامل — اضغط إيقاف للسكوت")
                .setSmallIcon(getApplicationInfo().icon)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .addAction(0, "إيقاف", stopPending)
                .build();
    }

    private void stopSelfSafely() {
        try {
            if (failSafeHandler != null && failSafeRunnable != null) {
                failSafeHandler.removeCallbacks(failSafeRunnable);
            }
        } catch (Exception ignore) {}
        try {
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
                mediaPlayer.release();
                mediaPlayer = null;
            }
        } catch (Exception ignore) {}
        try {
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        } catch (Exception ignore) {}
        try {
            stopForeground(true);
        } catch (Exception ignore) {}
        try {
            stopSelf();
        } catch (Exception ignore) {}
    }

    @Override
    public void onDestroy() {
        stopSelfSafely();
        super.onDestroy();
    }
}
