import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { toDateInputValue, parseDateInputValue } from "@/lib/dates";
import { saveAttendanceAction } from "@/lib/actions/attendance-actions";
import { saveCourseResultsAction } from "@/lib/actions/course-actions";
import { COURSE_DISTANCES } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { AttendanceDateFilter } from "@/components/trainer/AttendanceDateFilter";
import { AttendanceStatusPicker } from "@/components/trainer/AttendanceStatusPicker";
import { SaveButton } from "@/components/trainer/SaveButton";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/labels";

export default async function AttendanceGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const trainer = await requireTrainer();
  const { groupId } = await params;
  const searchParamsResolved = await searchParams;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, name: true, splitByAssignedTrainer: true },
  });
  if (!group) notFound();

  const dateStr = searchParamsResolved.date ?? toDateInputValue(new Date());
  const date = parseDateInputValue(dateStr);

  const [children, records] = await Promise.all([
    prisma.child.findMany({
      where: { groupId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, lastName: true, firstName: true, assignedTrainerId: true },
    }),
    prisma.attendanceRecord.findMany({
      where: { groupId, date },
      include: { child: true },
    }),
  ]);
  const statusByChildId = new Map(records.map((r) => [r.childId, r.status]));
  const homeChildIds = new Set(children.map((c) => c.id));
  // Дети из других групп, пришедшие на это занятие отработать/доп. занятием — добавлены через /trainer/workoffs
  const workoffVisitors = records.filter(
    (r) => r.status === "WORKOFF" && !homeChildIds.has(r.childId),
  );
  const extraVisitors = records.filter(
    (r) => r.status === "EXTRA" && !homeChildIds.has(r.childId),
  );

  // Присутствовавшие в этот день — своя группа (отмеченные "Пришёл") + пришедшие
  // на отработку/допзанятие из других групп — для внесения курсовки.
  const homePresent = children.filter((c) => statusByChildId.get(c.id) === "PRESENT");
  const courseChildren = [
    ...homePresent,
    ...workoffVisitors.map((r) => r.child),
    ...extraVisitors.map((r) => r.child),
  ];

  return (
    <>
      <Link
        href="/trainer/attendance"
        className="mb-2 inline-block text-sm text-brand-cyan hover:underline"
      >
        ← Все группы
      </Link>
      <PageHeader
        title={group.name}
        description="Отметьте каждого ребёнка"
        action={
          <div className="flex gap-2">
            <LinkButton
              href={`/trainer/workoffs?groupId=${groupId}&date=${dateStr}&back=attendance&status=WORKOFF`}
              variant="secondary"
              size="sm"
            >
              + Отработка
            </LinkButton>
            <LinkButton
              href={`/trainer/workoffs?groupId=${groupId}&date=${dateStr}&back=attendance&status=EXTRA`}
              variant="secondary"
              size="sm"
            >
              + Допзанятие
            </LinkButton>
          </div>
        }
      />

      <Card className="mb-6">
        <CardBody>
          <AttendanceDateFilter groupId={groupId} date={dateStr} />
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardBody>
          <h2 className="mb-3 font-heading text-lg font-bold">Курсовка</h2>
          {courseChildren.length === 0 ? (
            <p className="text-sm text-brand-text/50">
              Сначала отметьте посещаемость — курсовку можно внести только пришедшим сегодня.
            </p>
          ) : (
            <form action={saveCourseResultsAction}>
              <input type="hidden" name="groupId" value={groupId} />
              <input type="hidden" name="date" value={dateStr} />
              <div className="mb-4 max-w-xs">
                <Select name="distance" defaultValue={COURSE_DISTANCES[1]} required>
                  {COURSE_DISTANCES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col divide-y divide-white/10">
                {courseChildren.map((child) => (
                  <div
                    key={child.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-2"
                  >
                    <input type="hidden" name="childIds" value={child.id} />
                    <span className="text-sm font-medium">
                      {child.lastName} {child.firstName}
                    </span>
                    <input
                      type="text"
                      name={`time-${child.id}`}
                      placeholder="32.45"
                      className="w-28 rounded-lg border border-white/15 bg-brand-base/60 px-3 py-1.5 text-sm outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <SaveButton>Сохранить курсовку</SaveButton>
              </div>
            </form>
          )}
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
              {children.map((child) => {
                // В совместной группе каждый тренер отмечает только "своих"
                // привязанных детей (+ ещё не привязанных) — остальных видит,
                // но отметить не может; реально отмечает и получает за них
                // зарплату тот тренер, к которому ребёнок привязан.
                const isLockedToOtherTrainer =
                  group.splitByAssignedTrainer &&
                  child.assignedTrainerId != null &&
                  child.assignedTrainerId !== trainer.id;

                return (
                  <div
                    key={child.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
                  >
                    {!isLockedToOtherTrainer && (
                      <input type="hidden" name="childId" value={child.id} />
                    )}
                    <span className="font-medium">
                      {child.lastName} {child.firstName}
                    </span>
                    {isLockedToOtherTrainer ? (
                      <Badge tone="neutral">
                        {statusByChildId.has(child.id)
                          ? ATTENDANCE_STATUS_LABELS[statusByChildId.get(child.id)!]
                          : "Отмечает другой тренер"}
                      </Badge>
                    ) : (
                      <AttendanceStatusPicker
                        name={`status-${child.id}`}
                        defaultValue={statusByChildId.get(child.id)}
                      />
                    )}
                  </div>
                );
              })}
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
              href={`/trainer/workoffs?groupId=${groupId}&date=${dateStr}&back=attendance&status=WORKOFF`}
              className="text-brand-cyan hover:underline"
            >
              экране «Отработка»
            </Link>
            .
          </p>
        </div>
      )}

      {extraVisitors.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-heading text-lg font-bold">
            Пришли на допзанятие
          </h2>
          <Card>
            <CardBody className="flex flex-col divide-y divide-white/10 p-0">
              {extraVisitors.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
                >
                  <span className="font-medium">
                    {r.child.lastName} {r.child.firstName}
                  </span>
                  <Badge tone="violet">Допзанятие</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
          <p className="mt-2 text-xs text-brand-text/50">
            Изменить список можно на{" "}
            <Link
              href={`/trainer/workoffs?groupId=${groupId}&date=${dateStr}&back=attendance&status=EXTRA`}
              className="text-brand-cyan hover:underline"
            >
              экране «Допзанятие»
            </Link>
            .
          </p>
        </div>
      )}
    </>
  );
}
