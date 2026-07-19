import "server-only";
import { prisma } from "@/lib/prisma";
import { getAthleteCompetitionHistory } from "@/lib/athleteCompetitions";
import { ATHLETE_RANK_ORDER } from "@/lib/labels";
import type { AthleteRank, FinDiscipline, Gender, RankStandard, TimingType } from "@prisma/client";

export async function getRankStandardsTable(): Promise<RankStandard[]> {
  return prisma.rankStandard.findMany();
}

/** Среди нормативов данной дисциплины+хронометража+пола находит самый высокий
 * разряд, чьё время спортсмен уже превзошёл (resultCentis <= норматив). */
export function suggestRank(
  standards: RankStandard[],
  discipline: FinDiscipline,
  timing: TimingType,
  gender: Gender,
  resultCentis: number,
): AthleteRank | null {
  const matching = standards.filter(
    (s) => s.discipline === discipline && s.timing === timing && s.gender === gender,
  );

  let best: AthleteRank | null = null;
  for (const s of matching) {
    if (resultCentis > s.centiseconds) continue;
    if (best === null || ATHLETE_RANK_ORDER.indexOf(s.rank) > ATHLETE_RANK_ORDER.indexOf(best)) {
      best = s.rank;
    }
  }
  return best;
}

/** Лучший разряд, соответствующий личным рекордам спортсмена по всем дисциплинам. */
export async function getSuggestedRankForAthlete(
  athleteId: string,
  gender: Gender | null,
): Promise<AthleteRank | null> {
  if (!gender) return null;

  const [history, standards] = await Promise.all([
    getAthleteCompetitionHistory(athleteId),
    getRankStandardsTable(),
  ]);

  let best: AthleteRank | null = null;
  for (const r of history) {
    if (!r.isRecord) continue;
    const suggestion = suggestRank(standards, r.discipline, r.timing, gender, r.resultCentis);
    if (suggestion === null) continue;
    if (best === null || ATHLETE_RANK_ORDER.indexOf(suggestion) > ATHLETE_RANK_ORDER.indexOf(best)) {
      best = suggestion;
    }
  }
  return best;
}
