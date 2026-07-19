import "server-only";
import { prisma } from "@/lib/prisma";
import { formatSwimTime } from "@/lib/swimTime";
import { FIN_DISCIPLINE_LABELS, TIMING_LABELS } from "@/lib/labels";
import type { FinDiscipline, TimingType } from "@prisma/client";

export type AthleteCompetitionRow = {
  id: string;
  competitionName: string;
  date: Date;
  discipline: FinDiscipline;
  timing: TimingType;
  disciplineLabel: string;
  timingLabel: string;
  resultCentis: number;
  resultLabel: string;
  isRecord: boolean;
};

/** Личный рекорд не хранится флагом в БД — минимальное время на связку
 * дисциплина+хронометраж считается заново при каждом обращении. */
function markRecords<T extends { discipline: FinDiscipline; timing: TimingType; resultCentis: number }>(
  rows: T[],
): (T & { isRecord: boolean })[] {
  const bestByEvent = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.discipline}|${r.timing}`;
    const cur = bestByEvent.get(key);
    if (cur === undefined || r.resultCentis < cur) bestByEvent.set(key, r.resultCentis);
  }
  return rows.map((r) => ({
    ...r,
    isRecord: r.resultCentis === bestByEvent.get(`${r.discipline}|${r.timing}`),
  }));
}

export async function getAthleteCompetitionHistory(
  athleteId: string,
): Promise<AthleteCompetitionRow[]> {
  const rows = await prisma.athleteCompetitionResult.findMany({
    where: { athleteId },
    orderBy: { date: "desc" },
  });

  return markRecords(rows).map((r) => ({
    id: r.id,
    competitionName: r.competitionName,
    date: r.date,
    discipline: r.discipline,
    timing: r.timing,
    disciplineLabel: FIN_DISCIPLINE_LABELS[r.discipline],
    timingLabel: TIMING_LABELS[r.timing],
    resultCentis: r.resultCentis,
    resultLabel: formatSwimTime(r.resultCentis),
    isRecord: r.isRecord,
  }));
}

export type AthleteRecordsRow = {
  athleteId: string;
  lastName: string;
  firstName: string;
  records: { disciplineLabel: string; timingLabel: string; resultLabel: string; date: Date }[];
};

/** Личные рекорды всех спортсменов — для тренерского вида. */
export async function getAllAthleteRecords(): Promise<AthleteRecordsRow[]> {
  const results = await prisma.athleteCompetitionResult.findMany({
    include: { athlete: { select: { id: true, lastName: true, firstName: true } } },
    orderBy: { date: "desc" },
  });

  const byAthlete = new Map<string, typeof results>();
  for (const r of results) {
    const list = byAthlete.get(r.athleteId) ?? [];
    list.push(r);
    byAthlete.set(r.athleteId, list);
  }

  const rows: AthleteRecordsRow[] = [];
  for (const [athleteId, athleteResults] of byAthlete) {
    const marked = markRecords(athleteResults);
    const records = marked
      .filter((r) => r.isRecord)
      .map((r) => ({
        disciplineLabel: FIN_DISCIPLINE_LABELS[r.discipline],
        timingLabel: TIMING_LABELS[r.timing],
        resultLabel: formatSwimTime(r.resultCentis),
        date: r.date,
      }));
    const first = athleteResults[0];
    rows.push({
      athleteId,
      lastName: first.athlete.lastName,
      firstName: first.athlete.firstName,
      records,
    });
  }

  rows.sort((a, b) => a.lastName.localeCompare(b.lastName, "ru"));
  return rows;
}
