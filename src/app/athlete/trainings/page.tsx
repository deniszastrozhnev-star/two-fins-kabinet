import Link from "next/link";
import { addWeeks, subWeeks, addMonths, subMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireAthlete } from "@/lib/auth";
import {
  logLevelTrainingAction,
  deleteLevelTrainingLogAction,
} from "@/lib/actions/athlete-level-actions";
import { getTrainingLogHistory } from "@/lib/trainingLog";
import { getLevelTrainingDates, getLevelTrainingForDate } from "@/lib/levelTraining";
import { AthletePeriod, getPeriodRange } from "@/lib/athletes";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, Input } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";
import { ConfirmSubmitButton } from "@/components/trainer/ConfirmSubmitButton";
import { toDateInputValue, parseDateInputValue, formatDateRu, formatDateShortRu } from "@/lib/dates";
import { LEVEL_LABELS, TRAINING_LOG_TYPE_LABELS } from "@/lib/labels";

function MarkDoneForm({ type, label }: { type: "OFP" | "FLEXIBILITY"; label: string }) {
  return (
    <form action={logLevelTrainingAction} className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4">
      <input type="hidden" name="type" value={type} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="done" required className="h-4 w-4" />
        Выполнено
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldGroup label="Время выполнения (мин)" htmlFor={`duration-${type}`}>
          <Input
            id={`duration-${type}`}
            name="durationMinutes"
            type="number"
            min={1}
            inputMode="numeric"
            required
          />
        </FieldGroup>
        <FieldGroup label="Дата" htmlFor={`date-${type}`}>
          <Input
            id={`date-${type}`}
            name="date"
            type="date"
            defaultValue={toDateInputValue(new Date())}
            required
          />
        </FieldGroup>
      </div>
      <div className="flex justify-end">
        <SaveButton>Отметить {label.toLowerCase()}</SaveButton>
      </div>
    </form>
  );
}

export default async function AthleteTrainingsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; ref?: string; taskDate?: string }>;
}) {
  const athlete = await requireAthlete();
  const params = await searchParams;
  const period: AthletePeriod = params.period === "month" ? "month" : "week";
  const reference = params.ref ? parseDateInputValue(params.ref) : new Date();

  const athleteExtra = await prisma.athlete.findUnique({
    where: { id: athlete.id },
    select: { level: true },
  });
  const level = athleteExtra?.level ?? null;

  const taskDates = level ? await getLevelTrainingDates(level) : [];
  const selectedTaskDateStr = params.taskDate ?? toDateInputValue(taskDates[0]?.date ?? new Date());
  const training =
    level && taskDates.length > 0
      ? await getLevelTrainingForDate(level, parseDateInputValue(selectedTaskDateStr))
      : null;

  const history = await getTrainingLogHistory(athlete.id, period, reference);

  const prevRef = toDateInputValue(
    period === "week" ? subWeeks(reference, 1) : subMonths(reference, 1),
  );
  const nextRef = toDateInputValue(
    period === "week" ? addWeeks(reference, 1) : addMonths(reference, 1),
  );
  const { start: periodStart, end: periodEnd } = getPeriodRange(period, reference);
  const periodLabel =
    period === "week"
      ? `${formatDateShortRu(periodStart)} – ${formatDateRu(periodEnd)}`
      : formatDateRu(reference, "LLLL yyyy");

  return (
    <>
      <PageHeader
        title="Тренировки"
        description="Ориентир от тренера по твоему уровню — ОФП и гибкость, журнал по дням"
      />

      {!level ? (
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/50">
              Уровень пока не назначен, обратитесь к тренеру
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-brand-text/60">
            Твой уровень: <span className="font-semibold text-brand-cyan">{LEVEL_LABELS[level]}</span>
          </p>

          <Card>
            <CardBody>
              <h2 className="mb-3 font-heading text-lg font-bold">Задания по дням</h2>
              {taskDates.length === 0 ? (
                <EmptyState
                  title="Заданий пока нет"
                  description="Тренер ещё не добавил ни одного задания для твоего уровня"
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {taskDates.map((d) => {
                    const ds = toDateInputValue(d.date);
                    const active = ds === selectedTaskDateStr;
                    return (
                      <Link
                        key={ds}
                        href={`/athlete/trainings?period=${period}&ref=${toDateInputValue(reference)}&taskDate=${ds}`}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                          active
                            ? "bg-brand-cyan/20 text-brand-cyan"
                            : "text-brand-text/60 hover:bg-white/5"
                        }`}
                      >
                        {formatDateRu(d.date, "d MMMM")}
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {training && (
            <>
              <Card>
                <CardBody>
                  <h2 className="mb-2 font-heading text-lg font-bold">
                    ОФП · {formatDateRu(training.date)}
                  </h2>
                  <p className="whitespace-pre-wrap text-sm text-brand-text/80">{training.ofpTask}</p>
                  <MarkDoneForm type="OFP" label="ОФП" />
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <h2 className="mb-2 font-heading text-lg font-bold">
                    Гибкость · {formatDateRu(training.date)}
                  </h2>
                  <p className="whitespace-pre-wrap text-sm text-brand-text/80">
                    {training.flexibilityTask}
                  </p>
                  <MarkDoneForm type="FLEXIBILITY" label="Гибкость" />
                </CardBody>
              </Card>
            </>
          )}

          <Card>
            <CardBody>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-lg font-bold">История отметок</h2>
                <div className="flex gap-1.5">
                  <Link
                    href={`/athlete/trainings?period=week&ref=${toDateInputValue(new Date())}&taskDate=${selectedTaskDateStr}`}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      period === "week"
                        ? "bg-brand-cyan/20 text-brand-cyan"
                        : "text-brand-text/60 hover:bg-white/5"
                    }`}
                  >
                    Неделя
                  </Link>
                  <Link
                    href={`/athlete/trainings?period=month&ref=${toDateInputValue(new Date())}&taskDate=${selectedTaskDateStr}`}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      period === "month"
                        ? "bg-brand-cyan/20 text-brand-cyan"
                        : "text-brand-text/60 hover:bg-white/5"
                    }`}
                  >
                    Месяц
                  </Link>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between gap-3">
                <Link
                  href={`/athlete/trainings?period=${period}&ref=${prevRef}&taskDate=${selectedTaskDateStr}`}
                  className="rounded-lg px-3 py-1.5 text-sm text-brand-text/60 hover:bg-white/5"
                >
                  ← Раньше
                </Link>
                <span className="text-sm font-medium capitalize">{periodLabel}</span>
                <Link
                  href={`/athlete/trainings?period=${period}&ref=${nextRef}&taskDate=${selectedTaskDateStr}`}
                  className="rounded-lg px-3 py-1.5 text-sm text-brand-text/60 hover:bg-white/5"
                >
                  Позже →
                </Link>
              </div>

              {history.length === 0 ? (
                <EmptyState title="За этот период отметок нет" />
              ) : (
                <ul className="flex flex-col divide-y divide-white/10">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{TRAINING_LOG_TYPE_LABELS[h.type]}</p>
                        <p className="mt-1 text-xs text-brand-text/50">
                          {formatDateRu(h.date)} · {h.durationMinutes} мин · {LEVEL_LABELS[h.level]}
                        </p>
                      </div>
                      <form action={deleteLevelTrainingLogAction}>
                        <input type="hidden" name="id" value={h.id} />
                        <ConfirmSubmitButton confirmMessage="Удалить эту отметку?">
                          Удалить
                        </ConfirmSubmitButton>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}
