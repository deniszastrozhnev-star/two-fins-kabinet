import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getSession } from "@/lib/auth";

/** Отдаёт бланк абонентского договора (приватный blob, ссылка — в CONTRACT_TEMPLATE_URL)
 * любой залогиненной роли. Файл содержит подпись и печать школы — не публикуется
 * в открытом доступе и не хранится в репозитории, только в Vercel Blob. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Не авторизован", { status: 401 });
  }

  const url = process.env.CONTRACT_TEMPLATE_URL;
  if (!url) {
    return new NextResponse("Бланк договора пока не загружен", { status: 404 });
  }

  const result = await get(url, { access: "private" });
  if (!result || !result.stream) {
    return new NextResponse("Не найдено", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type":
        result.blob.contentType ??
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="dogovor.docx"',
    },
  });
}
