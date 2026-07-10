import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { toDateInputValue, parseDateInputValue } from "@/lib/dates";
import { saveAttendanceAction } from "@/lib/actions/attendance-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GroupDateFilter } from "@/components/trainer/GroupDateFilter";
import { AttendanceStatusPicker } from "@/components/trainer/AttendanceStatusPicker";
import { SaveButton } from "@/components/trainer/SaveButton";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string; date?: string }>;
}) {
  await requireTrainer();
  const params = await searchParams;

  const groups = await prisma.group.findMany({
    orderBy: [{ level: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  if (groups.length === 0) {
    return (
      <>
        <PageHeader
          title="Посещаемость"
          description="Отметьте, кто пришёл на занятие"
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

  const [children, records] = await Promise.all([
    prisma.child.findMany({
      where: { groupId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.attendanceRecord.findMany({
      where: { groupId, date },
      include: { child: true },
    }),
  ]);
  const statusByChildId = new Map(records.map((r) => [r.childId, r.status]));
  const homeChildIds = new Set(children.map((c) => c.id));
  // Дети из других групп, пришедшие на это занятие отработать — добавлены через /trainer/workoffs
  const workoffVisitors = records.filter(
    (r) => r.status === "WORKOFF" && !homeChildIds.has(r.childId),
  );

  return (
    <>
      <PageHeader
        title="Посещаемость"
        description="Выберите группу и дату, отметьте каждого ребёнка"
        action={
          <LinkButton
            href={`/trainer/workoffs?groupId=${groupId}&date=${dateStr}&back=attendance`}
            variant="secondary"
            size="sm"
          >
            + Отработка
          </LinkButton>
        }
      />

      <Card className="mb-6">
        <CardBody>
          <GroupDateFilter
            action="/trainer/attendance"
            groups={groups}
            groupId={groupId}
            date={dateStr}
          />
        </CardBody>
      </Card>

      {children.length === 0 ? (
        <EmptyState
          title="В этой группе пока нет детей"
          description="Добавьте детей в группу на экране «Дети»."
        />
      ) : (
        <form action={saveAttendanceAction}>
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="date" value={dateStr} />
          <Card>
            <CardBody className="flex flex-col divide-y divide-white/10 p-0">
              {children.map((child) => (
                <div
                  key={child.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
                >
                  <input type="hidden" name="childId" value={child.id} />
                  <span className="font-medium">
                    {child.lastName} {child.firstName}
                  </span>
                  <AttendanceStatusPicker
                    name={`status-${child.id}`}
                    defaultValue={statusByChildId.get(child.id) ?? "PRESENT"}
                  />
                </div>
              ))}
            </CardBody>
          </Card>
          <div className="mt-4 flex justify-end">
            <SaveButton>Сохранить посещаемость</SaveButton>
          </div>
        </form>
      )}

      {workoffVisitors.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-heading text-lg font-bold">
            Пришли на отработку
          </h2>
          <Card>
            <CardBody className="flex flex-col divide-y divide-white/10 p-0">
              {workoffVisitors.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
                >
                  <span className="font-medium">
                    {r.child.lastName} {r.child.firstName}
                  </span>
                  <Badge tone="cyan">Отработка</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
          <p className="mt-2 text-xs text-brand-text/50">
            Изменить список можно на{" "}
            <Link
              href={`/trainer/workoffs?groupId=${groupId}&date=${dateStr}&back=attendance`}
              className="text-brand-cyan hover:underline"
            >
              экране «Отработка»
            </Link>
            .
          </p>
        </div>
      )}
    </>
  );
}
