import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { upload } from "@vercel/blob/client";
import { get, del } from "@vercel/blob";
import { buildContractPdf } from "@/lib/contractPdf";

// Identical to the previous diagnostic, except it now imports the REAL
// buildContractPdf (which unconditionally imports sharp at module scope,
// even though this PDF-only path never calls it) — isolating whether that
// unused import alone is what's crashing cold Vercel lambdas.
export async function GET(request: Request) {
  try {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 200]);
    page.drawText("diag");
    const pdfBytes = Buffer.from(await doc.save());

    const origin = new URL(request.url).origin;
    const cookie = request.headers.get("cookie") ?? "";

    const blob = await upload(`contract-pages/diag-${Date.now()}.pdf`, pdfBytes, {
      access: "private",
      handleUploadUrl: `${origin}/api/contracts/upload-token`,
      contentType: "application/pdf",
      headers: { cookie },
    });

    const result = await get(blob.url, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error("get() did not return a stream");
    }
    const fetched = Buffer.from(await new Response(result.stream).arrayBuffer());

    const mergedBytes = await buildContractPdf([
      { buffer: fetched, contentType: "application/pdf" },
    ]);

    await del([blob.url]);

    return NextResponse.json({
      ok: true,
      originalBytes: pdfBytes.length,
      fetchedBytes: fetched.length,
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
