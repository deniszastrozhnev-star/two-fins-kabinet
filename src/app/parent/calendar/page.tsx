import Link from "next/link";
import { addMonths, format, parse } from "date-fns";
import { ru } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { buildMonthGrid, monthRange } from "@/lib/calendar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { WEEKDAYS } from "@/lib/labels";
import type { AttendanceStatus } from "@prisma/client";

const STATUS_CELL: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-500/25 text-emerald-200 border-emerald-500/40",
  ABSENT: "bg-red-500/25 text-red-200 border-red-500/40",
  WORKOFF: "bg-brand-cyan/25 text-brand-cyan border-brand-cyan/40",
  EXTRA: "bg-brand-violet/25 text-brand-violet border-brand-violet/40",
};

export default async function ParentCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const child = await requireParentChild();
  const { month } = await searchParams;

  const monthDate = month
    ? parse(month, "yyyy-MM", new Date())
    : new Date();
  const prevMonthKey = format(addMonths(monthDate, -1), "yyyy-MM");
  const nextMonthKey = format(addMonths(monthDate, 1), "yyyy-MM");

  const grid = buildMonthGrid(monthDate);
  const { start, end } = monthRange(monthDate);

  const records = await prisma.attendanceRecord.findMany({
    where: { childId: child.id, date: { gte: start, lte: end } },
    include: { group: true },
  });
  const byDate = new Map(
    records.map((r) => [format(r.date, "yyyy-MM-dd"), r]),
  );

  return (
    <>
      <PageHeader title="Календарь посещаемости" />

      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <Link
              href={`/parent/calendar?month=${prevMonthKey}`}
              className="rounded-lg px-3 py-1.5 text-sm text-brand-text/60 hover:bg-white/5"
            >
              ← Пред.
            </Link>
            <p className="font-heading text-lg font-bold capitalize">
              {format(monthDate, "LLLL yyyy", { locale: ru })}
            </p>
            <Link
              href={`/parent/calendar?month=${nextMonthKey}`}
              className="rounded-lg px-3 py-1.5 text-sm text-brand-text/60 hover:bg-white/5"
            >
              След. →
            </Link>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="pb-1 text-xs font-medium text-brand-text/50"
              >
                {d}
              </div>
            ))}
            {grid.map(({ date, inMonth }) => {
              const key = format(date, "yyyy-MM-dd");
              const record = byDate.get(key);
              return (
                <div
                  key={key}
                  className={`aspect-square rounded-lg border text-sm flex flex-col items-center justify-center ${
                    record
                      ? STATUS_CELL[record.status]
                      : "border-white/5 text-brand-text/30"
                  } ${!inMonth ? "opacity-30" : ""}`}
                  title={record ? record.group.name : undefined}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
              Пришёл
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/60" />
              Не пришёл
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-brand-cyan/60" />
              Отработка
            </span>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
