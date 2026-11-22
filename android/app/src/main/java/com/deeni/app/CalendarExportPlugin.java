package com.deeni.app;

import android.content.Intent;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CalendarExport")
public class CalendarExportPlugin extends Plugin {
    @PluginMethod
    public void share(PluginCall call) {
        String title = call.getString("title", "مواقيت الصلاة");
        String text = call.getString("text", "");
        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = new Intent(Intent.ACTION_SEND);
                intent.setType("text/plain");
                intent.putExtra(Intent.EXTRA_TEXT, text);
                getActivity().startActivity(Intent.createChooser(intent, title));
                call.resolve();
            } catch (Exception error) {
                call.reject("Unable to open sharing", error);
            }
        });
    }

    @PluginMethod
    public void print(PluginCall call) {
        String title = call.getString("title", "مواقيت الصلاة");
        String html = call.getString("html", "");
        getActivity().runOnUiThread(() -> {
            try {
                PrintManager manager = getActivity().getSystemService(PrintManager.class);
                if (manager == null) {
                    call.reject("Print service unavailable");
                    return;
                }
                WebView document = new WebView(getActivity());
                document.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        view.setWebViewClient(new WebViewClient());
                        try {
                            manager.print(title, view.createPrintDocumentAdapter(title),
                                    new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
                            call.resolve();
                        } catch (Exception error) {
                            view.destroy();
                            call.reject("Unable to open printing", error);
                        }
                    }
                });
                document.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
            } catch (Exception error) {
                call.reject("Unable to prepare calendar", error);
            }
        });
    }
}
