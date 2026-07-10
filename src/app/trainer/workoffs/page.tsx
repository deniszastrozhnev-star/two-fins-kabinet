import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { toDateInputValue, parseDateInputValue } from "@/lib/dates";
import { getWorkoffBalances } from "@/lib/workoffs";
import { saveWorkoffAttendanceAction } from "@/lib/actions/workoff-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GroupDateFilter } from "@/components/trainer/GroupDateFilter";
import { SearchBox } from "@/components/trainer/SearchBox";
import { AttendedToggle } from "@/components/trainer/AttendedToggle";
import { SaveButton } from "@/components/trainer/SaveButton";

export default async function WorkoffsPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string; date?: string; q?: string }>;
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
  const q = params.q ?? "";

  const [children, existingWorkoffs] = await Promise.all([
    prisma.child.findMany({
      where: q
        ? {
            OR: [
              { lastName: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: { group: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.attendanceRecord.findMany({
      where: { groupId, date, status: "WORKOFF" },
      select: { childId: true },
    }),
  ]);

  const balances = await getWorkoffBalances(children.map((c) => c.id));
  const attendedIds = new Set(existingWorkoffs.map((w) => w.childId));

  return (
    <>
      <PageHeader
        title="Отработки"
        description="Выберите занятие, куда пришли дети на отработку, и найдите их по имени — из любой группы школы"
      />

      <Card className="mb-4">
        <CardBody>
          <GroupDateFilter
            action="/trainer/workoffs"
            groups={groups}
            groupId={groupId}
            date={dateStr}
            extraHidden={{ q }}
          />
        </CardBody>
      </Card>

      <div className="mb-5 max-w-sm">
        <SearchBox
          action="/trainer/workoffs"
          defaultValue={q}
          placeholder="Поиск ребёнка по имени…"
          extraHidden={{ groupId, date: dateStr }}
        />
      </div>

      {children.length === 0 ? (
        <EmptyState title="Никого не нашлось" description="Попробуйте изменить запрос." />
      ) : (
        <form action={saveWorkoffAttendanceAction}>
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="date" value={dateStr} />
          <Card>
            <CardBody className="flex flex-col divide-y divide-white/10 p-0">
              {children.map((child) => {
                const balance = balances.get(child.id) ?? 0;
                return (
                  <div
                    key={child.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
                  >
                    <input type="hidden" name="childId" value={child.id} />
                    <div>
                      <p className="font-medium">
                        {child.lastName} {child.firstName}
                      </p>
                      <p className="text-xs text-brand-text/50">
                        {child.group?.name ?? "Без группы"}
                        {balance > 0 && (
                          <>
                            {" · "}
                            <Badge tone="amber" className="align-middle">
                              {balance} отраб.
                            </Badge>
                          </>
                        )}
                      </p>
                    </div>
                    <AttendedToggle
                      childId={child.id}
                      defaultChecked={attendedIds.has(child.id)}
                    />
                  </div>
                );
              })}
            </CardBody>
          </Card>
          <div className="mt-4 flex justify-end">
            <SaveButton>Сохранить отработки</SaveButton>
          </div>
        </form>
      )}
    </>
  );
}
