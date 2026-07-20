import { prisma } from "@/lib/prisma";
import { requireHeadTrainer } from "@/lib/auth";
import { formatDateRu } from "@/lib/dates";
import { TRAINER_ROLE_LABELS } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrainerForm } from "@/components/trainer/TrainerForm";
import { DeleteTrainerButton } from "@/components/trainer/DeleteTrainerButton";

export default async function TeamPage() {
  const currentTrainer = await requireHeadTrainer();

  const trainers = await prisma.trainer.findMany({
    orderBy: [{ role: "asc" }, { username: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Тренеры"
        description="Аккаунты тренеров школы — каждый входит под своим логином и видит все группы"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody className="flex flex-col divide-y divide-white/10 p-0">
            {trainers.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
              >
                <div>
                  <p className="font-medium">{t.username}</p>
                  <p className="text-xs text-brand-text/50">
                    В команде с {formatDateRu(t.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={t.role === "HEAD" ? "violet" : "neutral"}>
                    {TRAINER_ROLE_LABELS[t.role]}
                  </Badge>
                  {t.id !== currentTrainer.id && (
                    <DeleteTrainerButton id={t.id} username={t.username} />
                  )}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-4 font-heading text-lg font-bold">
              Добавить тренера
            </h2>
            <TrainerForm />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
