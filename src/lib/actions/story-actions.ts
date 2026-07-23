"use server";

import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { resizeForUpload } from "@/lib/image";
import type { StoryAuthorRole, StoryMediaType } from "@prisma/client";

export type ActionState = { error?: string; success?: string } | undefined;

const ALLOWED_STORY_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_STORY_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_STORY_VIDEO_BYTES = 25 * 1024 * 1024;
const MAX_CAPTION_LENGTH = 200;

function revalidateStoryPaths() {
  revalidatePath("/athlete", "layout");
  revalidatePath("/trainer");
  revalidatePath("/parent");
}

/** Роль+id лайкающего/автора по текущей сессии — лайкать может любая из трёх ролей. */
function actorFromSession(
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
): { role: StoryAuthorRole; id: string } {
  if (session.role === "trainer") return { role: "TRAINER", id: session.trainerId };
  if (session.role === "athlete") return { role: "ATHLETE", id: session.athleteId };
  return { role: "PARENT", id: session.childId };
}

export async function uploadStoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (session?.role !== "trainer") return { error: "Публиковать истории может только тренер" };
  const authorRole: StoryAuthorRole = "TRAINER";
  const authorId = session.trainerId;

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
  const blob = await put(
    `stories/${authorRole.toLowerCase()}/${authorId}/${Date.now()}.${ext}`,
    buffer,
    { access: "private", contentType },
  );

  await prisma.story.create({
    data: { authorRole, authorId, mediaUrl: blob.url, mediaType, caption },
  });

  revalidateStoryPaths();
  return { success: "История опубликована" };
}

/** Удалить может автор истории (любая роль — свою) или любой тренер (модерация чужих). */
export async function deleteStoryAction(formData: FormData) {
  const session = await getSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Не найдена история");

  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) return;

  const isOwner =
    (session?.role === "trainer" &&
      story.authorRole === "TRAINER" &&
      story.authorId === session.trainerId) ||
    (session?.role === "athlete" &&
      story.authorRole === "ATHLETE" &&
      story.authorId === session.athleteId) ||
    (session?.role === "parent" &&
      story.authorRole === "PARENT" &&
      story.authorId === session.childId);
  const isModerator = session?.role === "trainer";
  if (!isOwner && !isModerator) {
    throw new Error("Недостаточно прав для удаления этой истории");
  }

  await prisma.story.delete({ where: { id } });
  revalidateStoryPaths();
}

/** Переключает лайк текущего зрителя на истории — доступно любой из трёх ролей,
 * включая автора. Возвращает актуальное состояние, чтобы клиент обновил счётчик
 * без ожидания следующей ревалидации страницы. */
export async function toggleStoryLikeAction(
  storyId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const session = await getSession();
  if (!session) throw new Error("Не авторизован");
  const { role: likerRole, id: likerId } = actorFromSession(session);

  const existing = await prisma.storyLike.findUnique({
    where: { storyId_likerRole_likerId: { storyId, likerRole, likerId } },
  });

  if (existing) {
    await prisma.storyLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.storyLike.create({ data: { storyId, likerRole, likerId } });
  }

  const likeCount = await prisma.storyLike.count({ where: { storyId } });
  revalidateStoryPaths();
  return { liked: !existing, likeCount };
}
