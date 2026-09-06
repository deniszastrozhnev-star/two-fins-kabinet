import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { LEVEL_LABELS, LEVEL_ORDER } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function AttendanceGroupPickerPage() {
  await requireTrainer();

  const groups = await prisma.group.findMany({
    orderBy: [{ level: "asc" }, { name: "asc" }],
    include: { _count: { select: { children: true } } },
  });

  return (
    <>
      <PageHeader
        title="Посещаемость"
        description="Выберите группу, чтобы отметить, кто пришёл на занятие"
      />

      {groups.length === 0 ? (
        <EmptyState
          title="Пока нет ни одной группы"
          description="Сначала добавьте группу на экране «Расписание»."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {LEVEL_ORDER.map((level) => {
            const levelGroups = groups.filter((g) => g.level === level);
            if (levelGroups.length === 0) return null;
            return (
              <section key={level}>
                <h2 className="mb-3 font-heading text-lg font-bold text-brand-cyan">
                  {LEVEL_LABELS[level]}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {levelGroups.map((group) => (
                    <Link key={group.id} href={`/trainer/attendance/${group.id}`}>
                      <Card className="h-full transition hover:border-brand-cyan/50">
                        <CardBody>
                          <p className="font-heading text-base font-bold">{group.name}</p>
                          <p className="mt-2 text-sm text-brand-text/60">
                            {group.daysOfWeek.length > 0
                              ? group.daysOfWeek.join(", ")
                              : "Дни не указаны"}
                            {" · "}
                            {group.time}
                          </p>
                          <p className="mt-1 text-sm text-brand-text/50">
                            {group._count.children} детей
                          </p>
                        </CardBody>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
