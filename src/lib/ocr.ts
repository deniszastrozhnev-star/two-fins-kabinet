import "server-only";
import os from "os";
import path from "path";
import { recognize } from "tesseract.js";

const OCR_TIMEOUT_MS = 6000;

// Языковые данные бандлим локально: по умолчанию tesseract.js качает их через
// global.fetch, который на Vercel — это fetch, пропатченный Next.js, а он падает
// с "SharedArrayBuffer is not allowed" в serverless-окружении. Локальный путь
// полностью обходит сетевой запрос (см. next.config.ts: outputFileTracingIncludes).
const TESSDATA_PATH = path.join(process.cwd(), "src", "lib", "tessdata");

/** Лучшее из возможного: распознаёт текст на картинке с таймаутом. null, если не вышло или не успело. */
export async function recognizeTextSafe(image: Buffer): Promise<string | null> {
  try {
    const result = await Promise.race([
      // На Vercel файловая система только для чтения кроме /tmp — без этого
      // tesseract.js попытается закэшировать языковые данные в CWD и упадёт.
      recognize(image, "eng", { cachePath: os.tmpdir(), langPath: TESSDATA_PATH }).then(
        (r) => r.data.text,
      ),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), OCR_TIMEOUT_MS)),
    ]);
    return result;
  } catch {
    return null;
  }
}
