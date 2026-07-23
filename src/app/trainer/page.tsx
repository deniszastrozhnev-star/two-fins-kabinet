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

const QUICK_LINKS = [
  { href: "/trainer/attendance", label: "Посещаемость", desc: "Отметить занятие" },
  { href: "/trainer/children", label: "Дети", desc: "Список и оплата" },
  { href: "/trainer/schedule", label: "Расписание", desc: "Группы и переносы" },
  {
    href: "/trainer/personal-trainings",
    label: "Персональные тренировки",
    desc: "Добавить занятие",
  },
  { href: "/trainer/events", label: "Новости и события", desc: "Сборы, соревнования" },
];

export default async function TrainerDashboardPage() {
  const trainer = await requireTrainer();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [childrenCount, groupsCount, overdueCount, upcomingEvents, myGroups, storiesFeed] =
    await Promise.all([
      prisma.child.count(),
      prisma.group.count(),
      prisma.child.count({
        where: { OR: [{ paidUntil: null }, { paidUntil: { lt: today } }] },
      }),
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

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/60">Учеников</p>
            <p className="mt-1 font-heading text-3xl font-bold">{childrenCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/60">Групп</p>
            <p className="mt-1 font-heading text-3xl font-bold">{groupsCount}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/60">Не оплачено / просрочено</p>
            <p className="mt-1 font-heading text-3xl font-bold text-amber-300">
              {overdueCount}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="mb-3 font-heading text-lg font-bold">Быстрые действия</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                <Card className="h-full transition hover:border-brand-cyan/50">
                  <CardBody>
                    <p className="font-heading font-bold">{link.label}</p>
                    <p className="mt-1 text-sm text-brand-text/60">{link.desc}</p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-heading text-lg font-bold">
            Ближайшие события
          </h2>
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
        </div>
      </div>
    </>
  );
}
