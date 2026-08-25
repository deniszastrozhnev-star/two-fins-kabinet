import { NextResponse } from "next/server";
import { put, get, del } from "@vercel/blob";

// Even more isolated: no pdf-lib at all, just blob put/get to see if that
// alone is what's crashing on Vercel (works fine locally either way).
export async function GET() {
  const steps: string[] = [];
  try {
    const uploaded = await put(`diagnostics/debug-${Date.now()}.txt`, "hello", {
      access: "private",
      contentType: "text/plain",
    });
    steps.push("put: " + uploaded.url);

    const result = await get(uploaded.url, { access: "private" });
    steps.push("get statusCode: " + result?.statusCode);
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error("get() did not return a stream");
    }
    const fetched = Buffer.from(await new Response(result.stream).arrayBuffer());
    steps.push("fetched bytes: " + fetched.length + " content: " + fetched.toString("utf8"));

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
