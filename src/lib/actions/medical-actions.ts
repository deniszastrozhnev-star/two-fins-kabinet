"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { parseDateInputValue } from "@/lib/dates";
import { resizeForUpload } from "@/lib/image";

export type ActionState = { error?: string; success?: string } | undefined;

const ALLOWED_CERTIFICATE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

export async function uploadMedicalCertificateAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const child = await requireParentChild();

  const file = formData.get("certificate");
  const validUntilStr = String(formData.get("validUntil") ?? "");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Выберите файл со справкой (фото или PDF)" };
  }
  if (!ALLOWED_CERTIFICATE_TYPES.includes(file.type)) {
    return { error: "Поддерживаются только изображения (JPG, PNG) и PDF" };
  }
  if (!validUntilStr) {
    return { error: "Укажите дату, до какой действительны анализы" };
  }

  const { buffer, contentType } = await resizeForUpload(file);

  const safeName = `${child.lastName}-${child.firstName}`.replace(
    /[^a-zA-Zа-яА-ЯёЁ0-9_-]+/g,
    "_",
  );
  const key = `medical/${safeName}/${Date.now()}-${file.name}`;

  const blob = await put(key, buffer, { access: "private", contentType });

  await prisma.medicalCertificate.create({
    data: {
      childId: child.id,
      fileUrl: blob.url,
      contentType,
      validUntil: parseDateInputValue(validUntilStr),
    },
  });

  revalidatePath("/trainer/children");
  revalidatePath(`/trainer/children/${child.id}`);
  return { success: "Справка отправлена тренеру" };
}
