import "server-only";

const DEFAULT_MAX_WIDTH = 1600;

/**
 * Уменьшает фото (телефонные снимки чеков/справок бывают по несколько МБ) до разумной
 * ширины и переупаковывает в JPEG — быстрее грузится превью, быстрее работает OCR.
 * PDF и не-картинки возвращаются как есть.
 */
export async function resizeForUpload(
  file: File,
  maxWidth: number = DEFAULT_MAX_WIDTH,
): Promise<{ buffer: Buffer; contentType: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const original = Buffer.from(arrayBuffer);

  if (!file.type.startsWith("image/")) {
    return { buffer: original, contentType: file.type };
  }

  try {
    // Ленивый импорт: грузить sharp только когда реально нужно обработать
    // картинку — иначе PDF-загрузки (которые тоже проходят через эту функцию
    // и сразу выходят по проверке выше) без надобности тянут sharp на
    // холодном старте serverless-функции, а это иногда валит её целиком.
    const sharp = (await import("sharp")).default;
    const resized = await sharp(original)
      .rotate() // учитывает EXIF-поворот с телефона
      .resize({ width: maxWidth, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    // Копируем в свежий Buffer: память из нативного аддона sharp иногда не проходит
    // через fetch()-based загрузку (Vercel Blob) в serverless-окружении Vercel.
    return { buffer: Buffer.from(resized), contentType: "image/jpeg" };
  } catch (err) {
    console.error("resizeForUpload: sharp failed, using original", err);
    return { buffer: original, contentType: file.type };
  }
}
