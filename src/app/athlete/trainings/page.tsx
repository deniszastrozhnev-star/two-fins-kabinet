import { prisma } from "@/lib/prisma";
import { requireAthlete } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LEVEL_LABELS } from "@/lib/labels";

export default async function AthleteTrainingsPage() {
  const athlete = await requireAthlete();

  const athleteExtra = await prisma.athlete.findUnique({
    where: { id: athlete.id },
    select: { level: true },
  });
  const level = athleteExtra?.level ?? null;

  const training = level
    ? await prisma.levelTraining.findUnique({ where: { level } })
    : null;

  return (
    <>
      <PageHeader
        title="Тренировки"
        description="Ориентир от тренера по твоему уровню — ОФП и гибкость"
      />

      {!level ? (
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/50">
              Уровень пока не назначен, обратитесь к тренеру
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-brand-text/60">
            Твой уровень: <span className="font-semibold text-brand-cyan">{LEVEL_LABELS[level]}</span>
          </p>

          <Card>
            <CardBody>
              <h2 className="mb-2 font-heading text-lg font-bold">ОФП</h2>
              {training?.ofpTask ? (
                <p className="whitespace-pre-wrap text-sm text-brand-text/80">{training.ofpTask}</p>
              ) : (
                <p className="text-sm text-brand-text/50">Задание пока не добавлено</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="mb-2 font-heading text-lg font-bold">Гибкость</h2>
              {training?.flexibilityTask ? (
                <p className="whitespace-pre-wrap text-sm text-brand-text/80">
                  {training.flexibilityTask}
                </p>
              ) : (
                <p className="text-sm text-brand-text/50">Задание пока не добавлено</p>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
