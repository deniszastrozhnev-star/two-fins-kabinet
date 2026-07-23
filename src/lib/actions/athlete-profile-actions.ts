"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireAthlete } from "@/lib/auth";
import { resizeForUpload } from "@/lib/image";

export type ActionState = { error?: string; success?: string } | undefined;

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function revalidateProfilePaths() {
  revalidatePath("/athlete", "layout");
}

export async function uploadAvatarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const athlete = await requireAthlete();

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
  const blob = await put(`avatars/${athlete.id}/${Date.now()}.jpg`, buffer, {
    access: "private",
    contentType,
  });

  await prisma.athlete.update({ where: { id: athlete.id }, data: { avatarUrl: blob.url } });
  revalidateProfilePaths();
  return { success: "Аватар обновлён" };
}
