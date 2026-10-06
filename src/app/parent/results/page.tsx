import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { COURSE_RESULT_NAME } from "@/lib/courseResults";
import { formatDateRu } from "@/lib/dates";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function ParentResultsPage() {
  const child = await requireParentChild();
  const results = await prisma.competitionResult.findMany({
    where: { childId: child.id, competitionName: { not: COURSE_RESULT_NAME } },
    orderBy: { date: "desc" },
  });

  return (
    <>
      <PageHeader title="Результаты соревнований" />

      {results.length === 0 ? (
        <EmptyState title="Результатов пока нет" />
      ) : (
        <Card>
          <CardBody className="flex flex-col divide-y divide-white/10 p-0">
            {results.map((r) => (
              <div key={r.id} className="px-4 py-3 sm:px-5">
                <p className="text-sm font-medium">{r.competitionName}</p>
                <p className="text-xs text-brand-text/50">
                  {formatDateRu(r.date)} · {r.result}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </>
  );
}
