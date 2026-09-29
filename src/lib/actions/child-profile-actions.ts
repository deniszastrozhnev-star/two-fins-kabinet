"use server";

import { revalidatePath } from "next/cache";
import { put } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { resizeForUpload } from "@/lib/image";

export type ActionState = { error?: string; success?: string } | undefined;

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export async function uploadChildAvatarAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const child = await requireParentChild();

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
  const blob = await put(`child-avatars/${child.id}/${Date.now()}.jpg`, buffer, {
    access: "private",
    contentType,
  });

  await prisma.child.update({ where: { id: child.id }, data: { avatarUrl: blob.url } });
  revalidatePath("/parent", "layout");
  return { success: "Фото обновлено" };
}

/** Отмечает "Новости" просмотренными для текущего активного ребёнка — баннер
 * непрочитанной новости на первом экране больше не покажется, пока не
 * появится что-то новее этого момента. */
export async function markEventsSeenAction(): Promise<void> {
  const child = await requireParentChild();
  await prisma.child.update({
    where: { id: child.id },
    data: { lastSeenEventsAt: new Date() },
  });
  revalidatePath("/parent", "layout");
}
