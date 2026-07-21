import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/** Отдаёт медиа истории (приватный blob) — доступно любому вошедшему
 * тренеру или спортсмену. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || (session.role !== "trainer" && session.role !== "athlete")) {
    return new NextResponse("Не авторизован", { status: 401 });
  }

  const { id } = await params;
  const story = await prisma.athleteStory.findUnique({
    where: { id },
    select: { mediaUrl: true, mediaType: true },
  });
  if (!story) {
    return new NextResponse("Не найдено", { status: 404 });
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
