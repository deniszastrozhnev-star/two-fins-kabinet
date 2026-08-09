"use client";

const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_QUALITY = 0.82;

/**
 * Сжимает фото прямо в браузере перед отправкой формы. У Vercel Serverless
 * Functions есть жёсткий лимит тела запроса (~4.5 МБ), который НЕ зависит от
 * next.config bodySizeLimit и не поднимается настройками — обычное фото с
 * телефона (5–15 МБ) иначе падает с 413 ещё до того, как сервер вообще
 * получает управление. PDF и не-картинки возвращаются как есть.
 */
export async function compressImageClientSide(
  file: File,
  maxWidth: number = DEFAULT_MAX_WIDTH,
  quality: number = DEFAULT_QUALITY,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  console.log("[compressImageClientSide] start", file.name, file.type, file.size);
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image decode failed"));
      el.src = dataUrl;
    });

    console.log("[compressImageClientSide] decoded", img.naturalWidth, img.naturalHeight);
    const scale = Math.min(1, maxWidth / img.naturalWidth);
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    console.log("[compressImageClientSide] blob", blob && blob.size, "orig", file.size);
    if (!blob || blob.size >= file.size) return file;

    const result = new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
    console.log("[compressImageClientSide] result", result.size);
    return result;
  } catch (err) {
    console.log("[compressImageClientSide] ERROR", String(err));
    // Не смогли сжать (например, HEIC, который браузер не умеет декодировать
    // тегом <img>) — отправляем оригинал, дальше решает сервер как раньше.
    return file;
  }
}
