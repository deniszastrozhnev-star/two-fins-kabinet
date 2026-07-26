"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { resizeForUpload } from "@/lib/image";

export type ActionState = { error?: string; success?: string } | undefined;

const ALLOWED_CONTRACT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
];

export async function uploadContractAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const child = await requireParentChild();

  const file = formData.get("contract");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Выберите файл с подписанным договором (фото или PDF)" };
  }
  if (!ALLOWED_CONTRACT_TYPES.includes(file.type)) {
    return { error: "Поддерживаются только изображения (JPG, PNG) и PDF" };
  }

  const { buffer, contentType } = await resizeForUpload(file);

  const safeName = `${child.lastName}-${child.firstName}`.replace(
    /[^a-zA-Zа-яА-ЯёЁ0-9_-]+/g,
    "_",
  );
  const key = `contracts/${safeName}/${Date.now()}-${file.name}`;

  const blob = await put(key, buffer, { access: "private", contentType });

  await prisma.contractDocument.create({
    data: { childId: child.id, fileUrl: blob.url, contentType },
  });

  revalidatePath("/trainer/children");
  revalidatePath(`/trainer/children/${child.id}`);
  revalidatePath("/parent", "layout");
  return { success: "Договор отправлен тренеру" };
}
