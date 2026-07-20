import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireHeadTrainer } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LevelTrainingForm } from "@/components/trainer/LevelTrainingForm";
import { AssignAthleteLevelSelect } from "@/components/trainer/AssignAthleteLevelSelect";
import { ATHLETE_LEVEL_ORDER, LEVEL_LABELS } from "@/lib/labels";

export default async function AthleteLevelsPage() {
  await requireHeadTrainer();

  const [trainings, athletes] = await Promise.all([
    prisma.levelTraining.findMany(),
    prisma.athlete.findMany({
      select: { id: true, lastName: true, firstName: true, level: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  const trainingByLevel = new Map(trainings.map((t) => [t.level, t]));

  return (
    <>
      <PageHeader
        title="Тренировки"
        description="Задания по ОФП и гибкости для каждого уровня + уровень спортсмена"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          {ATHLETE_LEVEL_ORDER.map((level) => {
            const training = trainingByLevel.get(level);
            return (
              <Card key={level}>
                <CardBody>
                  <h3 className="mb-3 font-heading text-base font-bold">{LEVEL_LABELS[level]}</h3>
                  <LevelTrainingForm level={level} initial={training ?? undefined} />
                </CardBody>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardBody>
            <h2 className="mb-3 font-heading text-lg font-bold">
              Спортсмены ({athletes.length})
            </h2>
            {athletes.length === 0 ? (
              <EmptyState
                title="Пока нет спортсменов"
                description="Спортсмены регистрируются самостоятельно на странице входа"
              />
            ) : (
              <ul className="flex flex-col divide-y divide-white/10">
                {athletes.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <Link href={`/trainer/athletes/${a.id}`} className="font-medium hover:underline">
                      {a.lastName} {a.firstName}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-brand-text/50">Уровень:</span>
                      <AssignAthleteLevelSelect athleteId={a.id} currentLevel={a.level} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
