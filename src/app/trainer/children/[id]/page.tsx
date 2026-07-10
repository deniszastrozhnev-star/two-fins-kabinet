import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { getWorkoffBalance } from "@/lib/workoffs";
import { getPaymentStatus } from "@/lib/payment";
import { formatDateRu } from "@/lib/dates";
import {
  updateChildAction,
  markPaidAction,
  deleteChildAction,
} from "@/lib/actions/child-actions";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChildForm } from "@/components/trainer/ChildForm";
import { ConfirmSubmitButton } from "@/components/trainer/ConfirmSubmitButton";

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTrainer();
  const { id } = await params;

  const child = await prisma.child.findUnique({ where: { id } });
  if (!child) notFound();

  const [groups, balance, history] = await Promise.all([
    prisma.group.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    getWorkoffBalance(id),
    prisma.attendanceRecord.findMany({
      where: { childId: id },
      orderBy: { date: "desc" },
      take: 20,
      include: { group: true },
    }),
  ]);

  const payment = getPaymentStatus(child.paidUntil);

  return (
    <>
      <PageHeader
        title={`${child.lastName} ${child.firstName}`}
        description="Карточка ученика"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="mb-4 font-heading text-lg font-bold">
              Данные ребёнка
            </h2>
            <ChildForm
              action={updateChildAction}
              groups={groups}
              initial={{
                id: child.id,
                lastName: child.lastName,
                firstName: child.firstName,
                groupId: child.groupId,
                parentPhone: child.parentPhone,
                paidUntil: child.paidUntil,
              }}
            />
          </CardBody>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardBody>
              <h2 className="mb-4 font-heading text-lg font-bold">
                Оплата и отработки
              </h2>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-brand-text/60">
                    {child.paidUntil
                      ? `Оплачено до ${formatDateRu(child.paidUntil)}`
                      : "Оплата не отмечена"}
                  </p>
                  <Badge tone={payment.tone} className="mt-1.5">
                    {payment.label}
                  </Badge>
                </div>
                <form action={markPaidAction}>
                  <input type="hidden" name="id" value={child.id} />
                  <Button type="submit">Оплачено</Button>
                </form>
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-sm text-brand-text/60">Остаток отработок</p>
                <p className="mt-1 font-heading text-2xl font-bold text-brand-cyan">
                  {balance > 0 ? balance : 0}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="mb-3 font-heading text-lg font-bold">
                История посещений
              </h2>
              {history.length === 0 ? (
                <p className="text-sm text-brand-text/50">
                  Пока нет отметок посещаемости.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-white/10">
                  {history.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span className="text-brand-text/70">
                        {formatDateRu(r.date)} · {r.group.name}
                      </span>
                      <Badge
                        tone={
                          r.status === "PRESENT"
                            ? "green"
                            : r.status === "ABSENT"
                              ? "red"
                              : "cyan"
                        }
                      >
                        {ATTENDANCE_STATUS_LABELS[r.status]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center justify-between">
              <div>
                <p className="font-medium">Удалить ребёнка</p>
                <p className="text-xs text-brand-text/50">
                  Вместе с ребёнком удалится вся история посещений
                </p>
              </div>
              <form action={deleteChildAction}>
                <input type="hidden" name="id" value={child.id} />
                <ConfirmSubmitButton confirmMessage={`Удалить ${child.lastName} ${child.firstName}? Это действие нельзя отменить.`}>
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
