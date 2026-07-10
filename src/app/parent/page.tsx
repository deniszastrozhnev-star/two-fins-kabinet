import { requireParentChild } from "@/lib/auth";
import { getWorkoffBalance } from "@/lib/workoffs";
import { getPaymentStatus } from "@/lib/payment";
import { formatDateRu } from "@/lib/dates";
import { LEVEL_LABELS } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function ParentOverviewPage() {
  const child = await requireParentChild();
  const [balance, payment] = await Promise.all([
    getWorkoffBalance(child.id),
    Promise.resolve(getPaymentStatus(child.paidUntil)),
  ]);

  return (
    <>
      <PageHeader
        title="Обзор"
        description={
          child.group
            ? `${child.group.name} · ${LEVEL_LABELS[child.group.level]}`
            : "Группа пока не назначена"
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/60">Оплата</p>
            <p className="mt-2 font-heading text-2xl font-bold">
              {child.paidUntil
                ? `до ${formatDateRu(child.paidUntil)}`
                : "не отмечена"}
            </p>
            <Badge tone={payment.tone} className="mt-3">
              {payment.label}
            </Badge>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-brand-text/60">Доступные отработки</p>
            <p className="mt-2 font-heading text-3xl font-bold text-brand-cyan">
              {balance > 0 ? balance : 0}
            </p>
            <p className="mt-3 text-xs text-brand-text/50">
              {balance > 0
                ? "Посмотрите, куда прийти, на вкладке «Отработки»"
                : "Пропущенных занятий, требующих отработки, нет"}
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
