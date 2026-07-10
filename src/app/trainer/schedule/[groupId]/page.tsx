import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { LEVEL_LABELS } from "@/lib/labels";
import { updateGroupAction, deleteGroupAction } from "@/lib/actions/group-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { GroupForm } from "@/components/trainer/GroupForm";
import { MoveGroupSelect } from "@/components/trainer/MoveGroupSelect";
import { ConfirmSubmitButton } from "@/components/trainer/ConfirmSubmitButton";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  await requireTrainer();
  const { groupId } = await params;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) notFound();

  const [children, allGroups] = await Promise.all([
    prisma.child.findMany({
      where: { groupId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.group.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        title={group.name}
        description={`${LEVEL_LABELS[group.level]} · ${group.daysOfWeek.join(", ")} · ${group.time} · ${group.pool}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold">
                Дети в группе ({children.length})
              </h2>
            </div>
            {children.length === 0 ? (
              <EmptyState
                title="В этой группе пока нет детей"
                description="Добавьте детей на экране «Дети» или перенесите их сюда из другой группы."
              />
            ) : (
              <ul className="flex flex-col divide-y divide-white/10">
                {children.map((child) => (
                  <li
                    key={child.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <span className="font-medium">
                      {child.lastName} {child.firstName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-brand-text/50">
                        Перенести в:
                      </span>
                      <MoveGroupSelect
                        childId={child.id}
                        currentGroupId={groupId}
                        groups={allGroups}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardBody>
              <h2 className="mb-4 font-heading text-lg font-bold">
                Настройки группы
              </h2>
              <GroupForm
                action={updateGroupAction}
                initial={{
                  id: group.id,
                  name: group.name,
                  level: group.level,
                  daysOfWeek: group.daysOfWeek,
                  time: group.time,
                  pool: group.pool,
                }}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center justify-between">
              <div>
                <p className="font-medium">Удалить группу</p>
                <p className="text-xs text-brand-text/50">
                  Дети останутся без группы
                </p>
              </div>
              <form action={deleteGroupAction}>
                <input type="hidden" name="id" value={group.id} />
                <ConfirmSubmitButton
                  confirmMessage={`Удалить группу «${group.name}»? Дети останутся без группы.`}
                >
                  Удалить
                </ConfirmSubmitButton>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
