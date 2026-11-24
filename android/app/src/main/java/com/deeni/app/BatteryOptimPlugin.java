package com.deeni.app;

import android.app.AlarmManager;
import androidx.activity.result.ActivityResult;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.ActivityCallback;

/**
 * إضافة (دفعة ٣٠): سبب واقعي جدًا ومنتشر جدًا في تطبيقات الأذان تحديدًا (خصوصًا على أجهزة شاومي/أوبو/فيفو/هواوي
 * وبعض إصدارات أندرويد المعدَّلة الشائعة في منطقة الخليج) وراء "الإشعارات بتشتغل أحيانًا وأحيانًا لأ من غير أي
 * سبب واضح من كود التطبيق نفسه": نظام "توفير البطارية" (Battery Optimization / Doze) بيقفل التطبيق تمامًا في
 * الخلفية ويمنع أي إيقاظ حتى لو الكود مضبوط ١٠٠٪ صح (RTC_WAKEUP + AllowWhileIdle + Exact Alarm) — الحل الوحيد
 * الحقيقي هو استثناء التطبيق يدويًا من توفير البطارية، وده محتاج نافذة نظام أندرويد رسمية (مش حاجة نقدر
 * نفعّلها تلقائيًا من غير علم المستخدم لأسباب أمان أندرويد نفسها) — الإضافة دي بتوفر زرار من داخل التطبيق
 * يفتح نافذة الاستثناء دي مباشرة بدل ما يدوّر عليها المستخدم في إعدادات الجهاز العامة.
 */
@CapacitorPlugin(name = "BatteryOptim")
public class BatteryOptimPlugin extends Plugin {

    @PluginMethod
    public void isIgnoringBatteryOptimizations(PluginCall call) {
        JSObject ret = new JSObject();
        boolean ignoring = true;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
                ignoring = pm != null && pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
            }
        } catch (Exception e) {
            ignoring = false; // Unknown status must never be reported as an active exemption
        }
        ret.put("ignoring", ignoring);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
            call.resolve();
        } catch (Exception e) {
            // بعض الأجهزة (خصوصًا بعض واجهات الشاومي/هواوي المعدَّلة) بترفض هذا الـ Intent مباشرة —
            // نفتح صفحة تفاصيل التطبيق العامة كبديل بدل ما نفشل بصمت من غير أي رد فعل للمستخدم
            try {
                Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                fallback.setData(Uri.parse("package:" + getContext().getPackageName()));
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
                call.resolve();
            } catch (Exception e2) {
                call.reject("تعذّر فتح إعدادات البطارية");
            }
        }
    }

    /**
     * Android 12+ requires user-approved exact alarms on some installations.
     * Reporting the real status lets the onboarding screen explain why adhan
     * alerts might otherwise be delayed. This does not grant permission.
     */
    @PluginMethod
    public void canScheduleExactAlarms(PluginCall call) {
        JSObject ret = new JSObject();
        boolean allowed = true;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                AlarmManager manager = (AlarmManager) getContext()
                        .getSystemService(Context.ALARM_SERVICE);
                allowed = manager != null && manager.canScheduleExactAlarms();
            }
        } catch (Exception e) {
            allowed = false;
        }
        ret.put("allowed", allowed);
        call.resolve(ret);
    }

    /** Open Android's official exact-alarm access screen on user request. */
    @PluginMethod
    public void requestExactAlarmPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            call.resolve();
            return;
        }
        try {
            Intent settings = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            settings.setData(Uri.parse("package:" + getContext().getPackageName()));
            settings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(settings);
            call.resolve();
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                fallback.setData(Uri.parse("package:" + getContext().getPackageName()));
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
                call.resolve();
            } catch (Exception e2) {
                call.reject("تعذّر فتح إعدادات التنبيهات الدقيقة", e2);
            }
        }
    }
    @PluginMethod
    public void requestStartupBatteryAccess(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                Uri.parse("package:" + getContext().getPackageName()));
        openPermissionSetting(call, intent);
    }

    @PluginMethod
    public void getOverlayStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("allowed", Settings.canDrawOverlays(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void requestOverlayAccess(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getContext().getPackageName()));
        openPermissionSetting(call, intent);
    }

    private void openPermissionSetting(PluginCall call, Intent intent) {
        try {
            startActivityForResult(call, intent, "permissionSettingClosed");
        } catch (Exception error) {
            call.reject("تعذّر فتح إعدادات الإذن", error);
        }
    }

    @ActivityCallback
    private void permissionSettingClosed(PluginCall call, ActivityResult ignored) {
        if (call != null) call.resolve();
    }
}
