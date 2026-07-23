import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/** Отдаёт медиа истории (приватный blob) — доступно любой вошедшей роли, кроме
 * одного случая: историю автора-родителя не видит спортсмен (см. src/lib/stories.ts). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Не авторизован", { status: 401 });
  }

  const { id } = await params;
  const story = await prisma.story.findUnique({
    where: { id },
    select: { mediaUrl: true, mediaType: true, authorRole: true },
  });
  if (!story) {
    return new NextResponse("Не найдено", { status: 404 });
  }
  if (session.role === "athlete" && story.authorRole === "PARENT") {
    return new NextResponse("Не авторизован", { status: 401 });
  }

  const result = await get(story.mediaUrl, { access: "private" });
  if (!result || !result.stream) {
    return new NextResponse("Не найдено", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type":
        result.blob.contentType ?? (story.mediaType === "PHOTO" ? "image/jpeg" : "video/mp4"),
      "Cache-Control": "private, max-age=300",
    },
  });
}
