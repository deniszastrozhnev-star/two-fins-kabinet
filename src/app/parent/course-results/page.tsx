import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { COURSE_RESULT_NAME } from "@/lib/courseResults";
import { formatDateRu } from "@/lib/dates";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

/** "50 м — 32.45" -> { distance: "50 м", time: "32.45" }; при неожиданном формате
 * (не должно случаться — строку всегда собирает upsertCourseResult) время просто
 * пустое, а вся строка уходит в дистанцию, чтобы ничего не потерять на экране. */
function splitCourseResult(result: string): { distance: string; time: string } {
  const [distance, time] = result.split(" — ");
  return { distance: distance ?? result, time: time ?? "" };
}

export default async function ParentCourseResultsPage() {
  const child = await requireParentChild();
  const results = await prisma.competitionResult.findMany({
    where: { childId: child.id, competitionName: COURSE_RESULT_NAME },
    orderBy: { date: "desc" },
  });

  return (
    <>
      <PageHeader title="Курсовка" description="Вся история результатов по дистанциям" />

      {results.length === 0 ? (
        <EmptyState
          title="Пока нет результатов"
          description="Тренер вносит курсовку на занятии — здесь появится вся история"
        />
      ) : (
        <Card>
          <CardBody className="flex flex-col divide-y divide-white/10 p-0">
            {results.map((r) => {
              const { distance, time } = splitCourseResult(r.result);
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
                >
                  <span className="text-sm text-brand-text/60">{formatDateRu(r.date)}</span>
                  <span className="text-sm font-medium">{distance}</span>
                  <span className="font-heading text-lg font-bold text-brand-cyan">{time}</span>
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}
    </>
  );
}
