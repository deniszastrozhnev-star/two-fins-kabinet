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
import { formatDateRu } from "@/lib/dates";

export default async function AthletePage() {
  const athlete = await requireAthlete();

  const [weekBoard, monthBoard, poolWorkouts, gymWorkouts] = await Promise.all([
    getAthleteLeaderboard("week"),
    getAthleteLeaderboard("month"),
    prisma.poolWorkout.findMany({ where: { athleteId: athlete.id }, orderBy: { date: "desc" } }),
    prisma.gymWorkout.findMany({ where: { athleteId: athlete.id }, orderBy: { date: "desc" } }),
  ]);

  const weekIndex = weekBoard.findIndex((r) => r.athleteId === athlete.id);
  const monthIndex = monthBoard.findIndex((r) => r.athleteId === athlete.id);
  const weekRow = weekIndex >= 0 ? weekBoard[weekIndex] : null;
  const monthRow = monthIndex >= 0 ? monthBoard[monthIndex] : null;

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
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <>
      <PageHeader title="Дневник" description="Добавь тренировку и следи за своими показателями" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/60">Неделя</p>
            <p className="mt-1 font-heading text-2xl font-bold">
              {weekRow ? weekRow.points.toFixed(1) : "0.0"} очков
            </p>
            <p className="mt-1 text-sm text-brand-text/60">
              {weekRow?.poolVolumeMeters ?? 0} м в бассейне · {weekRow?.gymMinutes ?? 0} мин ОФП
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
              {monthRow?.poolVolumeMeters ?? 0} м в бассейне · {monthRow?.gymMinutes ?? 0} мин ОФП
            </p>
            {monthIndex >= 0 && (
              <p className="mt-2 text-sm text-brand-cyan">
                Место в рейтинге: {monthIndex + 1} из {monthBoard.length}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
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
                      <Badge tone={h.type === "pool" ? "cyan" : "violet"}>
                        {h.type === "pool" ? "Бассейн" : "ОФП"}
                      </Badge>
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
