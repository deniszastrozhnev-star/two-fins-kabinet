"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireParentChild, requireTrainer } from "@/lib/auth";

export type ActionState = { error?: string; success?: string } | undefined;

const ALLOWED_RECEIPT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

export async function uploadReceiptAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const child = await requireParentChild();

  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Выберите файл с фото, скриншотом или PDF чека" };
  }
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return { error: "Поддерживаются только изображения (JPG, PNG) и PDF" };
  }

  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const safeName = `${child.lastName}-${child.firstName}`.replace(
    /[^a-zA-Zа-яА-ЯёЁ0-9_-]+/g,
    "_",
  );
  const key = `receipts/${safeName}/${month}/${Date.now()}-${file.name}`;

  const blob = await put(key, file, { access: "private" });

  await prisma.paymentReceipt.create({
    data: { childId: child.id, fileUrl: blob.url, contentType: file.type },
  });

  revalidatePath("/trainer/children");
  revalidatePath(`/trainer/children/${child.id}`);
  return { success: "Чек отправлен тренеру" };
}

/** Помечает последний чек ребёнка просмотренным тренером (вызывается при открытии карточки). */
export async function markLatestReceiptViewed(childId: string) {
  await requireTrainer();
  await prisma.paymentReceipt.updateMany({
    where: { childId, viewedAt: null },
    data: { viewedAt: new Date() },
  });
}
