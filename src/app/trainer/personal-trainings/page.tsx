import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { formatDateRu } from "@/lib/dates";
import { deletePersonalTrainingAction } from "@/lib/actions/personal-training-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PersonalTrainingForm } from "@/components/trainer/PersonalTrainingForm";
import { ConfirmSubmitButton } from "@/components/trainer/ConfirmSubmitButton";
import { PERSONAL_TRAINING_RATE } from "@/lib/salary";

export default async function PersonalTrainingsPage() {
  const trainer = await requireTrainer();

  const [children, trainings] = await Promise.all([
    prisma.child.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, lastName: true, firstName: true },
    }),
    prisma.personalTraining.findMany({
      where: { trainerId: trainer.id },
      include: { child: true },
      orderBy: [{ date: "desc" }, { time: "desc" }],
      take: 30,
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Персональные тренировки"
        description={`Начисляется ${PERSONAL_TRAINING_RATE}₽ за состоявшуюся тренировку (45 минут)`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="mb-4 font-heading text-lg font-bold">
              Новая тренировка
            </h2>
            <PersonalTrainingForm childrenList={children} />
          </CardBody>
        </Card>

        <div>
          <h2 className="mb-3 font-heading text-lg font-bold">Последние записи</h2>
          {trainings.length === 0 ? (
            <EmptyState
              title="Пока нет записей"
              description="Добавьте первую персональную тренировку слева."
            />
          ) : (
            <Card>
              <CardBody className="flex flex-col divide-y divide-white/10 p-0">
                {trainings.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
                  >
                    <div>
                      <p className="font-medium">
                        {t.personType === "CHILD"
                          ? `${t.child?.lastName} ${t.child?.firstName}`
                          : t.adultName}
                      </p>
                      <p className="text-xs text-brand-text/50">
                        {formatDateRu(t.date)} · {t.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={t.completed ? "green" : "neutral"}>
                        {t.completed ? "состоялась" : "не состоялась"}
                      </Badge>
                      <form action={deletePersonalTrainingAction}>
                        <input type="hidden" name="id" value={t.id} />
                        <ConfirmSubmitButton confirmMessage="Удалить эту запись?">
                          Удалить
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
