import "server-only";
import sharp from "sharp";

const MAX_WIDTH = 1600;

/**
 * Уменьшает фото (телефонные снимки чеков/справок бывают по несколько МБ) до разумной
 * ширины и переупаковывает в JPEG — быстрее грузится превью, быстрее работает OCR.
 * PDF и не-картинки возвращаются как есть.
 */
export async function resizeForUpload(
  file: File,
): Promise<{ buffer: Buffer; contentType: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const original = Buffer.from(arrayBuffer);

  if (!file.type.startsWith("image/")) {
    return { buffer: original, contentType: file.type };
  }

  try {
    const resized = await sharp(original)
      .rotate() // учитывает EXIF-поворот с телефона
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    return { buffer: resized, contentType: "image/jpeg" };
  } catch {
    return { buffer: original, contentType: file.type };
  }
}
