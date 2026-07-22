import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/** Отдаёт аватар тренера (приватный blob) — доступно любой вошедшей роли
 * (тренер/спортсмен/родитель): профиль тренера публичен внутри школы. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trainerId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Не авторизован", { status: 401 });
  }

  const { trainerId } = await params;
  const trainer = await prisma.trainer.findUnique({
    where: { id: trainerId },
    select: { avatarUrl: true },
  });
  if (!trainer?.avatarUrl) {
    return new NextResponse("Не найдено", { status: 404 });
  }

  const result = await get(trainer.avatarUrl, { access: "private" });
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
