import { prisma } from "@/lib/prisma";
import { requireAthlete } from "@/lib/auth";
import { getAthleteLeaderboard } from "@/lib/athletes";
import { deleteWorkoutAction } from "@/lib/actions/athlete-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmSubmitButton } from "@/components/trainer/ConfirmSubmitButton";
import { PoolWorkoutForm } from "@/components/athlete/PoolWorkoutForm";
import { GymWorkoutForm } from "@/components/athlete/GymWorkoutForm";
import { FlexibilityWorkoutForm } from "@/components/athlete/FlexibilityWorkoutForm";
import { formatDateRu, toDateInputValue } from "@/lib/dates";
import { formatSwimTime } from "@/lib/swimTime";
import { LEVEL_LABELS } from "@/lib/labels";
import Link from "next/link";

export default async function AthletePage() {
  const athlete = await requireAthlete();

  const [weekBoard, monthBoard, poolWorkouts, gymWorkouts, flexWorkouts, athleteExtra] =
    await Promise.all([
      getAthleteLeaderboard("week"),
      getAthleteLeaderboard("month"),
      prisma.poolWorkout.findMany({ where: { athleteId: athlete.id }, orderBy: { date: "desc" } }),
      prisma.gymWorkout.findMany({ where: { athleteId: athlete.id }, orderBy: { date: "desc" } }),
      prisma.flexibilityWorkout.findMany({
        where: { athleteId: athlete.id },
        orderBy: { date: "desc" },
      }),
      prisma.athlete.findUnique({
        where: { id: athlete.id },
        select: { level: true, linkedChildId: true },
      }),
    ]);

  const weekIndex = weekBoard.findIndex((r) => r.athleteId === athlete.id);
  const monthIndex = monthBoard.findIndex((r) => r.athleteId === athlete.id);
  const weekRow = weekIndex >= 0 ? weekBoard[weekIndex] : null;
  const monthRow = monthIndex >= 0 ? monthBoard[monthIndex] : null;
  const level = athleteExtra?.level ?? null;

  const history = [
    ...poolWorkouts.map((w) => ({
      id: w.id,
      type: "pool" as const,
      date: w.date,
      task: w.task,
      detail: `${w.volumeMeters} м${
        w.segmentDistance && w.segmentTimeCentis != null
          ? ` · ${w.segmentDistance} за ${formatSwimTime(w.segmentTimeCentis)}`
          : ""
      }${w.feeling ? ` · ${w.feeling}` : ""}`,
    })),
    ...gymWorkouts.map((w) => ({
      id: w.id,
      type: "gym" as const,
      date: w.date,
      task: w.task,
      detail: `${w.durationMinutes} мин`,
    })),
    ...flexWorkouts.map((w) => ({
      id: w.id,
      type: "flex" as const,
      date: w.date,
      task: w.task,
      detail: `${w.durationMinutes} мин`,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const TYPE_LABELS = { pool: "Бассейн", gym: "ОФП", flex: "Гибкость" } as const;
  const TYPE_TONES = { pool: "cyan", gym: "violet", flex: "green" } as const;

  // Тетрадь — записи сгруппированы по дате, как страницы дневника, а не
  // плоский список. history уже отсортирована по дате (свежие сверху), Map
  // сохраняет порядок первой вставки ключа — группировка не ломает сортировку.
  const historyByDay = new Map<string, typeof history>();
  for (const h of history) {
    const key = toDateInputValue(h.date);
    const day = historyByDay.get(key);
    if (day) day.push(h);
    else historyByDay.set(key, [h]);
  }
  const historyDays = Array.from(historyByDay.values());

  return (
    <>
      <PageHeader title="Дневник" description="Запиши тренировку — остальное ниже" />

      <Card className="mb-6">
        <CardBody>
          <h2 className="mb-4 font-heading text-lg font-bold">Тренировка в бассейне</h2>
          <PoolWorkoutForm hasLinkedChild={athleteExtra?.linkedChildId != null} />
        </CardBody>
      </Card>

      <div className="mb-6 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="mb-4 font-heading text-lg font-bold">ОФП (зал)</h2>
            <GymWorkoutForm />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h2 className="mb-4 font-heading text-lg font-bold">Гибкость</h2>
            <FlexibilityWorkoutForm />
          </CardBody>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/60">Неделя</p>
            <p className="mt-1 font-heading text-2xl font-bold">
              {weekRow ? weekRow.points.toFixed(1) : "0.0"} очков
            </p>
            <p className="mt-1 text-sm text-brand-text/60">
              {weekRow?.poolVolumeMeters ?? 0} м в бассейне · {weekRow?.gymMinutes ?? 0} мин ОФП ·{" "}
              {weekRow?.flexibilityMinutes ?? 0} мин гибкости
            </p>
            {weekIndex >= 0 && (
              <p className="mt-2 text-sm text-brand-cyan">
                Место в рейтинге: {weekIndex + 1} из {weekBoard.length}
              </p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/60">Месяц</p>
            <p className="mt-1 font-heading text-2xl font-bold">
              {monthRow ? monthRow.points.toFixed(1) : "0.0"} очков
            </p>
            <p className="mt-1 text-sm text-brand-text/60">
              {monthRow?.poolVolumeMeters ?? 0} м в бассейне · {monthRow?.gymMinutes ?? 0} мин ОФП ·{" "}
              {monthRow?.flexibilityMinutes ?? 0} мин гибкости
            </p>
            {monthIndex >= 0 && (
              <p className="mt-2 text-sm text-brand-cyan">
                Место в рейтинге: {monthIndex + 1} из {monthBoard.length}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6">
        <CardBody>
          <h2 className="mb-1 font-heading text-lg font-bold">Мой уровень</h2>
          {level ? (
            <>
              <p className="text-sm font-medium text-brand-cyan">{LEVEL_LABELS[level]}</p>
              <p className="mt-1 text-sm text-brand-text/60">
                Задания по ОФП и гибкости, а также история заплывов — в разделе{" "}
                <Link href="/athlete/trainings" className="text-brand-cyan hover:underline">
                  «Тренировки»
                </Link>
              </p>
            </>
          ) : (
            <p className="text-sm text-brand-text/50">
              Уровень пока не назначен, обратитесь к тренеру
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="mb-1 font-heading text-lg font-bold">Тетрадь тренировок</h2>
          <p className="mb-4 text-xs text-brand-text/50">
            Что было сделано и когда — по дням, как в обычной тетради
          </p>
          {historyDays.length === 0 ? (
            <EmptyState title="Записей пока нет" description="Добавь первую тренировку выше" />
          ) : (
            <div className="flex flex-col divide-y divide-white/10">
              {historyDays.map((day) => (
                <div key={toDateInputValue(day[0].date)} className="py-4 first:pt-0">
                  <p className="mb-2 font-heading text-sm font-bold capitalize text-brand-cyan">
                    {formatDateRu(day[0].date, "EEEE, d MMMM")}
                  </p>
                  <ul className="flex flex-col gap-2.5 border-l-2 border-white/10 pl-3">
                    {day.map((h) => (
                      <li key={`${h.type}-${h.id}`} className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge tone={TYPE_TONES[h.type]}>{TYPE_LABELS[h.type]}</Badge>
                            <p className="text-sm font-medium">{h.task}</p>
                          </div>
                          <p className="mt-1 text-xs text-brand-text/50">{h.detail}</p>
                        </div>
                        <form action={deleteWorkoutAction}>
                          <input type="hidden" name="type" value={h.type} />
                          <input type="hidden" name="id" value={h.id} />
                          <ConfirmSubmitButton confirmMessage="Удалить эту запись?">
                            Удалить
                          </ConfirmSubmitButton>
                        </form>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
