import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { getWorkoffBalance } from "@/lib/workoffs";
import { LEVEL_LABELS } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ParentWorkoffSchedulePage() {
  const child = await requireParentChild();
  const balance = await getWorkoffBalance(child.id);

  if (!child.group) {
    return (
      <>
        <PageHeader title="Расписание отработок" />
        <EmptyState
          title="Группа пока не назначена"
          description="Как только тренер добавит вас в группу, здесь появится расписание отработок вашего уровня."
        />
      </>
    );
  }

  const groups = await prisma.group.findMany({
    where: { level: child.group.level },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Расписание отработок"
        description={`Группы уровня «${LEVEL_LABELS[child.group.level]}» — куда можно прийти отрабатывать`}
      />

      {balance <= 0 && (
        <p className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-brand-text/60">
          Сейчас у вас нет пропущенных занятий, требующих отработки.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((g) => (
          <Card key={g.id}>
            <CardBody>
              <p className="font-heading font-bold">{g.name}</p>
              <p className="mt-1 text-sm text-brand-text/60">
                {g.daysOfWeek.join(", ")} · {g.time}
              </p>
              <p className="mt-1 text-sm text-brand-text/50">{g.pool}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
