"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireAthlete, getSession } from "@/lib/auth";
import { resizeForUpload } from "@/lib/image";
import type { StoryMediaType } from "@prisma/client";

export type ActionState = { error?: string; success?: string } | undefined;

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const ALLOWED_STORY_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_STORY_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_STORY_VIDEO_BYTES = 25 * 1024 * 1024;
const MAX_CAPTION_LENGTH = 200;

function revalidateProfilePaths() {
  revalidatePath("/athlete", "layout");
  revalidatePath("/trainer/stories");
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

export async function uploadStoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const athlete = await requireAthlete();

  const file = formData.get("media");
  const captionRaw = String(formData.get("caption") ?? "").trim();
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Выберите фото или видео" };
  }
  if (captionRaw.length > MAX_CAPTION_LENGTH) {
    return { error: `Подпись слишком длинная (максимум ${MAX_CAPTION_LENGTH} символов)` };
  }
  const caption = captionRaw || null;

  let mediaType: StoryMediaType;
  let buffer: Buffer;
  let contentType: string;

  if (file.type.startsWith("image/")) {
    if (file.size > MAX_STORY_PHOTO_BYTES) {
      return { error: "Фото слишком большое (максимум 8 МБ)" };
    }
    mediaType = "PHOTO";
    ({ buffer, contentType } = await resizeForUpload(file, 1080));
  } else if (ALLOWED_STORY_VIDEO_TYPES.includes(file.type)) {
    if (file.size > MAX_STORY_VIDEO_BYTES) {
      return { error: "Видео слишком большое (максимум 25 МБ, короткое видео до 15-30 секунд)" };
    }
    mediaType = "VIDEO";
    buffer = Buffer.from(await file.arrayBuffer());
    contentType = file.type;
  } else {
    return { error: "Поддерживаются только фото (JPG, PNG, WebP) или видео (MP4, MOV, WebM)" };
  }

  const ext = mediaType === "PHOTO" ? "jpg" : contentType.split("/")[1] ?? "mp4";
  const blob = await put(`stories/${athlete.id}/${Date.now()}.${ext}`, buffer, {
    access: "private",
    contentType,
  });

  await prisma.athleteStory.create({
    data: { athleteId: athlete.id, mediaUrl: blob.url, mediaType, caption },
  });

  revalidateProfilePaths();
  return { success: "История опубликована" };
}

/** Удалить может автор истории (спортсмен) или любой тренер (модерация) — поэтому
 * не используем requireTrainer()/requireAthlete() напрямую, а проверяем сессию вручную. */
export async function deleteStoryAction(formData: FormData) {
  const session = await getSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найдена история");

  const story = await prisma.athleteStory.findUnique({ where: { id } });
  if (!story) return;

  const isOwner = session?.role === "athlete" && session.athleteId === story.athleteId;
  const isTrainer = session?.role === "trainer";
  if (!isOwner && !isTrainer) {
    throw new Error("Недостаточно прав для удаления этой истории");
  }

  await prisma.athleteStory.delete({ where: { id } });
  revalidateProfilePaths();
}
