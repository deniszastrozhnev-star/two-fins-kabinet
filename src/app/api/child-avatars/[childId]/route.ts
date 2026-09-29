import { NextResponse } from "next/server";
import { get } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/** Отдаёт аватар ребёнка (приватный blob) — доступно любой вошедшей роли,
 * как и аватар спортсмена (src/app/api/avatars/[athleteId]/route.ts), не
 * чувствительный документ. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Не авторизован", { status: 401 });
  }

  const { childId } = await params;
  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { avatarUrl: true },
  });
  if (!child?.avatarUrl) {
    return new NextResponse("Не найдено", { status: 404 });
  }

  const result = await get(child.avatarUrl, { access: "private" });
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
