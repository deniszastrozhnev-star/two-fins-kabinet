import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { formatDateRu } from "@/lib/dates";
import { getActiveStoriesFeed } from "@/lib/stories";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrainerAvatarUpload } from "@/components/trainer/TrainerAvatarUpload";
import { TrainerProfileForm } from "@/components/trainer/TrainerProfileForm";
import { StoryRail } from "@/components/shared/StoryRail";

export default async function TrainerDashboardPage() {
  const trainer = await requireTrainer();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [upcomingEvents, myGroups, storiesFeed] = await Promise.all([
    prisma.event.findMany({
      where: { dateStart: { gte: today } },
      orderBy: { dateStart: "asc" },
      take: 3,
    }),
    prisma.group.findMany({
      where: { trainers: { some: { id: trainer.id } } },
      orderBy: { name: "asc" },
    }),
    getActiveStoriesFeed({ role: "trainer", id: trainer.id }),
  ]);
  const avatarUrl = trainer.avatarUrl ? `/api/trainer-avatars/${trainer.id}` : null;
  const displayName = trainer.displayName ?? trainer.username;

  return (
    <>
      <PageHeader
        title={`Здравствуйте, ${trainer.username}`}
        description="Быстрый обзор школы"
      />

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardBody>
            <h2 className="mb-4 font-heading text-lg font-bold">Мой профиль</h2>
            <div className="flex justify-center pb-4">
              <TrainerAvatarUpload name={displayName} url={avatarUrl} size={96} />
            </div>
            <TrainerProfileForm displayName={trainer.displayName} bio={trainer.bio} rank={trainer.rank} />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h2 className="mb-4 font-heading text-lg font-bold">Мои группы</h2>
            {myGroups.length === 0 ? (
              <p className="text-sm text-brand-text/50">
                Пока не закреплено ни одной группы — обратитесь к главному тренеру
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {myGroups.map((g) => (
                  <Badge key={g.id} tone="cyan">
                    {g.name} · {g.pool}
                  </Badge>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mb-8">
        <CardBody>
          <h2 className="mb-3 font-heading text-lg font-bold">Истории</h2>
          <StoryRail
            feed={storiesFeed}
            ownName={displayName}
            ownAvatarUrl={avatarUrl}
            canModerate
            canPost
          />
        </CardBody>
      </Card>

      <h2 className="mb-3 font-heading text-lg font-bold">Ближайшие события</h2>
      {upcomingEvents.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/50">
              Событий не запланировано
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="flex flex-col divide-y divide-white/10 p-0">
            {upcomingEvents.map((e) => (
              <Link
                key={e.id}
                href={`/trainer/events/${e.id}`}
                className="block px-4 py-3 transition hover:bg-white/5"
              >
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-brand-text/50">
                  {formatDateRu(e.dateStart)}
                </p>
              </Link>
            ))}
          </CardBody>
        </Card>
      )}
    </>
  );
}
