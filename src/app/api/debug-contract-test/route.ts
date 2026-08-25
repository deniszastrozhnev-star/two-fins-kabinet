import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { put, get, del } from "@vercel/blob";
import { buildContractPdf } from "@/lib/contractPdf";

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

    const merged = await buildContractPdf([{ buffer: fetched, contentType: "application/pdf" }]);
    steps.push("merged bytes: " + merged.length);

    const check = await PDFDocument.load(merged);
    steps.push("verified pages: " + check.getPageCount());

    const finalBlob = await put(`diagnostics/debug-final-${Date.now()}.pdf`, merged, {
      access: "private",
      contentType: "application/pdf",
    });
    steps.push("final put: " + finalBlob.url);

    await del([uploaded.url, finalBlob.url]);
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
