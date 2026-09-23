import { NextResponse } from "next/server";
import { createPresignedUploadUrl } from "@/lib/storage";
import { getSession } from "@/lib/auth";

const ALLOWED_PAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

// Выдаёт клиенту presigned PUT-ссылку на прямую загрузку страницы договора в
// S3-совместимое хранилище, минуя лимит тела серверного экшена — так
// несколько сжатых фото не упираются в потолок, который бьёт по одиночным
// чекам/справкам.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }

  const { key, contentType } = (await request.json()) as { key?: string; contentType?: string };

  if (!key || !key.startsWith("contract-pages/") || !contentType || !ALLOWED_PAGE_TYPES.has(contentType)) {
    return NextResponse.json({ error: "Некорректный запрос на загрузку" }, { status: 400 });
  }

  try {
    const url = await createPresignedUploadUrl(key, contentType);
    return NextResponse.json({ url, key });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload token error" },
      { status: 400 },
    );
  }
}
