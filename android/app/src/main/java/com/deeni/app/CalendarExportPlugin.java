package com.deeni.app;

import android.content.ClipData;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

@CapacitorPlugin(name = "CalendarExport")
public class CalendarExportPlugin extends Plugin {
    @PluginMethod
    public void share(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                String title = call.getString("title", "مواقيت الصلاة");
                Intent intent = new Intent(Intent.ACTION_SEND);
                JSArray rows = call.getArray("rows");
                if (rows == null) {
                    intent.setType("text/plain");
                    intent.putExtra(Intent.EXTRA_TEXT, call.getString("text", ""));
                } else {
                    File folder = new File(getContext().getCacheDir(), "calendar");
                    if (!folder.isDirectory() && !folder.mkdirs()) {
                        throw new IOException("Could not create calendar directory");
                    }
                    File file = File.createTempFile("Islamiyat-Calendar-", ".pdf", folder);
                    try (OutputStream output = new FileOutputStream(file)) {
                        writeCalendar(call, output);
                    } catch (Exception error) {
                        file.delete();
                        throw error;
                    }
                    Uri uri = FileProvider.getUriForFile(getContext(),
                            getContext().getPackageName() + ".fileprovider", file);
                    intent.setType("application/pdf");
                    intent.putExtra(Intent.EXTRA_STREAM, uri);
                    intent.setClipData(ClipData.newUri(getContext().getContentResolver(), title, uri));
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                }
                getActivity().startActivity(Intent.createChooser(intent, title));
                call.resolve();
            } catch (Exception error) {
                call.reject("Unable to open sharing", error);
            }
        });
    }

    @PluginMethod
    public void print(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            try {
                String title = call.getString("title", "مواقيت الصلاة");
                PrintManager manager = getActivity().getSystemService(PrintManager.class);
                if (manager == null) {
                    call.reject("Print service unavailable");
                    return;
                }
                manager.print(title, new PrintDocumentAdapter() {
                    @Override
                    public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes,
                            CancellationSignal signal, LayoutResultCallback callback, Bundle extras) {
                        if (signal.isCanceled()) {
                            callback.onLayoutCancelled();
                            return;
                        }
                        callback.onLayoutFinished(new PrintDocumentInfo.Builder("Islamiyat-Calendar.pdf")
                                .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                                .setPageCount(1).build(), !newAttributes.equals(oldAttributes));
                    }

                    @Override
                    public void onWrite(PageRange[] pages, ParcelFileDescriptor destination,
                            CancellationSignal signal, WriteResultCallback callback) {
                        try (OutputStream output = new ParcelFileDescriptor.AutoCloseOutputStream(destination)) {
                            if (signal.isCanceled()) {
                                callback.onWriteCancelled();
                                return;
                            }
                            writeCalendar(call, output);
                        } catch (Exception error) {
                            callback.onWriteFailed("تعذّر إنشاء التقويم");
                            return;
                        }
                        if (signal.isCanceled()) callback.onWriteCancelled();
                        else callback.onWriteFinished(new PageRange[]{new PageRange(0, 0)});
                    }
                }, new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .setColorMode(PrintAttributes.COLOR_MODE_COLOR).build());
                call.resolve();
            } catch (Exception error) {
                call.reject("Unable to open printing", error);
            }
        });
    }

    private void writeCalendar(PluginCall call, OutputStream output) throws Exception {
        JSArray rows = call.getArray("rows");
        if (rows == null || rows.length() < 2 || rows.length() > 32) {
            throw new IOException("Invalid calendar rows");
        }
        String theme = call.getString("theme", "purple");
        int accent = "green".equals(theme) ? 0xff125949
                : "red".equals(theme) ? 0xff792f38 : 0xff51417a;
        PdfDocument pdf = new PdfDocument();
        try {
            PdfDocument.Page page = pdf.startPage(new PdfDocument.PageInfo.Builder(595, 842, 1).create());
            Canvas canvas = page.getCanvas();
            Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
            canvas.drawColor(0xffffffff);
            fill(canvas, paint, 30, 30, 565, 92, accent);
            label(canvas, paint, call.getString("title", "مواقيت الصلاة"), 297.5f, 68, 20, 0xffffffff, true);
            label(canvas, paint, call.getString("location", ""), 297.5f, 111, 11, 0xff454052, false);
            float top = 125;
            float width = 535f / 9f;
            for (int row = 0; row < rows.length(); row++) {
                JSONArray cells = rows.getJSONArray(row);
                if (cells.length() != 9) throw new IOException("Invalid calendar columns");
                float height = row == 0 ? 23 : 19;
                for (int column = 0; column < cells.length(); column++) {
                    float right = 565 - column * width;
                    boolean dateColumn = column < 3;
                    boolean friday = "الجمعة".equals(cells.optString(1));
                    int background = row == 0 ? accent : friday ? 0xfff8ebc9
                            : dateColumn ? (row % 2 == 0 ? 0xffe6efec : 0xffeef6f3)
                            : (row % 2 == 0 ? 0xfff0edf6 : 0xfffaf8fd);
                    fill(canvas, paint, right - width, top, right - 0.5f, top + height - 0.5f, background);
                    label(canvas, paint, cells.getString(column), right - width / 2, top + height / 2 + 4,
                            10, row == 0 ? 0xffffffff : 0xff262334, row == 0 || dateColumn);
                }
                top += height;
            }
            Drawable logo = getContext().getApplicationInfo().loadIcon(getContext().getPackageManager());
            logo.setBounds(new Rect(317, 764, 352, 799));
            logo.setAlpha(150);
            logo.draw(canvas);
            label(canvas, paint, "إسلاميات", 278, 788, 17, 0xff6b6251, true);
            pdf.finishPage(page);
            pdf.writeTo(output);
        } finally {
            pdf.close();
        }
    }

    private static void fill(Canvas canvas, Paint paint, float left, float top,
            float right, float bottom, int color) {
        paint.setColor(color);
        canvas.drawRect(left, top, right, bottom, paint);
    }

    private static void label(Canvas canvas, Paint paint, String text, float center, float baseline,
            float size, int color, boolean bold) {
        TextPaint textPaint = new TextPaint(paint);
        textPaint.setTypeface(bold ? Typeface.DEFAULT_BOLD : Typeface.DEFAULT);
        textPaint.setTextSize(size);
        textPaint.setColor(color);
        int width = (int) Math.ceil(Layout.getDesiredWidth(text, textPaint)) + 2;
        StaticLayout layout = StaticLayout.Builder.obtain(text, 0, text.length(), textPaint, width)
                .setAlignment(Layout.Alignment.ALIGN_CENTER).setIncludePad(false).build();
        canvas.save();
        canvas.translate(center - width / 2f, baseline - layout.getLineBaseline(0));
        layout.draw(canvas);
        canvas.restore();
    }
}
