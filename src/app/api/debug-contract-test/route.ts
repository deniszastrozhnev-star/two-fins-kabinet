import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

// Pure pdf-lib, no blob at all — isolating whether pdf-lib itself is what's
// flaky on Vercel (blob put/get alone was confirmed reliable).
export async function GET() {
  try {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 200]);
    page.drawText("diag");
    const pdfBytes = Buffer.from(await doc.save());

    const merged = await PDFDocument.create();
    const sourceDoc = await PDFDocument.load(pdfBytes);
    const copiedPages = await merged.copyPages(sourceDoc, sourceDoc.getPageIndices());
    for (const copiedPage of copiedPages) {
      merged.addPage(copiedPage);
    }
    const mergedBytes = Buffer.from(await merged.save());

    const check = await PDFDocument.load(mergedBytes);

    return NextResponse.json({ ok: true, pages: check.getPageCount(), bytes: mergedBytes.length });
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
