import "server-only";
import { subHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import type { StoryAuthorRole, StoryMediaType } from "@prisma/client";

export const ACTIVE_STORY_HOURS = 24;

export type ViewerRole = "trainer" | "athlete" | "parent";

export type StoryAuthor = {
  role: StoryAuthorRole;
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type StoryItem = {
  id: string;
  mediaUrl: string;
  mediaType: StoryMediaType;
  caption: string | null;
  createdAt: Date;
  author: StoryAuthor;
};

export type StoriesFeed = {
  own: StoryItem[];
  others: { author: StoryAuthor; stories: StoryItem[] }[];
};

/** Единственное правило видимости: историю автора-родителя не видит спортсмен —
 * остальные комбинации видны всем (тренер видит всех; родитель видит всех). */
function visibleAuthorRoles(viewerRole: ViewerRole): StoryAuthorRole[] {
  return viewerRole === "athlete" ? ["TRAINER", "ATHLETE"] : ["TRAINER", "ATHLETE", "PARENT"];
}

/** Активные (не старше 24ч) истории, видимые данному зрителю — свои отдельно,
 * чужие сгруппированы по автору (независимо от его роли), авторы отсортированы
 * по свежести последней истории. */
export async function getActiveStoriesFeed(viewer: {
  role: ViewerRole;
  id: string;
}): Promise<StoriesFeed> {
  const rows = await prisma.story.findMany({
    where: {
      authorRole: { in: visibleAuthorRoles(viewer.role) },
      createdAt: { gte: subHours(new Date(), ACTIVE_STORY_HOURS) },
    },
    orderBy: { createdAt: "asc" },
  });

  const trainerIds = new Set<string>();
  const athleteIds = new Set<string>();
  const childIds = new Set<string>();
  for (const row of rows) {
    if (row.authorRole === "TRAINER") trainerIds.add(row.authorId);
    else if (row.authorRole === "ATHLETE") athleteIds.add(row.authorId);
    else childIds.add(row.authorId);
  }

  const [trainers, athletes, children] = await Promise.all([
    trainerIds.size
      ? prisma.trainer.findMany({
          where: { id: { in: [...trainerIds] } },
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        })
      : Promise.resolve([]),
    athleteIds.size
      ? prisma.athlete.findMany({
          where: { id: { in: [...athleteIds] } },
          select: { id: true, lastName: true, firstName: true, avatarUrl: true },
        })
      : Promise.resolve([]),
    childIds.size
      ? prisma.child.findMany({
          where: { id: { in: [...childIds] } },
          select: { id: true, lastName: true, firstName: true },
        })
      : Promise.resolve([]),
  ]);

  const trainerMap = new Map(trainers.map((t) => [t.id, t]));
  const athleteMap = new Map(athletes.map((a) => [a.id, a]));
  const childMap = new Map(children.map((c) => [c.id, c]));

  function resolveAuthor(role: StoryAuthorRole, id: string): StoryAuthor | null {
    if (role === "TRAINER") {
      const t = trainerMap.get(id);
      if (!t) return null;
      return {
        role,
        id,
        name: t.displayName ?? t.username,
        avatarUrl: t.avatarUrl ? `/api/trainer-avatars/${id}` : null,
      };
    }
    if (role === "ATHLETE") {
      const a = athleteMap.get(id);
      if (!a) return null;
      return {
        role,
        id,
        name: `${a.lastName} ${a.firstName}`,
        avatarUrl: a.avatarUrl ? `/api/avatars/${id}` : null,
      };
    }
    const c = childMap.get(id);
    if (!c) return null;
    // У родителя нет своего фото — истории привязаны к ребёнку, отдельной
    // загрузки аватара для этой роли не заводим (не запрошено).
    return { role, id, name: `Родители ${c.lastName} ${c.firstName}`, avatarUrl: null };
  }

  const viewerRoleUpper = viewer.role.toUpperCase() as StoryAuthorRole;
  const own: StoryItem[] = [];
  const othersMap = new Map<string, { author: StoryAuthor; stories: StoryItem[] }>();

  for (const row of rows) {
    const author = resolveAuthor(row.authorRole, row.authorId);
    if (!author) continue; // автор удалён — история сама пропадёт из ленты не позже чем через 24ч

    const item: StoryItem = {
      id: row.id,
      mediaUrl: `/api/stories/${row.id}`,
      mediaType: row.mediaType,
      caption: row.caption,
      createdAt: row.createdAt,
      author,
    };

    if (author.role === viewerRoleUpper && author.id === viewer.id) {
      own.push(item);
      continue;
    }
    const key = `${author.role}:${author.id}`;
    const bucket = othersMap.get(key) ?? { author, stories: [] };
    bucket.stories.push(item);
    othersMap.set(key, bucket);
  }

  const others = Array.from(othersMap.values()).sort(
    (a, b) =>
      b.stories[b.stories.length - 1].createdAt.getTime() -
      a.stories[a.stories.length - 1].createdAt.getTime(),
  );

  return { own, others };
}
