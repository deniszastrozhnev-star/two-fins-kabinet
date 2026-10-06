import { prisma } from "@/lib/prisma";
import { requireHeadTrainer } from "@/lib/auth";
import { LEVEL_LABELS } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { getFinanceSettings } from "@/lib/financeSettings";
import { computeSalaryReport } from "@/lib/salary";
import { MonthlyRentForm } from "@/components/trainer/MonthlyRentForm";
import { formatDateRu } from "@/lib/dates";
import {
  getCurrentReportPeriod,
  reportPeriodInstantRange,
  reportPeriodForDate,
  reportPeriodFromKey,
  shiftReportPeriodKey,
} from "@/lib/reportPeriod";
import Link from "next/link";

const REVENUE_GOAL = 300_000;

export default async function MetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireHeadTrainer();
  const { period: periodParam } = await searchParams;

  // Самый ранний период, за который вообще есть записи посещаемости — глубже
  // назад листать незачем; будущие периоды тоже недоступны.
  const earliestRecord = await prisma.attendanceRecord.aggregate({ _min: { date: true } });
  const currentPeriod = getCurrentReportPeriod();
  const earliestKey = earliestRecord._min.date
    ? reportPeriodForDate(earliestRecord._min.date).key
    : currentPeriod.key;
  const requested = reportPeriodFromKey(periodParam);
  const period =
    requested && requested.key >= earliestKey && requested.key <= currentPeriod.key
      ? requested
      : currentPeriod;
  const isCurrent = period.key === currentPeriod.key;
  const prevKey = period.key > earliestKey ? shiftReportPeriodKey(period.key, -1) : null;
  const nextKey = period.key < currentPeriod.key ? shiftReportPeriodKey(period.key, 1) : null;
  const periodHref = (key: string) =>
    key === currentPeriod.key ? "/trainer/metrics" : `/trainer/metrics?period=${key}`;

  const instantRange = reportPeriodInstantRange(period);
  const [groups, financeSettings, salaryRows, paymentsBySource, firstConfirmation] = await Promise.all([
    prisma.group.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }],
      include: { _count: { select: { children: true } } },
    }),
    getFinanceSettings(),
    computeSalaryReport(period.start, period.end),
    prisma.paymentConfirmation.groupBy({
      by: ["source"],
      where: { paidAt: instantRange },
      _sum: { amountRub: true },
      _count: { _all: true, amountRub: true },
    }),
    // Начало реального учёта — первая оплата, записанная в момент подтверждения;
    // дозаписанные задним числом (BACKFILL_TARIFF) носят историческую дату и
    // начало учёта не определяют.
    prisma.paymentConfirmation.aggregate({
      where: { source: { not: "BACKFILL_TARIFF" } },
      _min: { paidAt: true },
    }),
  ]);

  // Оборот — только сумма подтверждённых оплат периода (сумма пишется в момент
  // подтверждения, см. lib/payments.ts); никаких оценок по составу групп.
  // Дозаписанные задним числом (BACKFILL_TARIFF) суммы — тариф ребёнка, не
  // фактический платёж, поэтому показываются отдельной строкой.
  const trackingStart = firstConfirmation._min.paidAt;
  const sumOf = (rows: typeof paymentsBySource) => rows.reduce((s, r) => s + (r._sum.amountRub ?? 0), 0);
  const backfillRows = paymentsBySource.filter((r) => r.source === "BACKFILL_TARIFF");
  const totalRevenue = sumOf(paymentsBySource);
  const paymentsWithAmount = paymentsBySource.reduce((s, r) => s + r._count.amountRub, 0);
  const paymentsWithoutAmount = paymentsBySource.reduce((s, r) => s + r._count._all - r._count.amountRub, 0);
  const backfillCount = backfillRows.reduce((s, r) => s + r._count.amountRub, 0);
  const backfillSum = sumOf(backfillRows);
  const periodBeforeTracking = trackingStart == null || trackingStart.getTime() > instantRange.gte.getTime();

  const rows = groups.map((g) => ({
    id: g.id,
    name: g.name,
    level: g.level,
    childrenCount: g._count.children,
    capacity: g.capacity,
    pricePerMonth: g.pricePerMonth,
  }));

  const monthlyRentRub = financeSettings.monthlyRentRub;
  const trainerSalariesTotal = salaryRows.reduce((sum, r) => sum + r.total, 0);
  const netProfit = totalRevenue - monthlyRentRub - trainerSalariesTotal;
  const diff = REVENUE_GOAL - netProfit;

  return (
    <>
      <PageHeader
        title="Показатели"
        description="Заполняемость групп, оборот по подтверждённым оплатам и прибыль. Расчётный период начинается 25-го числа каждого месяца"
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        {prevKey ? (
          <Link
            href={periodHref(prevKey)}
            aria-label="Предыдущий период"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            ← Назад
          </Link>
        ) : (
          <span className="rounded-lg border border-white/5 px-3 py-1.5 text-sm text-brand-text/30">← Назад</span>
        )}
        <p className="font-heading text-lg font-bold">
          {period.label}
          {isCurrent && <span className="ml-2 text-sm font-normal text-brand-cyan">текущий</span>}
        </p>
        {nextKey ? (
          <Link
            href={periodHref(nextKey)}
            aria-label="Следующий период"
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Вперёд →
          </Link>
        ) : (
          <span className="rounded-lg border border-white/5 px-3 py-1.5 text-sm text-brand-text/30">Вперёд →</span>
        )}
      </div>

      {periodBeforeTracking && (
        <p className="mb-6 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Суммы оплат записываются с{" "}
          {trackingStart ? formatDateRu(trackingStart) : "первого подтверждения"}.
          Оплаты этого периода, подтверждённые раньше, в оборот не входят, пока
          их не дозаписали по тарифу, — поэтому оборот и прибыль ниже могут быть
          занижены. Зарплаты посчитаны точно по записям посещаемости. Аренда —
          текущая.
        </p>
      )}

      <Card className="mb-6 overflow-x-auto">
        <CardBody className="p-0">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-brand-text/60">
                <th className="px-4 py-3 font-medium sm:px-5">Группа</th>
                <th className="px-4 py-3 font-medium sm:px-5">Уровень</th>
                <th className="px-4 py-3 font-medium sm:px-5">Занятость</th>
                <th className="px-4 py-3 font-medium sm:px-5">Тариф</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium sm:px-5">{r.name}</td>
                  <td className="px-4 py-3 text-brand-text/70 sm:px-5">
                    {LEVEL_LABELS[r.level]}
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    {r.capacity != null
                      ? `${r.childrenCount} / ${r.capacity}`
                      : `${r.childrenCount} / —`}
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    {r.pricePerMonth != null
                      ? `${r.pricePerMonth.toLocaleString("ru-RU")}₽`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <h2 className="mb-3 font-heading text-lg font-bold">Оборот и чистая прибыль</h2>
      <Card className="mb-6">
        <CardBody className="flex flex-col divide-y divide-white/10 p-0">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
            <div>
              <p className="text-sm text-brand-text/70">Оборот (подтверждённые оплаты периода)</p>
              <p className="mt-1 text-xs text-brand-text/50">
                подтверждено {paymentsWithAmount} оплат на {totalRevenue.toLocaleString("ru-RU")}₽
              </p>
              {backfillCount > 0 && (
                <p className="mt-0.5 text-xs text-amber-200/80">
                  из них по тарифу, не фактическая сумма: {backfillCount} на {backfillSum.toLocaleString("ru-RU")}₽
                </p>
              )}
              {paymentsWithoutAmount > 0 && (
                <p className="mt-0.5 text-xs text-amber-200/80">
                  оплат без суммы: {paymentsWithoutAmount} (в оборот не вошли)
                </p>
              )}
            </div>
            <p className="font-heading text-xl font-bold">
              {totalRevenue.toLocaleString("ru-RU")}₽
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
            <div>
              <p className="text-sm text-brand-text/70">− Аренда (все бассейны)</p>
              <div className="mt-2">
                <MonthlyRentForm monthlyRentRub={monthlyRentRub} />
              </div>
            </div>
            <p className="font-heading text-xl font-bold text-red-300">
              −{monthlyRentRub.toLocaleString("ru-RU")}₽
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
            <p className="text-sm text-brand-text/70">− Зарплаты тренерам (за период с {period.startLabel})</p>
            <p className="font-heading text-xl font-bold text-red-300">
              −{trainerSalariesTotal.toLocaleString("ru-RU")}₽
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <p className="font-heading text-base font-bold">= Чистая прибыль</p>
            <p
              className={`font-heading text-2xl font-bold ${netProfit >= 0 ? "text-emerald-300" : "text-red-300"}`}
            >
              {netProfit.toLocaleString("ru-RU")}₽
            </p>
          </div>
        </CardBody>
      </Card>

      <h2 className="mb-3 font-heading text-lg font-bold">Цель по чистой прибыли</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/60">Цель (чистая прибыль)</p>
            <p className="mt-1 font-heading text-2xl font-bold">
              {REVENUE_GOAL.toLocaleString("ru-RU")}₽
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/60">
              {diff > 0 ? "Не хватает до цели" : "Сверх цели"}
            </p>
            <p
              className={`mt-1 font-heading text-2xl font-bold ${diff > 0 ? "text-amber-300" : "text-emerald-300"}`}
            >
              {Math.abs(diff).toLocaleString("ru-RU")}₽
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
