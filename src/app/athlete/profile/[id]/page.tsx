import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAthlete } from "@/lib/auth";
import { getAthleteLeaderboard } from "@/lib/athletes";
import { getAthleteCompetitionHistory } from "@/lib/athleteCompetitions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateRu } from "@/lib/dates";
import { ATHLETE_RANK_COLORS, ATHLETE_RANK_LABELS } from "@/lib/labels";

export default async function AthletePublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAthlete();
  const { id } = await params;

  const athlete = await prisma.athlete.findUnique({ where: { id } });
  if (!athlete) notFound();

  const [weekBoard, monthBoard, records] = await Promise.all([
    getAthleteLeaderboard("week"),
    getAthleteLeaderboard("month"),
    getAthleteCompetitionHistory(id),
  ]);

  const weekPlace = weekBoard.findIndex((r) => r.athleteId === id);
  const monthPlace = monthBoard.findIndex((r) => r.athleteId === id);
  const personalRecords = records.filter((r) => r.isRecord);

  return (
    <>
      <PageHeader
        title={`${athlete.lastName} ${athlete.firstName}`}
        description="Карточка спортсмена"
      />

      <Card className="mb-6">
        <CardBody className="flex flex-col items-center gap-3 text-center">
          {athlete.rank ? (
            <p
              className="font-heading text-3xl font-bold"
              style={{
                color: ATHLETE_RANK_COLORS[athlete.rank],
                textShadow: `0 0 12px ${ATHLETE_RANK_COLORS[athlete.rank]}, 0 0 32px ${ATHLETE_RANK_COLORS[athlete.rank]}`,
              }}
            >
              {ATHLETE_RANK_LABELS[athlete.rank]}
            </p>
          ) : (
            <p className="text-sm text-brand-text/50">Разряд не указан</p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <p className="font-heading text-xl font-bold text-brand-cyan">
                {weekPlace >= 0 ? weekPlace + 1 : "—"}
                {weekPlace >= 0 && (
                  <span className="text-sm text-brand-text/50">/{weekBoard.length}</span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-brand-text/60">место за неделю</p>
            </div>
            <div>
              <p className="font-heading text-xl font-bold text-brand-cyan">
                {monthPlace >= 0 ? monthPlace + 1 : "—"}
                {monthPlace >= 0 && (
                  <span className="text-sm text-brand-text/50">/{monthBoard.length}</span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-brand-text/60">место за месяц</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="mb-3 font-heading text-lg font-bold">Личные рекорды</h2>
          {personalRecords.length === 0 ? (
            <EmptyState title="Рекордов пока нет" />
          ) : (
            <ul className="flex flex-col divide-y divide-white/10">
              {personalRecords.map((r) => (
                <li key={r.id} className="py-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {r.disciplineLabel} · {r.timingLabel}
                    </p>
                    <Badge tone="amber">Личный рекорд</Badge>
                  </div>
                  <p className="mt-1 text-xs text-brand-text/50">
                    {formatDateRu(r.date)} ·{" "}
                    <span className="font-semibold text-brand-text/80">{r.resultLabel}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
