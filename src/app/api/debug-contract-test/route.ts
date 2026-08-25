import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { put, get, del } from "@vercel/blob";

export async function GET() {
  try {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 200]);
    page.drawText("diag");
    const pdfBytes = Buffer.from(await doc.save());

    const uploaded = await put(`diagnostics/debug-${Date.now()}.pdf`, pdfBytes, {
      access: "private",
      contentType: "application/pdf",
    });

    const result = await get(uploaded.url, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error("get() did not return a stream");
    }
    const fetched = Buffer.from(await new Response(result.stream).arrayBuffer());

    const sizesMatch = fetched.length === pdfBytes.length;

    const merged = await PDFDocument.create();
    const sourceDoc = await PDFDocument.load(fetched);
    const copiedPages = await merged.copyPages(sourceDoc, sourceDoc.getPageIndices());
    for (const copiedPage of copiedPages) {
      merged.addPage(copiedPage);
    }
    const mergedBytes = Buffer.from(await merged.save());

    await del([uploaded.url]);

    return NextResponse.json({
      ok: true,
      originalBytes: pdfBytes.length,
      fetchedBytes: fetched.length,
      sizesMatch,
      mergedBytes: mergedBytes.length,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 },
    );
  }
}
