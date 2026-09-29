import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { toDateInputValue, parseDateInputValue } from "@/lib/dates";
import { getWorkoffBalances } from "@/lib/workoffs";
import { saveWorkoffAttendanceAction } from "@/lib/actions/workoff-actions";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GroupDateFilter } from "@/components/trainer/GroupDateFilter";
import { WorkoffChildList, type WorkoffChildItem } from "@/components/trainer/WorkoffChildList";
import { SaveButton } from "@/components/trainer/SaveButton";
import type { AttendanceStatus } from "@prisma/client";

export default async function WorkoffsPage({
  searchParams,
}: {
  searchParams: Promise<{
    groupId?: string;
    date?: string;
    back?: string;
    status?: string;
  }>;
}) {
  await requireTrainer();
  const params = await searchParams;
  const back = params.back ?? "";
  const status: AttendanceStatus = params.status === "EXTRA" ? "EXTRA" : "WORKOFF";
  const isExtra = status === "EXTRA";

  const groups = await prisma.group.findMany({
    orderBy: [{ level: "asc" }, { name: "asc" }],
    select: { id: true, name: true, level: true },
  });

  if (groups.length === 0) {
    return (
      <>
        <PageHeader
          title="Отработки"
          description="Отметьте, кто пришёл сегодня на отработку"
        />
        <EmptyState
          title="Пока нет ни одной группы"
          description="Сначала добавьте группу на экране «Расписание»."
        />
      </>
    );
  }

  const groupId = params.groupId ?? groups[0].id;
  const dateStr = params.date ?? toDateInputValue(new Date());
  const date = parseDateInputValue(dateStr);
  const selectedGroup = groups.find((g) => g.id === groupId);
  // У "Новичков" (малая чаша) отработки — только между собой, не со старшими группами
  const levelRestriction =
    !isExtra && selectedGroup?.level === "NOVICE" ? ("NOVICE" as const) : null;

  const [children, existingRecords, entitlements] = await Promise.all([
    prisma.child.findMany({
      where: levelRestriction ? { group: { level: levelRestriction } } : {},
      include: { group: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.attendanceRecord.findMany({
      where: { groupId, date, status },
      select: { childId: true },
    }),
    isExtra
      ? prisma.extraSessionEntitlement.findMany({
          where: { groupId },
          select: { childId: true, sessionsPerWeek: true },
        })
      : Promise.resolve([]),
  ]);

  const balances = await getWorkoffBalances(children.map((c) => c.id));
  const attendedIds = new Set(existingRecords.map((w) => w.childId));
  const entitlementByChildId = new Map(entitlements.map((e) => [e.childId, e.sessionsPerWeek]));

  return (
    <>
      <PageHeader
        title={isExtra ? "Допзанятие" : "Отработка"}
        description={
          levelRestriction
            ? "Занятие уровня «Новичок» (малая чаша) — в списке только дети из групп этого же уровня"
            : isExtra
              ? "Выберите занятие, куда пришли дети доп. занятием, и найдите их по имени — из любой группы школы"
              : "Выберите занятие, куда пришли дети на отработку, и найдите их по имени — из любой группы школы"
        }
        action={
          back === "attendance" ? (
            <Link
              href={`/trainer/attendance/${groupId}?date=${dateStr}`}
              className="text-sm text-brand-cyan hover:underline"
            >
              ← Назад к посещаемости
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4 flex gap-1.5">
        <Link
          href={`/trainer/workoffs?groupId=${groupId}&date=${dateStr}&status=WORKOFF`}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            !isExtra ? "bg-brand-cyan/20 text-brand-cyan" : "text-brand-text/60 hover:bg-white/5"
          }`}
        >
          Отработка
        </Link>
        <Link
          href={`/trainer/workoffs?groupId=${groupId}&date=${dateStr}&status=EXTRA`}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            isExtra ? "bg-brand-cyan/20 text-brand-cyan" : "text-brand-text/60 hover:bg-white/5"
          }`}
        >
          Допзанятие
        </Link>
      </div>

      <Card className="mb-4">
        <CardBody>
          <GroupDateFilter
            action="/trainer/workoffs"
            groups={groups}
            groupId={groupId}
            date={dateStr}
            extraHidden={{ back, status }}
          />
        </CardBody>
      </Card>

      {children.length === 0 ? (
        <EmptyState title="Никого нет в этой группе" description="Выберите другую группу." />
      ) : (
        <form action={saveWorkoffAttendanceAction}>
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="date" value={dateStr} />
          <input type="hidden" name="back" value={back} />
          <input type="hidden" name="status" value={status} />
          <WorkoffChildList
            items={children.map(
              (child): WorkoffChildItem => ({
                id: child.id,
                lastName: child.lastName,
                firstName: child.firstName,
                groupName: child.group?.name ?? null,
                balance: balances.get(child.id) ?? 0,
                entitlement: entitlementByChildId.get(child.id) ?? null,
                attended: attendedIds.has(child.id),
              }),
            )}
            isExtra={isExtra}
          />
          <div className="mt-4 flex justify-end">
            <SaveButton>{isExtra ? "Сохранить допзанятия" : "Сохранить отработки"}</SaveButton>
          </div>
        </form>
      )}
    </>
  );
}
