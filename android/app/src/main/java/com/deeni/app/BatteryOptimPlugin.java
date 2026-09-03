package com.deeni.app;

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
            ignoring = true; // لو حصل خطأ غير متوقع، منمنعش المستخدم من باقي التطبيق بسبب فحص إضافي
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
}
