import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/** Отдаёт аватар спортсмена (приватный blob) — доступно любому вошедшему
 * тренеру или спортсмену (не чувствительный документ, просто фото профиля). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ athleteId: string }> },
) {
  const session = await getSession();
  if (!session || (session.role !== "trainer" && session.role !== "athlete")) {
    return new NextResponse("Не авторизован", { status: 401 });
  }

  const { athleteId } = await params;
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    select: { avatarUrl: true },
  });
  if (!athlete?.avatarUrl) {
    return new NextResponse("Не найдено", { status: 404 });
  }

  const result = await get(athlete.avatarUrl, { access: "private" });
  if (!result || !result.stream) {
    return new NextResponse("Не найдено", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "image/jpeg",
      "Cache-Control": "private, no-store",
    },
  });
}
