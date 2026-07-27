import { prisma } from "@/lib/prisma";
import { requireAthlete } from "@/lib/auth";
import { getAthleteLeaderboard } from "@/lib/athletes";
import { getSuggestedRankForAthlete } from "@/lib/rankStandards";
import { getActiveStoriesFeed } from "@/lib/stories";
import { AthleteShell } from "@/components/athlete/AthleteShell";

export default async function AthleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const athlete = await requireAthlete();

  const [athleteExtra, weekBoard, storiesFeed] = await Promise.all([
    prisma.athlete.findUnique({
      where: { id: athlete.id },
      select: { rank: true, gender: true, avatarUrl: true },
    }),
    getAthleteLeaderboard("week"),
    getActiveStoriesFeed({ role: "athlete", id: athlete.id }),
  ]);

  const rank = athleteExtra?.rank ?? null;
  const gender = athleteExtra?.gender ?? null;
  const avatarUrl = athleteExtra?.avatarUrl ? `/api/avatars/${athlete.id}` : null;

  const suggestedRank = await getSuggestedRankForAthlete(athlete.id, gender);

  const weekIndex = weekBoard.findIndex((r) => r.athleteId === athlete.id);
  const weekRow = weekIndex >= 0 ? weekBoard[weekIndex] : null;

  return (
    <AthleteShell
      athleteName={`${athlete.lastName} ${athlete.firstName}`}
      avatarUrl={avatarUrl}
      rank={rank}
      gender={gender}
      suggestedRank={suggestedRank}
      weekVolumeMeters={weekRow?.poolVolumeMeters ?? 0}
      weekGymMinutes={weekRow?.gymMinutes ?? 0}
      weekPlace={weekIndex >= 0 ? weekIndex + 1 : null}
      weekTotal={weekBoard.length}
      storiesFeed={storiesFeed}
    >
      {children}
    </AthleteShell>
  );
}
