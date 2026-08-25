import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { put, get, del } from "@vercel/blob";

// Inlined on purpose, without importing buildContractPdf (which imports sharp
// at module scope) — isolating whether pdf-lib+blob alone crash, or whether
// it's specifically the sharp import chain.
export async function GET() {
  const steps: string[] = [];
  try {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 200]);
    page.drawText("diag");
    const pdfBytes = Buffer.from(await doc.save());
    steps.push("created source pdf");

    const uploaded = await put(`diagnostics/debug-${Date.now()}.pdf`, pdfBytes, {
      access: "private",
      contentType: "application/pdf",
    });
    steps.push("put to blob: " + uploaded.url);

    const result = await get(uploaded.url, { access: "private" });
    steps.push("get statusCode: " + result?.statusCode);
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error("get() did not return a stream");
    }
    const fetched = Buffer.from(await new Response(result.stream).arrayBuffer());
    steps.push("fetched bytes: " + fetched.length);

    const merged = await PDFDocument.create();
    const sourceDoc = await PDFDocument.load(fetched);
    const copiedPages = await merged.copyPages(sourceDoc, sourceDoc.getPageIndices());
    for (const copiedPage of copiedPages) {
      merged.addPage(copiedPage);
    }
    const mergedBytes = Buffer.from(await merged.save());
    steps.push("merged bytes: " + mergedBytes.length);

    const check = await PDFDocument.load(mergedBytes);
    steps.push("verified pages: " + check.getPageCount());

    await del([uploaded.url]);
    steps.push("cleaned up");

    return NextResponse.json({ ok: true, steps });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        steps,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 },
    );
  }
}
