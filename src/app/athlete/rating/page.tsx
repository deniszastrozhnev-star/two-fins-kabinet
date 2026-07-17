import Link from "next/link";
import { requireAthleteChild } from "@/lib/auth";
import { getAthleteLeaderboard, AthletePeriod } from "@/lib/athletes";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function AthleteRatingPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const child = await requireAthleteChild();
  const { period: periodParam } = await searchParams;
  const period: AthletePeriod = periodParam === "month" ? "month" : "week";

  const board = await getAthleteLeaderboard(period);

  return (
    <>
      <PageHeader title="Рейтинг" description="Все спортсмены школы" />

      <div className="mb-4 flex gap-1.5">
        <Link
          href="/athlete/rating?period=week"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            period === "week"
              ? "bg-brand-cyan/20 text-brand-cyan"
              : "text-brand-text/60 hover:bg-white/5"
          }`}
        >
          Неделя
        </Link>
        <Link
          href="/athlete/rating?period=month"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            period === "month"
              ? "bg-brand-cyan/20 text-brand-cyan"
              : "text-brand-text/60 hover:bg-white/5"
          }`}
        >
          Месяц
        </Link>
      </div>

      <Card className="overflow-x-auto">
        <CardBody className="p-0">
          {board.length === 0 ? (
            <div className="p-5">
              <EmptyState title="Пока нет данных" description="Ни одной тренировки за этот период" />
            </div>
          ) : (
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-brand-text/60">
                  <th className="px-4 py-3 font-medium sm:px-5">#</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Спортсмен</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Бассейн</th>
                  <th className="px-4 py-3 font-medium sm:px-5">ОФП</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Очки</th>
                </tr>
              </thead>
              <tbody>
                {board.map((row, i) => (
                  <tr
                    key={row.childId}
                    className={`border-b border-white/5 ${row.childId === child.id ? "bg-brand-cyan/10" : ""}`}
                  >
                    <td className="px-4 py-3 sm:px-5">
                      {period === "month" && i === 0 ? "🏆" : i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium sm:px-5">
                      {row.lastName} {row.firstName}
                    </td>
                    <td className="px-4 py-3 sm:px-5">{row.poolVolumeMeters} м</td>
                    <td className="px-4 py-3 sm:px-5">{row.gymMinutes} мин</td>
                    <td className="px-4 py-3 font-semibold text-brand-cyan sm:px-5">
                      {row.points.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </>
  );
}
