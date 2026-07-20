import { requireAthlete } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAthleteCompetitionHistory } from "@/lib/athleteCompetitions";
import { deleteAthleteCompetitionResultAction } from "@/lib/actions/athlete-competition-actions";
import { COURSE_RESULT_NAME } from "@/lib/courseResults";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmSubmitButton } from "@/components/trainer/ConfirmSubmitButton";
import { AthleteCompetitionResultForm } from "@/components/athlete/AthleteCompetitionResultForm";
import { formatDateRu } from "@/lib/dates";

export default async function AthleteCompetitionsPage() {
  const athlete = await requireAthlete();
  const athleteExtra = await prisma.athlete.findUnique({
    where: { id: athlete.id },
    select: { linkedChildId: true },
  });
  const [results, courseResults] = await Promise.all([
    getAthleteCompetitionHistory(athlete.id),
    athleteExtra?.linkedChildId
      ? prisma.competitionResult.findMany({
          where: { childId: athleteExtra.linkedChildId, competitionName: COURSE_RESULT_NAME },
          orderBy: { date: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        title="Соревнования"
        description="Вноси результаты — личный рекорд по каждой дистанции считается сам"
      />

      <Card className="mb-6">
        <CardBody>
          <h2 className="mb-4 font-heading text-lg font-bold">Добавить результат</h2>
          <AthleteCompetitionResultForm />
        </CardBody>
      </Card>

      {courseResults.length > 0 && (
        <Card className="mb-6">
          <CardBody>
            <h2 className="mb-3 font-heading text-lg font-bold">Курсовка (группа)</h2>
            <p className="mb-3 text-xs text-brand-text/50">
              Результаты курсовки из обычной группы — вносит тренер или ты сам через «Тренировку в
              бассейне»
            </p>
            <ul className="flex flex-col divide-y divide-white/10">
              {courseResults.map((r) => (
                <li key={r.id} className="py-2">
                  <p className="text-sm font-medium">{r.result}</p>
                  <p className="mt-1 text-xs text-brand-text/50">{formatDateRu(r.date)}</p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <h2 className="mb-3 font-heading text-lg font-bold">История</h2>
          {results.length === 0 ? (
            <EmptyState title="Результатов пока нет" description="Добавь первый результат выше" />
          ) : (
            <ul className="flex flex-col divide-y divide-white/10">
              {results.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                  <div>
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
                  </div>
                  <form action={deleteAthleteCompetitionResultAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <ConfirmSubmitButton confirmMessage="Удалить этот результат?">
                      Удалить
                    </ConfirmSubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
