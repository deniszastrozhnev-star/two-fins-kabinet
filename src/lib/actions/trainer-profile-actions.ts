"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { resizeForUpload } from "@/lib/image";
import { ATHLETE_RANK_ORDER } from "@/lib/labels";
import type { AthleteRank } from "@prisma/client";

export type ActionState = { error?: string; success?: string } | undefined;

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_BIO_LENGTH = 1000;
const MAX_DISPLAY_NAME_LENGTH = 100;

function revalidateProfilePaths() {
  revalidatePath("/trainer");
  revalidatePath("/parent/trainers");
}

export async function uploadTrainerAvatarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const trainer = await requireTrainer();

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Выберите фото" };
  }
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { error: "Поддерживаются только изображения (JPG, PNG, WebP)" };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Файл слишком большой (максимум 5 МБ)" };
  }

  const { buffer, contentType } = await resizeForUpload(file, 512);
  const blob = await put(`trainer-avatars/${trainer.id}/${Date.now()}.jpg`, buffer, {
    access: "private",
    contentType,
  });

  await prisma.trainer.update({ where: { id: trainer.id }, data: { avatarUrl: blob.url } });
  revalidateProfilePaths();
  return { success: "Аватар обновлён" };
}

export async function updateTrainerProfileAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const trainer = await requireTrainer();

  const displayNameRaw = String(formData.get("displayName") ?? "").trim();
  if (displayNameRaw.length > MAX_DISPLAY_NAME_LENGTH) {
    return { error: `ФИО слишком длинное (максимум ${MAX_DISPLAY_NAME_LENGTH} символов)` };
  }
  const displayName = displayNameRaw || null;

  const bioRaw = String(formData.get("bio") ?? "").trim();
  if (bioRaw.length > MAX_BIO_LENGTH) {
    return { error: `«О себе» слишком длинное (максимум ${MAX_BIO_LENGTH} символов)` };
  }
  const bio = bioRaw || null;

  const rankRaw = String(formData.get("rank") ?? "");
  const rank = ATHLETE_RANK_ORDER.includes(rankRaw as AthleteRank)
    ? (rankRaw as AthleteRank)
    : null;

  await prisma.trainer.update({ where: { id: trainer.id }, data: { displayName, bio, rank } });
  revalidateProfilePaths();
  return { success: "Профиль обновлён" };
}
