import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { list, get } from "@vercel/blob";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

const listed = await list({ prefix: "contract-pages/", limit: 1000 });
const cluster = listed.blobs
  .filter((b) => b.pathname.includes("20260918_2246"))
  .sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));

console.log(
  "cluster:",
  cluster.map((b) => ({ path: b.pathname, size: b.size, uploadedAt: b.uploadedAt })),
);

const pages = [];
for (const item of cluster) {
  const result = await get(item.url, { access: "private" });
  const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
  pages.push({ buffer, contentType: "image/jpeg", name: item.pathname });
  console.log("downloaded", item.pathname, buffer.length, "bytes");
}

async function buildContractPdf(pages) {
  const pdfDoc = await PDFDocument.create();
  for (const page of pages) {
    console.log("processing", page.name);
    const jpegBuffer = await sharp(page.buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    const image = await pdfDoc.embedJpg(jpegBuffer);
    const pdfPage = pdfDoc.addPage([image.width, image.height]);
    pdfPage.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    console.log("  OK:", image.width, "x", image.height);
  }
  return Buffer.from(await pdfDoc.save());
}

try {
  const result = await buildContractPdf(pages);
  console.log("FULL BUILD SUCCEEDED, size:", result.length);
} catch (err) {
  console.log("REAL ERROR:", err.name, "-", err.message);
  console.log("STACK:", err.stack);
}
