import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireHeadTrainer } from "@/lib/auth";
import { getAthleteLeaderboard, AthletePeriod } from "@/lib/athletes";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateRu } from "@/lib/dates";

export default async function TrainerAthletesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireHeadTrainer();
  const { period: periodParam } = await searchParams;
  const period: AthletePeriod = periodParam === "month" ? "month" : "week";

  const [board, poolWorkouts, gymWorkouts] = await Promise.all([
    getAthleteLeaderboard(period),
    prisma.poolWorkout.findMany({
      orderBy: { date: "desc" },
      take: 100,
      include: { child: { select: { lastName: true, firstName: true } } },
    }),
    prisma.gymWorkout.findMany({
      orderBy: { date: "desc" },
      take: 100,
      include: { child: { select: { lastName: true, firstName: true } } },
    }),
  ]);

  const feed = [
    ...poolWorkouts.map((w) => ({
      id: w.id,
      type: "pool" as const,
      date: w.date,
      childName: `${w.child.lastName} ${w.child.firstName}`,
      task: w.task,
      detail: `${w.volumeMeters} м${w.feeling ? ` · ${w.feeling}` : ""}`,
    })),
    ...gymWorkouts.map((w) => ({
      id: w.id,
      type: "gym" as const,
      date: w.date,
      childName: `${w.child.lastName} ${w.child.firstName}`,
      task: w.task,
      detail: `${w.durationMinutes} мин`,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 100);

  return (
    <>
      <PageHeader title="Спортсмены" description="Рейтинг и записи дневников тренировок" />

      <div className="mb-4 flex gap-1.5">
        <Link
          href="/trainer/athletes?period=week"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            period === "week"
              ? "bg-brand-cyan/20 text-brand-cyan"
              : "text-brand-text/60 hover:bg-white/5"
          }`}
        >
          Неделя
        </Link>
        <Link
          href="/trainer/athletes?period=month"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            period === "month"
              ? "bg-brand-cyan/20 text-brand-cyan"
              : "text-brand-text/60 hover:bg-white/5"
          }`}
        >
          Месяц
        </Link>
      </div>

      <Card className="mb-6 overflow-x-auto">
        <CardBody className="p-0">
          {board.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="Пока нет спортсменов"
                description="Проставьте дату рождения ребёнку в его карточке, чтобы открыть ему вход спортсмена"
              />
            </div>
          ) : (
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-brand-text/60">
                  <th className="px-4 py-3 font-medium sm:px-5">#</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Спортсмен</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Бассейн</th>
                  <th className="px-4 py-3 font-medium sm:px-5">ОФП</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Очки</th>
                </tr>
              </thead>
              <tbody>
                {board.map((row, i) => (
                  <tr key={row.childId} className="border-b border-white/5">
                    <td className="px-4 py-3 sm:px-5">
                      {period === "month" && i === 0 ? "🏆" : i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium sm:px-5">
                      {row.lastName} {row.firstName}
                      {period === "month" && i === 0 && (
                        <Badge tone="amber" className="ml-2">
                          Лучший спортсмен месяца
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 sm:px-5">{row.poolVolumeMeters} м</td>
                    <td className="px-4 py-3 sm:px-5">{row.gymMinutes} мин</td>
                    <td className="px-4 py-3 font-semibold text-brand-cyan sm:px-5">
                      {row.points.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="mb-3 font-heading text-lg font-bold">Последние записи</h2>
          {feed.length === 0 ? (
            <EmptyState title="Записей пока нет" />
          ) : (
            <ul className="flex flex-col divide-y divide-white/10">
              {feed.map((f) => (
                <li key={`${f.type}-${f.id}`} className="py-2">
                  <div className="flex items-center gap-2">
                    <Badge tone={f.type === "pool" ? "cyan" : "violet"}>
                      {f.type === "pool" ? "Бассейн" : "ОФП"}
                    </Badge>
                    <p className="text-sm font-medium">{f.childName}</p>
                  </div>
                  <p className="mt-1 text-xs text-brand-text/50">
                    {formatDateRu(f.date)} · {f.task} · {f.detail}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
