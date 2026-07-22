import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { getAthleteCompetitionHistory } from "@/lib/athleteCompetitions";
import { deleteAthleteAction } from "@/lib/actions/athlete-delete-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmSubmitButton } from "@/components/trainer/ConfirmSubmitButton";
import { formatDateRu } from "@/lib/dates";
import {
  ATHLETE_RANK_COLORS,
  ATHLETE_RANK_LABELS,
  GENDER_LABELS,
  LEVEL_LABELS,
  TRAINING_LOG_TYPE_LABELS,
} from "@/lib/labels";

export default async function TrainerAthleteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const trainer = await requireTrainer();
  const { id } = await params;

  const athlete = await prisma.athlete.findUnique({ where: { id } });
  if (!athlete) notFound();

  const [poolWorkouts, gymWorkouts, flexWorkouts, competitions, trainingLogs] =
    await Promise.all([
      prisma.poolWorkout.findMany({ where: { athleteId: id }, orderBy: { date: "desc" } }),
      prisma.gymWorkout.findMany({ where: { athleteId: id }, orderBy: { date: "desc" } }),
      prisma.flexibilityWorkout.findMany({ where: { athleteId: id }, orderBy: { date: "desc" } }),
      getAthleteCompetitionHistory(id),
      prisma.levelTrainingLog.findMany({
        where: { athleteId: id },
        orderBy: { date: "desc" },
        take: 50,
      }),
    ]);

  return (
    <>
      <PageHeader
        title={`${athlete.lastName} ${athlete.firstName}`}
        description="Карточка спортсмена — записи по отдельности"
      />

      <Card className="mb-6">
        <CardBody className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span>
            Разряд:{" "}
            {athlete.rank ? (
              <span
                className="font-semibold"
                style={{ color: ATHLETE_RANK_COLORS[athlete.rank] }}
              >
                {ATHLETE_RANK_LABELS[athlete.rank]}
              </span>
            ) : (
              <span className="text-brand-text/50">не указан</span>
            )}
          </span>
          <span>
            Пол:{" "}
            {athlete.gender ? (
              GENDER_LABELS[athlete.gender]
            ) : (
              <span className="text-brand-text/50">не указан</span>
            )}
          </span>
          <span>
            Уровень:{" "}
            {athlete.level ? (
              LEVEL_LABELS[athlete.level]
            ) : (
              <span className="text-brand-text/50">не назначен</span>
            )}
          </span>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="mb-3 font-heading text-lg font-bold">Бассейн</h2>
            {poolWorkouts.length === 0 ? (
              <EmptyState title="Записей пока нет" />
            ) : (
              <ul className="flex flex-col divide-y divide-white/10">
                {poolWorkouts.map((w) => (
                  <li key={w.id} className="py-2">
                    <p className="text-sm font-medium">{w.task}</p>
                    <p className="mt-1 text-xs text-brand-text/50">
                      {formatDateRu(w.date)} · {w.volumeMeters} м
                      {w.feeling ? ` · ${w.feeling}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-3 font-heading text-lg font-bold">ОФП</h2>
            {gymWorkouts.length === 0 ? (
              <EmptyState title="Записей пока нет" />
            ) : (
              <ul className="flex flex-col divide-y divide-white/10">
                {gymWorkouts.map((w) => (
                  <li key={w.id} className="py-2">
                    <p className="text-sm font-medium">{w.task}</p>
                    <p className="mt-1 text-xs text-brand-text/50">
                      {formatDateRu(w.date)} · {w.durationMinutes} мин
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-3 font-heading text-lg font-bold">Гибкость</h2>
            {flexWorkouts.length === 0 ? (
              <EmptyState title="Записей пока нет" />
            ) : (
              <ul className="flex flex-col divide-y divide-white/10">
                {flexWorkouts.map((w) => (
                  <li key={w.id} className="py-2">
                    <p className="text-sm font-medium">{w.task}</p>
                    <p className="mt-1 text-xs text-brand-text/50">
                      {formatDateRu(w.date)} · {w.durationMinutes} мин
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-3 font-heading text-lg font-bold">Соревнования</h2>
            {competitions.length === 0 ? (
              <EmptyState title="Записей пока нет" />
            ) : (
              <ul className="flex flex-col divide-y divide-white/10">
                {competitions.map((r) => (
                  <li key={r.id} className="py-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {r.disciplineLabel} · {r.timingLabel}
                      </p>
                      {r.isRecord && <Badge tone="amber">Личный рекорд</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-brand-text/50">
                      {formatDateRu(r.date)} · {r.competitionName} ·{" "}
                      <span className="font-semibold text-brand-text/80">{r.resultLabel}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardBody>
            <h2 className="mb-3 font-heading text-lg font-bold">Архив выполнения</h2>
            {trainingLogs.length === 0 ? (
              <EmptyState title="Отметок выполнения пока нет" />
            ) : (
              <ul className="flex flex-col divide-y divide-white/10">
                {trainingLogs.map((log) => (
                  <li key={log.id} className="py-2">
                    <p className="text-sm font-medium">{TRAINING_LOG_TYPE_LABELS[log.type]}</p>
                    <p className="mt-1 text-xs text-brand-text/50">
                      {formatDateRu(log.date)} · {log.durationMinutes} мин ·{" "}
                      {LEVEL_LABELS[log.level]}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {trainer.role === "HEAD" && (
          <Card className="lg:col-span-2">
            <CardBody className="flex items-center justify-between">
              <div>
                <p className="font-medium">Удалить спортсмена</p>
                <p className="text-xs text-brand-text/50">
                  Вместе со спортсменом удалятся все его записи дневника, соревнований и архива
                </p>
              </div>
              <form action={deleteAthleteAction}>
                <input type="hidden" name="id" value={athlete.id} />
                <ConfirmSubmitButton
                  confirmMessage={`Удалить ${athlete.lastName} ${athlete.firstName}? Это действие нельзя отменить.`}
                >
                  Удалить
                </ConfirmSubmitButton>
              </form>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
