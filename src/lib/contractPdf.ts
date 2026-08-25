import "server-only";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

export type ContractPage = { buffer: Buffer; contentType: string };

/**
 * Собирает несколько страниц договора (фото и/или уже готовые PDF) в один PDF,
 * по одной странице на фото, в переданном порядке. Фото перегоняются через
 * sharp в JPEG (нормализует формат/EXIF-поворот перед embedJpg), у готовых
 * PDF просто копируются все их страницы.
 */
export async function buildContractPdf(pages: ContractPage[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  for (const page of pages) {
    if (page.contentType === "application/pdf") {
      const sourceDoc = await PDFDocument.load(page.buffer);
      const copiedPages = await pdfDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
      for (const copiedPage of copiedPages) {
        pdfDoc.addPage(copiedPage);
      }
      continue;
    }

    const jpegBuffer = await sharp(page.buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const image = await pdfDoc.embedJpg(jpegBuffer);
    const pdfPage = pdfDoc.addPage([image.width, image.height]);
    pdfPage.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
