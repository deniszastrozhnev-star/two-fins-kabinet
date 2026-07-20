import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireHeadTrainer } from "@/lib/auth";
import { getAthleteLeaderboard, AthletePeriod } from "@/lib/athletes";
import { getAllAthleteRecords } from "@/lib/athleteCompetitions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateRu } from "@/lib/dates";
import { ATHLETE_RANK_COLORS, ATHLETE_RANK_LABELS } from "@/lib/labels";

const TYPE_LABELS = { pool: "Бассейн", gym: "ОФП", flex: "Гибкость" } as const;
const TYPE_TONES = { pool: "cyan", gym: "violet", flex: "green" } as const;

export default async function TrainerAthletesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireHeadTrainer();
  const { period: periodParam } = await searchParams;
  const period: AthletePeriod = periodParam === "month" ? "month" : "week";

  const [board, poolWorkouts, gymWorkouts, flexWorkouts, athleteRanks, records] =
    await Promise.all([
      getAthleteLeaderboard(period),
      prisma.poolWorkout.findMany({
        orderBy: { date: "desc" },
        take: 100,
        include: { athlete: { select: { lastName: true, firstName: true } } },
      }),
      prisma.gymWorkout.findMany({
        orderBy: { date: "desc" },
        take: 100,
        include: { athlete: { select: { lastName: true, firstName: true } } },
      }),
      prisma.flexibilityWorkout.findMany({
        orderBy: { date: "desc" },
        take: 100,
        include: { athlete: { select: { lastName: true, firstName: true } } },
      }),
      prisma.athlete.findMany({ select: { id: true, rank: true } }),
      getAllAthleteRecords(),
    ]);

  const rankByAthlete = new Map(athleteRanks.map((a) => [a.id, a.rank]));

  const feed = [
    ...poolWorkouts.map((w) => ({
      id: w.id,
      type: "pool" as const,
      date: w.date,
      athleteName: `${w.athlete.lastName} ${w.athlete.firstName}`,
      task: w.task,
      detail: `${w.volumeMeters} м${w.feeling ? ` · ${w.feeling}` : ""}`,
    })),
    ...gymWorkouts.map((w) => ({
      id: w.id,
      type: "gym" as const,
      date: w.date,
      athleteName: `${w.athlete.lastName} ${w.athlete.firstName}`,
      task: w.task,
      detail: `${w.durationMinutes} мин`,
    })),
    ...flexWorkouts.map((w) => ({
      id: w.id,
      type: "flex" as const,
      date: w.date,
      athleteName: `${w.athlete.lastName} ${w.athlete.firstName}`,
      task: w.task,
      detail: `${w.durationMinutes} мин`,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 100);

  const missedRows = board.filter((row) => row.missedDays > 0);

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
                description="Спортсмены регистрируются самостоятельно на странице входа"
              />
            </div>
          ) : (
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-brand-text/60">
                  <th className="px-4 py-3 font-medium sm:px-5">#</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Спортсмен</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Бассейн</th>
                  <th className="px-4 py-3 font-medium sm:px-5">ОФП</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Гибкость</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Очки</th>
                </tr>
              </thead>
              <tbody>
                {board.map((row, i) => {
                  const rank = rankByAthlete.get(row.athleteId);
                  return (
                  <tr key={row.athleteId} className="border-b border-white/5">
                    <td className="px-4 py-3 sm:px-5">
                      {period === "month" && i === 0 ? "🏆" : i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium sm:px-5">
                      <Link href={`/trainer/athletes/${row.athleteId}`} className="hover:underline">
                        {row.lastName} {row.firstName}
                      </Link>
                      {rank && (
                        <span
                          className="ml-2 text-xs font-semibold"
                          style={{ color: ATHLETE_RANK_COLORS[rank] }}
                        >
                          {ATHLETE_RANK_LABELS[rank]}
                        </span>
                      )}
                      {period === "month" && i === 0 && (
                        <Badge tone="amber" className="ml-2">
                          Лучший спортсмен месяца
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 sm:px-5">{row.poolVolumeMeters} м</td>
                    <td className="px-4 py-3 sm:px-5">{row.gymMinutes} мин</td>
                    <td className="px-4 py-3 sm:px-5">{row.flexibilityMinutes} мин</td>
                    <td className="px-4 py-3 sm:px-5">
                      <span className="font-semibold text-brand-cyan">
                        {row.points.toFixed(1)}
                      </span>
                      {row.missedDays > 0 && (
                        <Badge tone="red" className="ml-2">
                          −{row.missedDays} дн.
                        </Badge>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {records.some((r) => r.records.length > 0) && (
        <Card className="mb-6">
          <CardBody>
            <h2 className="mb-3 font-heading text-lg font-bold">Личные рекорды</h2>
            <ul className="flex flex-col divide-y divide-white/10">
              {records
                .filter((r) => r.records.length > 0)
                .map((r) => (
                  <li key={r.athleteId} className="py-2">
                    <p className="text-sm font-medium">
                      {r.lastName} {r.firstName}
                    </p>
                    <ul className="mt-1 flex flex-col gap-0.5">
                      {r.records.map((rec) => (
                        <li
                          key={`${rec.disciplineLabel}-${rec.timingLabel}`}
                          className="text-xs text-brand-text/60"
                        >
                          {rec.disciplineLabel} · {rec.timingLabel} —{" "}
                          <span className="font-semibold text-amber-300">{rec.resultLabel}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {missedRows.length > 0 && (
        <Card className="mb-6">
          <CardBody>
            <h2 className="mb-3 font-heading text-lg font-bold">Пропущенные дни</h2>
            <ul className="flex flex-col divide-y divide-white/10">
              {missedRows.map((row) => (
                <li key={row.athleteId} className="py-2">
                  <p className="text-sm font-medium">
                    {row.lastName} {row.firstName}
                  </p>
                  <p className="mt-1 text-xs text-red-300">
                    {row.missedDates.map((d) => formatDateRu(d)).join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

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
                    <Badge tone={TYPE_TONES[f.type]}>{TYPE_LABELS[f.type]}</Badge>
                    <p className="text-sm font-medium">{f.athleteName}</p>
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
