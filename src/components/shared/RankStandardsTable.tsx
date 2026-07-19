import { Card, CardBody } from "@/components/ui/Card";
import { FIN_DISCIPLINE_LABELS, TIMING_LABELS } from "@/lib/labels";
import { formatSwimTime } from "@/lib/swimTime";
import type { AthleteRank, FinDiscipline, RankStandard, TimingType } from "@prisma/client";

const ADULT_DISCIPLINES: FinDiscipline[] = [
  "APNEA50",
  "M50",
  "M100",
  "M200",
  "M400",
  "M800",
  "M1500",
  "UNDERWATER100",
  "UNDERWATER400",
  "CLASSIC50",
  "CLASSIC100",
  "CLASSIC200",
  "CLASSIC400",
];

const YOUTH_DISCIPLINES: FinDiscipline[] = [
  "M50",
  "M100",
  "M200",
  "M400",
  "M800",
  "UNDERWATER100",
  "CLASSIC50",
  "CLASSIC100",
  "CLASSIC200",
  "CLASSIC400",
];

const ADULT_COLUMNS: { rank: AthleteRank; label: string }[] = [
  { rank: "MSMK", label: "МСМК" },
  { rank: "MS", label: "МС" },
  { rank: "KMS", label: "КМС" },
  { rank: "ADULT_1", label: "I" },
  { rank: "ADULT_2", label: "II" },
  { rank: "ADULT_3", label: "III" },
];

const YOUTH_COLUMNS: { rank: AthleteRank; label: string }[] = [
  { rank: "YOUTH_1", label: "I юн" },
  { rank: "YOUTH_2", label: "II юн" },
  { rank: "YOUTH_3", label: "III юн" },
];

const TIMINGS: TimingType[] = ["MANUAL", "AUTO"];

function StandardsSection({
  title,
  disciplines,
  columns,
  standards,
}: {
  title: string;
  disciplines: FinDiscipline[];
  columns: { rank: AthleteRank; label: string }[];
  standards: RankStandard[];
}) {
  const lookup = new Map<string, RankStandard>();
  for (const s of standards) {
    lookup.set(`${s.discipline}|${s.timing}|${s.gender}|${s.rank}`, s);
  }

  return (
    <Card className="mb-6 overflow-x-auto">
      <CardBody>
        <h2 className="mb-3 font-heading text-lg font-bold">{title}</h2>
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-brand-text/60">
              <th className="px-3 py-2 font-medium">Дисциплина</th>
              <th className="px-3 py-2 font-medium">Хронометраж</th>
              {columns.map((c) => (
                <th key={c.rank} className="px-3 py-2 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {disciplines.map((discipline) =>
              TIMINGS.map((timing) => (
                <tr key={`${discipline}-${timing}`} className="border-b border-white/5">
                  <td className="px-3 py-2 font-medium">{FIN_DISCIPLINE_LABELS[discipline]}</td>
                  <td className="px-3 py-2 text-brand-text/60">{TIMING_LABELS[timing]}</td>
                  {columns.map((c) => {
                    const male = lookup.get(`${discipline}|${timing}|MALE|${c.rank}`);
                    const female = lookup.get(`${discipline}|${timing}|FEMALE|${c.rank}`);
                    return (
                      <td key={c.rank} className="px-3 py-2 whitespace-nowrap">
                        {male && female ? (
                          <>
                            М: {formatSwimTime(male.centiseconds)} / Ж:{" "}
                            {formatSwimTime(female.centiseconds)}
                          </>
                        ) : (
                          <span className="text-brand-text/30">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}

export function RankStandardsTable({ standards }: { standards: RankStandard[] }) {
  return (
    <>
      <StandardsSection
        title="Взрослые разряды"
        disciplines={ADULT_DISCIPLINES}
        columns={ADULT_COLUMNS}
        standards={standards}
      />
      <StandardsSection
        title="Юношеские разряды"
        disciplines={YOUTH_DISCIPLINES}
        columns={YOUTH_COLUMNS}
        standards={standards}
      />
    </>
  );
}
