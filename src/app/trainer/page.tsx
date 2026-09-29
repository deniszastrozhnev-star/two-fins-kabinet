import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { formatDateRu } from "@/lib/dates";
import { getTodaysBirthdays } from "@/lib/birthdays";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrainerAvatarUpload } from "@/components/trainer/TrainerAvatarUpload";
import { TrainerProfileForm } from "@/components/trainer/TrainerProfileForm";

export default async function TrainerDashboardPage() {
  const trainer = await requireTrainer();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [upcomingEvents, myGroups, birthdays] = await Promise.all([
    prisma.event.findMany({
      where: { dateStart: { gte: today } },
      orderBy: { dateStart: "asc" },
      take: 3,
    }),
    prisma.group.findMany({
      where: { trainers: { some: { id: trainer.id } } },
      orderBy: { name: "asc" },
    }),
    getTodaysBirthdays(),
  ]);
  const avatarUrl = trainer.avatarUrl ? `/api/trainer-avatars/${trainer.id}` : null;
  const displayName = trainer.displayName ?? trainer.username;

  return (
    <>
      <PageHeader
        title={`Здравствуйте, ${trainer.username}`}
        description="Быстрый обзор школы"
      />

      {birthdays.length > 0 && (
        <Card className="mb-6 border-amber-500/30 bg-amber-500/10">
          <CardBody>
            <h2 className="mb-3 font-heading text-lg font-bold text-amber-200">
              🎂 Именинники сегодня
            </h2>
            <div className="flex flex-wrap gap-2">
              {birthdays.map((b) => (
                <Badge key={b.id} tone="amber">
                  {b.lastName} {b.firstName} · {b.age}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

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
