package com.deeni.app;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

/**
 * إضافة (دفعة ٣٥): جزء من إصلاح صوت الأذان الحقيقي — بعد ما اكتُشف إن قائمة اختيار المؤذن (٢٢ صوت) كانت
 * "للمعاينة بس" وغير مربوطة خالص بالصوت الفعلي المجدول وقت الأذان، طلب المستخدم صراحة تعديلًا أعمق يخلي
 * صوت المؤذن المُختار فعليًا هو اللي بيتشغّل وقت الأذان، مش إعلان قصير ثابت.
 *
 * السبب التقني اللي بيمنع ده افتراضيًا: قنوات إشعارات أندرويد (NotificationChannel) بتحتاج ملف صوت إما (أ)
 * مُضمَّن جوه التطبيق وقت البناء (res/raw) أو (ب) رابط content:// قابل للقراءة من عملية النظام. أصوات
 * المؤذنين الـ٢٢ كلها روابط بث حقيقية على الإنترنت (cdn.aladhan.com/assabile.com/praytimes.org) — مش ملفات
 * مُضمَّنة، فمينفعش تتحط كـ"sound" مباشرة في قناة إشعار.
 *
 * الحل: بجانب التعديل ده، الجافاسكريبت بينزّل صوت المؤذن المُختار فعليًا على جهاز المستخدم نفسه (عبر
 * @capacitor/filesystem، باستخدام إنترنت الجهاز الحقيقي — التنزيل بيحصل مرة واحدة بس لكل مؤذن، ومتخزّن محليًا
 * بعد كده) في مجلد الكاش الخاص بالتطبيق، وبعدين بيستدعي الإضافة دي (`getContentUri`) للحصول على رابط
 * content:// آمن للملف المتنزّل ده عبر FileProvider الموجود من قبل في المشروع (استخدام مماثل تمامًا
 * لمشاركة واتساب من دفعة ٣٠) — والرابط ده هو اللي بيتحط كـ"sound" وقت إنشاء قناة الإشعار (بعد تعديل مماثل
 * في NotificationChannelManager.java عبر patch-package، عشان يقبل روابط content:// كاملة مش بس أسماء ملفات
 * raw resource).
 *
 * ⚠️ ملحوظة أمانة: التعديل ده جديد كليًا ومافيش جهاز أندرويد حقيقي متاح للاختبار عليه قبل الإرسال — كل خطوة
 * هنا ملفوفة بمعالجة أخطاء كاملة (try/catch) فالأسوأ اللي ممكن يحصل لو فيه مشكلة (صلاحيات، توافق إصدار أندرويد
 * قديم، إلخ) هو رجوع تلقائي للسلوك القديم (الإعلان الصوتي القصير) من غير أي عطل أو تعليق في التطبيق.
 */
@CapacitorPlugin(name = "AzanSound")
public class AzanSoundPlugin extends Plugin {

    @PluginMethod
    public void getContentUri(PluginCall call) {
        String relativePath = call.getString("path"); // مسار نسبي جوه مجلد الكاش الخاص بالتطبيق، مثال: "azan/muezzin_3.mp3"
        if (relativePath == null || relativePath.isEmpty()) {
            call.reject("path is required");
            return;
        }
        try {
            Context context = getContext();
            File file = new File(context.getCacheDir(), relativePath);
            if (!file.exists() || file.length() <= 0) {
                call.reject("cached file not found or empty");
                return;
            }
            Uri uri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", file);
            // منح صلاحية قراءة صريحة لواجهة النظام المسؤولة عن تشغيل صوت الإشعار — بعض إصدارات/واجهات أندرويد
            // محتاجة الصلاحية دي صريحة حتى لو الـFileProvider نفسه grantUriPermissions="true" بشكل عام
            try {
                context.grantUriPermission("com.android.systemui", uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } catch (Exception ignore) {
                // بعض الأجهزة/الواجهات المعدَّلة ممكن ترفض المنح الصريح ده — مش لازم يوقف باقي العملية
            }
            JSObject ret = new JSObject();
            ret.put("uri", uri.toString());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("failed to build content uri: " + e.getMessage());
        }
    }
}
