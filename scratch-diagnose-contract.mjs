import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { list, get } from "@vercel/blob";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

const listed = await list({ prefix: "contract-pages/", limit: 1000 });
const items = listed.blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
console.log("total blobs:", items.length);
console.log(
  "found blobs:",
  items.slice(0, 5).map((b) => ({ url: b.url, uploadedAt: b.uploadedAt, size: b.size })),
);

if (items.length === 0) {
  console.log("NO BLOBS FOUND — cleanup may have run, or upload failed before reaching blob storage");
  process.exit(0);
}

const target = items[0];
const result = await get(target.url, { access: "private" });
const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
console.log("downloaded buffer size:", buffer.length);

try {
  const jpegBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  console.log("sharp resize OK, output size:", jpegBuffer.length);

  const pdfDoc = await PDFDocument.create();
  const image = await pdfDoc.embedJpg(jpegBuffer);
  console.log("embedJpg OK, dims:", image.width, image.height);
} catch (err) {
  console.log("REAL ERROR:", err.message);
  console.log("STACK:", err.stack);
}
