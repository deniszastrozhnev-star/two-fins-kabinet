import "server-only";
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
      // ignoreEncryption/throwOnInvalidObject: некоторые PDF от сканер-приложений
      // на телефоне выходят с шифрованием без пароля или мелкими структурными
      // огрехами — pdf-lib по умолчанию строгий и падает на них.
      const sourceDoc = await PDFDocument.load(page.buffer, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
      });
      const copiedPages = await pdfDoc.copyPages(sourceDoc, sourceDoc.getPageIndices());
      for (const copiedPage of copiedPages) {
        pdfDoc.addPage(copiedPage);
      }
      continue;
    }

    // Ленивый импорт: грузить sharp только когда реально нужно обработать
    // картинку — иначе PDF-only загрузки без надобности тянут sharp на
    // холодном старте serverless-функции, а это иногда валит её целиком
    // (подтверждено на проде: неиспользуемый top-level import sharp здесь
    // приводил к 500 даже когда обрабатывались только PDF-страницы).
    const sharp = (await import("sharp")).default;
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
