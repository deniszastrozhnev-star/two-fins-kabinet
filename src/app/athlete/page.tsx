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
import { AthleteRankSelect } from "@/components/athlete/AthleteRankSelect";
import { AthleteGenderSelect } from "@/components/athlete/AthleteGenderSelect";
import { getSuggestedRankForAthlete } from "@/lib/rankStandards";
import { formatDateRu } from "@/lib/dates";
import { ATHLETE_RANK_COLORS, ATHLETE_RANK_LABELS } from "@/lib/labels";

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
        select: { level: true, rank: true, gender: true },
      }),
    ]);

  const weekIndex = weekBoard.findIndex((r) => r.athleteId === athlete.id);
  const monthIndex = monthBoard.findIndex((r) => r.athleteId === athlete.id);
  const weekRow = weekIndex >= 0 ? weekBoard[weekIndex] : null;
  const monthRow = monthIndex >= 0 ? monthBoard[monthIndex] : null;
  const level = athleteExtra?.level ?? null;
  const rank = athleteExtra?.rank ?? null;
  const gender = athleteExtra?.gender ?? null;
  const suggestedRank = await getSuggestedRankForAthlete(athlete.id, gender);

  const history = [
    ...poolWorkouts.map((w) => ({
      id: w.id,
      type: "pool" as const,
      date: w.date,
      task: w.task,
      detail: `${w.volumeMeters} м${w.feeling ? ` · ${w.feeling}` : ""}`,
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

  return (
    <>
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        {rank ? (
          <p
            className="font-heading text-3xl font-bold sm:text-4xl"
            style={{
              color: ATHLETE_RANK_COLORS[rank],
              textShadow: `0 0 12px ${ATHLETE_RANK_COLORS[rank]}, 0 0 32px ${ATHLETE_RANK_COLORS[rank]}`,
            }}
          >
            {ATHLETE_RANK_LABELS[rank]}
          </p>
        ) : (
          <p className="text-sm text-brand-text/50">Укажи свой разряд</p>
        )}
        <AthleteRankSelect currentRank={rank} />

        {suggestedRank && (
          <p className="text-sm text-brand-text/60">
            По результатам соревнований:{" "}
            <span className="font-semibold" style={{ color: ATHLETE_RANK_COLORS[suggestedRank] }}>
              {ATHLETE_RANK_LABELS[suggestedRank]}
            </span>{" "}
            — при желании укажи в «Мой разряд» выше
          </p>
        )}

        <div className="flex items-center gap-2">
          {!gender && (
            <p className="text-xs text-brand-text/50">Укажи пол, чтобы видеть подсказку по разряду:</p>
          )}
          <AthleteGenderSelect currentGender={gender} />
        </div>
      </div>

      <PageHeader title="Дневник" description="Добавь тренировку и следи за своими показателями" />

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
            {weekRow && weekRow.missedDays > 0 && (
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="text-xs font-medium text-red-300">
                  Штрафы за пропуски (−{weekRow.missedDays * 2} очков)
                </p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {weekRow.missedDates.map((d) => (
                    <li key={d.toISOString()} className="text-xs text-brand-text/50">
                      −2 очка — нет записи за {formatDateRu(d)}
                    </li>
                  ))}
                </ul>
              </div>
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
            {monthRow && monthRow.missedDays > 0 && (
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="text-xs font-medium text-red-300">
                  Штрафы за пропуски (−{monthRow.missedDays * 2} очков)
                </p>
                <ul className="mt-1 flex max-h-32 flex-col gap-0.5 overflow-y-auto">
                  {monthRow.missedDates.map((d) => (
                    <li key={d.toISOString()} className="text-xs text-brand-text/50">
                      −2 очка — нет записи за {formatDateRu(d)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6">
        <CardBody>
          <h2 className="mb-1 font-heading text-lg font-bold">Мой уровень</h2>
          {level ? (
            <>
              <p className="text-sm font-medium text-brand-cyan">{level.name}</p>
              <p className="mt-1 text-sm text-brand-text/70">{level.ofpTask}</p>
            </>
          ) : (
            <p className="text-sm text-brand-text/50">
              Уровень пока не назначен, обратитесь к тренеру
            </p>
          )}
        </CardBody>
      </Card>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardBody>
            <h2 className="mb-4 font-heading text-lg font-bold">
              Тренировка в бассейне
            </h2>
            <PoolWorkoutForm />
          </CardBody>
        </Card>
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

      <Card>
        <CardBody>
          <h2 className="mb-3 font-heading text-lg font-bold">История</h2>
          {history.length === 0 ? (
            <EmptyState title="Записей пока нет" description="Добавь первую тренировку выше" />
          ) : (
            <ul className="flex flex-col divide-y divide-white/10">
              {history.map((h) => (
                <li key={`${h.type}-${h.id}`} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone={TYPE_TONES[h.type]}>{TYPE_LABELS[h.type]}</Badge>
                      <p className="text-sm font-medium">{h.task}</p>
                    </div>
                    <p className="mt-1 text-xs text-brand-text/50">
                      {formatDateRu(h.date)} · {h.detail}
                    </p>
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
          )}
        </CardBody>
      </Card>
    </>
  );
}
