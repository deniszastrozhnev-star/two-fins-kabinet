import Link from "next/link";
import { notFound } from "next/navigation";
import { addDays, subDays } from "date-fns";
import { requireHeadTrainer } from "@/lib/auth";
import { getLevelTrainingDates, getLevelTrainingForDate } from "@/lib/levelTraining";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LevelTrainingForm } from "@/components/trainer/LevelTrainingForm";
import { LevelTrainingDatePicker } from "@/components/trainer/LevelTrainingDatePicker";
import { toDateInputValue, parseDateInputValue, formatDateRu } from "@/lib/dates";
import { ATHLETE_LEVEL_ORDER, LEVEL_LABELS } from "@/lib/labels";
import type { GroupLevel } from "@prisma/client";

export default async function LevelTrainingDayPage({
  params,
  searchParams,
}: {
  params: Promise<{ level: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  await requireHeadTrainer();

  const { level: levelParam } = await params;
  if (!ATHLETE_LEVEL_ORDER.includes(levelParam as GroupLevel)) notFound();
  const level = levelParam as GroupLevel;

  const { date: dateParam } = await searchParams;
  const dateStr = dateParam ?? toDateInputValue(new Date());
  const date = parseDateInputValue(dateStr);

  const [training, dates] = await Promise.all([
    getLevelTrainingForDate(level, date),
    getLevelTrainingDates(level),
  ]);

  const prevDate = toDateInputValue(subDays(date, 1));
  const nextDate = toDateInputValue(addDays(date, 1));

  return (
    <>
      <PageHeader
        title={`Тренировки — ${LEVEL_LABELS[level]}`}
        description="Задание по ОФП и гибкости на конкретный день — журнал, прошлые дни сохраняются"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href={`/trainer/athlete-levels/${level}?date=${prevDate}`}
                className="rounded-lg px-3 py-1.5 text-sm text-brand-text/60 hover:bg-white/5"
              >
                ← День назад
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{formatDateRu(date)}</span>
                <LevelTrainingDatePicker level={level} date={dateStr} />
              </div>
              <Link
                href={`/trainer/athlete-levels/${level}?date=${nextDate}`}
                className="rounded-lg px-3 py-1.5 text-sm text-brand-text/60 hover:bg-white/5"
              >
                Вперёд →
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="mb-3 font-heading text-lg font-bold">
                Задание на {formatDateRu(date)}
              </h2>
              <LevelTrainingForm
                key={dateStr}
                level={level}
                date={dateStr}
                initial={training ?? undefined}
              />
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardBody>
            <h2 className="mb-3 font-heading text-lg font-bold">История</h2>
            {dates.length === 0 ? (
              <EmptyState title="Заданий пока нет" />
            ) : (
              <ul className="flex flex-col divide-y divide-white/10">
                {dates.map((d) => {
                  const ds = toDateInputValue(d.date);
                  const active = ds === dateStr;
                  return (
                    <li key={ds}>
                      <Link
                        href={`/trainer/athlete-levels/${level}?date=${ds}`}
                        className={`block rounded-lg px-2 py-2 text-sm transition ${
                          active
                            ? "bg-brand-cyan/20 font-medium text-brand-cyan"
                            : "text-brand-text/70 hover:bg-white/5"
                        }`}
                      >
                        {formatDateRu(d.date)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <p className="mt-4">
        <Link href="/trainer/athlete-levels" className="text-sm text-brand-text/60 hover:text-brand-text">
          ← Ко всем уровням
        </Link>
      </p>
    </>
  );
}
