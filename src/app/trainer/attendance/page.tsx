import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { toDateInputValue, parseDateInputValue } from "@/lib/dates";
import { saveAttendanceAction } from "@/lib/actions/attendance-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
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
    }),
  ]);
  const statusByChildId = new Map(records.map((r) => [r.childId, r.status]));

  return (
    <>
      <PageHeader
        title="Посещаемость"
        description="Выберите группу и дату, отметьте каждого ребёнка"
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
    </>
  );
}
