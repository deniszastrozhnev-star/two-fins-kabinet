import { prisma } from "@/lib/prisma";
import { requireHeadTrainer } from "@/lib/auth";
import {
  createAthleteLevelAction,
  updateAthleteLevelAction,
  deleteAthleteLevelAction,
} from "@/lib/actions/athlete-level-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AthleteLevelForm } from "@/components/trainer/AthleteLevelForm";
import { AssignAthleteLevelSelect } from "@/components/trainer/AssignAthleteLevelSelect";
import { ConfirmSubmitButton } from "@/components/trainer/ConfirmSubmitButton";

export default async function AthleteLevelsPage() {
  await requireHeadTrainer();

  const [levels, athletes] = await Promise.all([
    prisma.athleteLevel.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.athlete.findMany({
      select: { id: true, lastName: true, firstName: true, levelId: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Тренировки"
        description="Уровни спортсменов и задания по ОФП — отдельно от уровней групп"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card>
            <CardBody>
              <h2 className="mb-3 font-heading text-lg font-bold">Добавить уровень</h2>
              <AthleteLevelForm action={createAthleteLevelAction} submitLabel="Добавить" />
            </CardBody>
          </Card>

          {levels.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  title="Уровней пока нет"
                  description="Добавьте первый уровень выше — например, «Начальный» или «Продвинутый»"
                />
              </CardBody>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {levels.map((level) => (
                <Card key={level.id}>
                  <CardBody>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-heading text-base font-bold">{level.name}</h3>
                      <form action={deleteAthleteLevelAction}>
                        <input type="hidden" name="id" value={level.id} />
                        <ConfirmSubmitButton
                          confirmMessage={`Удалить уровень «${level.name}»? Спортсмены на этом уровне останутся без уровня.`}
                        >
                          Удалить
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                    <AthleteLevelForm
                      action={updateAthleteLevelAction}
                      initial={{ id: level.id, name: level.name, ofpTask: level.ofpTask }}
                    />
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
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
                    <span className="font-medium">
                      {a.lastName} {a.firstName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-brand-text/50">Уровень:</span>
                      <AssignAthleteLevelSelect
                        athleteId={a.id}
                        currentLevelId={a.levelId}
                        levels={levels}
                      />
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
