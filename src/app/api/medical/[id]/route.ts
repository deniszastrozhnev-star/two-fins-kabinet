import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";

/** Отдаёт файл медицинской справки (приватный blob) только авторизованному тренеру. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireTrainer();
  const { id } = await params;

  const certificate = await prisma.medicalCertificate.findUnique({
    where: { id },
  });
  if (!certificate) {
    return new NextResponse("Не найдено", { status: 404 });
  }

  const result = await get(certificate.fileUrl, { access: "private" });
  if (!result || !result.stream) {
    return new NextResponse("Не найдено", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${result.blob.pathname.split("/").pop()}"`,
    },
  });
}
