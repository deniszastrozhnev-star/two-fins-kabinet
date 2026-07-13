import "server-only";
import os from "os";
import { recognize } from "tesseract.js";

const OCR_TIMEOUT_MS = 6000;

/** Лучшее из возможного: распознаёт текст на картинке с таймаутом. null, если не вышло или не успело. */
export async function recognizeTextSafe(image: Buffer): Promise<string | null> {
  try {
    const result = await Promise.race([
      // На Vercel файловая система только для чтения кроме /tmp — без этого
      // tesseract.js попытается закэшировать языковые данные в CWD и упадёт.
      recognize(image, "eng", { cachePath: os.tmpdir() }).then((r) => r.data.text),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), OCR_TIMEOUT_MS)),
    ]);
    return result;
  } catch {
    return null;
  }
}
