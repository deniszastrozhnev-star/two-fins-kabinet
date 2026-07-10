import { requireHeadTrainer } from "@/lib/auth";
import { toDateInputValue, parseDateInputValue } from "@/lib/dates";
import { computeSalaryReport, GROUP_LESSON_RATE, PERSONAL_TRAINING_RATE } from "@/lib/salary";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { startOfMonth } from "date-fns";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireHeadTrainer();
  const params = await searchParams;

  const fromStr = params.from ?? toDateInputValue(startOfMonth(new Date()));
  const toStr = params.to ?? toDateInputValue(new Date());
  const dateFrom = parseDateInputValue(fromStr);
  const dateTo = parseDateInputValue(toStr);

  const rows = await computeSalaryReport(dateFrom, dateTo);
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <>
      <PageHeader
        title="Отчёт"
        description={`Групповые занятия — ${GROUP_LESSON_RATE}₽/ребёнок, персональные тренировки — ${PERSONAL_TRAINING_RATE}₽`}
      />

      <Card className="mb-6 max-w-lg">
        <CardBody>
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div>
              <Label htmlFor="from">С даты</Label>
              <Input id="from" name="from" type="date" defaultValue={fromStr} />
            </div>
            <div>
              <Label htmlFor="to">По дату</Label>
              <Input id="to" name="to" type="date" defaultValue={toStr} />
            </div>
            <Button type="submit" size="md">
              Показать
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card className="overflow-x-auto">
        <CardBody className="p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-brand-text/60">
                <th className="px-4 py-3 font-medium sm:px-5">Тренер</th>
                <th className="px-4 py-3 font-medium sm:px-5">Групповых</th>
                <th className="px-4 py-3 font-medium sm:px-5">За группы</th>
                <th className="px-4 py-3 font-medium sm:px-5">Персональных</th>
                <th className="px-4 py-3 font-medium sm:px-5">За персональные</th>
                <th className="px-4 py-3 font-medium sm:px-5">Итого</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.trainerId} className="border-b border-white/5">
                  <td className="px-4 py-3 font-medium sm:px-5">{r.username}</td>
                  <td className="px-4 py-3 sm:px-5">{r.groupCount}</td>
                  <td className="px-4 py-3 sm:px-5">{r.groupTotal.toLocaleString("ru-RU")}₽</td>
                  <td className="px-4 py-3 sm:px-5">{r.personalCount}</td>
                  <td className="px-4 py-3 sm:px-5">{r.personalTotal.toLocaleString("ru-RU")}₽</td>
                  <td className="px-4 py-3 font-semibold text-brand-cyan sm:px-5">
                    {r.total.toLocaleString("ru-RU")}₽
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="px-4 py-3 font-heading font-bold sm:px-5" colSpan={5}>
                  Всего
                </td>
                <td className="px-4 py-3 font-heading font-bold text-brand-cyan sm:px-5">
                  {grandTotal.toLocaleString("ru-RU")}₽
                </td>
              </tr>
            </tfoot>
          </table>
        </CardBody>
      </Card>
    </>
  );
}
