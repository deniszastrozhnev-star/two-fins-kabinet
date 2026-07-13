"use server";

import { revalidatePath } from "next/cache";
import { endOfMonth } from "date-fns";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireParentChild, requireTrainer } from "@/lib/auth";
import { resizeForUpload } from "@/lib/image";
import { recognizeTextSafe } from "@/lib/ocr";
import { extractAmountCandidates, matchTariff, getKnownTariffs } from "@/lib/tariffs";
import { parseDateInputValue } from "@/lib/dates";

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

  const { buffer, contentType } = await resizeForUpload(file);

  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const safeName = `${child.lastName}-${child.firstName}`.replace(
    /[^a-zA-Zа-яА-ЯёЁ0-9_-]+/g,
    "_",
  );
  const key = `receipts/${safeName}/${month}/${Date.now()}-${file.name}`;

  const blob = await put(key, buffer, { access: "private", contentType });

  const receipt = await prisma.paymentReceipt.create({
    data: { childId: child.id, fileUrl: blob.url, contentType },
  });

  // Распознавание — лучшее из возможного; чек уже сохранён и не зависит от результата.
  if (contentType.startsWith("image/")) {
    const text = await recognizeTextSafe(buffer);
    if (text) {
      const candidates = extractAmountCandidates(text);
      const tariffs = await getKnownTariffs();
      const match = matchTariff(candidates, tariffs);
      if (match) {
        await prisma.paymentReceipt.update({
          where: { id: receipt.id },
          data: { recognizedAmount: match.amount },
        });
      }
    }
  }

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

/** Тренер подтверждает: распознанная сумма — это оплата по тарифу, продлеваем до конца месяца. */
export async function confirmReceiptTariffAction(formData: FormData) {
  await requireTrainer();
  const receiptId = String(formData.get("receiptId") ?? "");
  const childId = String(formData.get("childId") ?? "");
  if (!receiptId || !childId) throw new Error("Не найден чек");

  await prisma.$transaction([
    prisma.child.update({
      where: { id: childId },
      data: { paidUntil: endOfMonth(new Date()) },
    }),
    prisma.paymentReceipt.update({
      where: { id: receiptId },
      data: { resolvedAt: new Date() },
    }),
  ]);

  revalidatePath("/trainer/children");
  revalidatePath(`/trainer/children/${childId}`);
  revalidatePath("/parent", "layout");
}

/** Тренер указывает дату оплаты вручную — распознанная сумма не подошла (доплата, нестандартный случай). */
export async function manualReceiptResolutionAction(formData: FormData) {
  await requireTrainer();
  const receiptId = String(formData.get("receiptId") ?? "");
  const childId = String(formData.get("childId") ?? "");
  const dateStr = String(formData.get("paidUntil") ?? "");
  if (!receiptId || !childId || !dateStr) {
    throw new Error("Укажите дату оплаты");
  }

  await prisma.$transaction([
    prisma.child.update({
      where: { id: childId },
      data: { paidUntil: parseDateInputValue(dateStr) },
    }),
    prisma.paymentReceipt.update({
      where: { id: receiptId },
      data: { resolvedAt: new Date() },
    }),
  ]);

  revalidatePath("/trainer/children");
  revalidatePath(`/trainer/children/${childId}`);
  revalidatePath("/parent", "layout");
}
