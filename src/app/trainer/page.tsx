import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { formatDateRu } from "@/lib/dates";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

const QUICK_LINKS = [
  { href: "/trainer/attendance", label: "Посещаемость", desc: "Отметить занятие" },
  { href: "/trainer/children", label: "Дети", desc: "Список и оплата" },
  { href: "/trainer/schedule", label: "Расписание", desc: "Группы и переносы" },
  { href: "/trainer/workoffs", label: "Отработки", desc: "Кто пришёл сегодня" },
  { href: "/trainer/events", label: "Новости и события", desc: "Сборы, соревнования" },
];

export default async function TrainerDashboardPage() {
  const trainer = await requireTrainer();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [childrenCount, groupsCount, overdueCount, upcomingEvents] =
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
    ]);

  return (
    <>
      <PageHeader
        title={`Здравствуйте, ${trainer.username}`}
        description="Быстрый обзор школы"
      />

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
