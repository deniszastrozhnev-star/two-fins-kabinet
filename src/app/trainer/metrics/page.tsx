import { prisma } from "@/lib/prisma";
import { requireHeadTrainer } from "@/lib/auth";
import { LEVEL_LABELS } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { getFinanceSettings } from "@/lib/financeSettings";
import { computeSalaryReport } from "@/lib/salary";
import { MonthlyRentForm } from "@/components/trainer/MonthlyRentForm";
import { startOfMonth } from "date-fns";

const REVENUE_GOAL = 300_000;

export default async function MetricsPage() {
  await requireHeadTrainer();

  const [groups, financeSettings, salaryRows] = await Promise.all([
    prisma.group.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }],
      include: { _count: { select: { children: true } } },
    }),
    getFinanceSettings(),
    computeSalaryReport(startOfMonth(new Date()), new Date()),
  ]);

  const rows = groups.map((g) => ({
    id: g.id,
    name: g.name,
    level: g.level,
    childrenCount: g._count.children,
    capacity: g.capacity,
    pricePerMonth: g.pricePerMonth,
    revenue:
      g.pricePerMonth != null ? g._count.children * g.pricePerMonth : null,
  }));

  const totalRevenue = rows.reduce((sum, r) => sum + (r.revenue ?? 0), 0);
  const diff = REVENUE_GOAL - totalRevenue;

  const monthlyRentRub = financeSettings.monthlyRentRub;
  const trainerSalariesTotal = salaryRows.reduce((sum, r) => sum + r.total, 0);
  const netProfit = totalRevenue - monthlyRentRub - trainerSalariesTotal;

  return (
    <>
      <PageHeader
        title="Показатели"
        description="Заполняемость и оценочная выручка по группам"
      />

      <Card className="mb-6 overflow-x-auto">
        <CardBody className="p-0">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-brand-text/60">
                <th className="px-4 py-3 font-medium sm:px-5">Группа</th>
                <th className="px-4 py-3 font-medium sm:px-5">Уровень</th>
                <th className="px-4 py-3 font-medium sm:px-5">Занятость</th>
                <th className="px-4 py-3 font-medium sm:px-5">Тариф</th>
                <th className="px-4 py-3 font-medium sm:px-5">Выручка</th>
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
                  <td className="px-4 py-3 font-semibold text-brand-cyan sm:px-5">
                    {r.revenue != null
                      ? `${r.revenue.toLocaleString("ru-RU")}₽`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="px-4 py-3 font-heading font-bold sm:px-5" colSpan={4}>
                  Итого
                </td>
                <td className="px-4 py-3 font-heading font-bold text-brand-cyan sm:px-5">
                  {totalRevenue.toLocaleString("ru-RU")}₽
                </td>
              </tr>
            </tfoot>
          </table>
        </CardBody>
      </Card>

      <h2 className="mb-3 font-heading text-lg font-bold">Оборот и чистая прибыль</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/60">Оборот (оценка)</p>
            <p className="mt-1 font-heading text-2xl font-bold">
              {totalRevenue.toLocaleString("ru-RU")}₽
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/60">Аренда (все бассейны)</p>
            <p className="mt-1 mb-3 font-heading text-2xl font-bold">
              {monthlyRentRub.toLocaleString("ru-RU")}₽
            </p>
            <MonthlyRentForm monthlyRentRub={monthlyRentRub} />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/60">Зарплаты тренерам (с начала месяца)</p>
            <p className="mt-1 font-heading text-2xl font-bold">
              {trainerSalariesTotal.toLocaleString("ru-RU")}₽
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/60">Чистая прибыль</p>
            <p
              className={`mt-1 font-heading text-2xl font-bold ${netProfit >= 0 ? "text-emerald-300" : "text-red-300"}`}
            >
              {netProfit.toLocaleString("ru-RU")}₽
            </p>
          </CardBody>
        </Card>
      </div>

      <h2 className="mb-3 font-heading text-lg font-bold">Цель по обороту</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/60">Цель</p>
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
