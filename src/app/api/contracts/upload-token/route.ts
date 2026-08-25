import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSession } from "@/lib/auth";

const ALLOWED_PAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

// Выдаёт клиенту токен на прямую загрузку страницы договора в Vercel Blob,
// минуя serverless-лимит тела запроса (~4.5 МБ) — так несколько сжатых фото
// не упираются в потолок, который бьёт по одиночным чекам/справкам.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_PAGE_TYPES,
        addRandomSuffix: true,
        maximumSizeInBytes: 15 * 1024 * 1024,
      }),
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload token error" },
      { status: 400 },
    );
  }
}
