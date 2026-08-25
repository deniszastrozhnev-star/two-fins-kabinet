import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { upload } from "@vercel/blob/client";
import { get, del } from "@vercel/blob";

// Mimics the REAL production flow as closely as possible: client-token-based
// direct upload (same as the browser does via ContractUpload.tsx), not the
// server-side put() the earlier diagnostics used — those are different code
// paths in @vercel/blob and may behave differently on Vercel.
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

    const merged = await PDFDocument.create();
    const sourceDoc = await PDFDocument.load(fetched);
    const copiedPages = await merged.copyPages(sourceDoc, sourceDoc.getPageIndices());
    for (const copiedPage of copiedPages) {
      merged.addPage(copiedPage);
    }
    const mergedBytes = Buffer.from(await merged.save());

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
