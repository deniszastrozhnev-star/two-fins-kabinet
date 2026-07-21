import "server-only";
import { subHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import type { AthleteStory } from "@prisma/client";

export const ACTIVE_STORY_HOURS = 24;

export type StoryWithAuthor = AthleteStory & {
  athlete: { id: string; lastName: string; firstName: string; avatarUrl: string | null };
};

export type StoriesFeed = {
  own: StoryWithAuthor[];
  others: {
    athlete: { id: string; lastName: string; firstName: string; avatarUrl: string | null };
    stories: StoryWithAuthor[];
  }[];
};

/** Ссылки на приватные Blob-файлы не открываются напрямую в браузере — только
 * через свой же авторизованный роут, который стримит файл (см. src/app/api/stories/[id],
 * src/app/api/avatars/[athleteId]). */
function toProxyAvatarUrl(athleteId: string, avatarUrl: string | null): string | null {
  return avatarUrl ? `/api/avatars/${athleteId}` : null;
}

/** Активные (не старше 24ч) истории — свои отдельно, чужие сгруппированы по автору,
 * авторы отсортированы по свежести последней истории. */
export async function getActiveStoriesFeed(currentAthleteId: string): Promise<StoriesFeed> {
  const rows = await prisma.athleteStory.findMany({
    where: { createdAt: { gte: subHours(new Date(), ACTIVE_STORY_HOURS) } },
    include: { athlete: { select: { id: true, lastName: true, firstName: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });

  const stories: StoryWithAuthor[] = rows.map((s) => ({
    ...s,
    mediaUrl: `/api/stories/${s.id}`,
    athlete: { ...s.athlete, avatarUrl: toProxyAvatarUrl(s.athlete.id, s.athlete.avatarUrl) },
  }));

  const own: StoryWithAuthor[] = [];
  const othersMap = new Map<string, StoryWithAuthor[]>();

  for (const story of stories) {
    if (story.athleteId === currentAthleteId) {
      own.push(story);
      continue;
    }
    const list = othersMap.get(story.athleteId) ?? [];
    list.push(story);
    othersMap.set(story.athleteId, list);
  }

  const others = Array.from(othersMap.values())
    .map((list) => ({ athlete: list[0].athlete, stories: list }))
    .sort(
      (a, b) =>
        b.stories[b.stories.length - 1].createdAt.getTime() -
        a.stories[a.stories.length - 1].createdAt.getTime(),
    );

  return { own, others };
}
