import { requireParentChild } from "@/lib/auth";
import { getWorkoffBalance } from "@/lib/workoffs";
import { getPaymentStatus } from "@/lib/payment";
import { formatDateRu } from "@/lib/dates";
import { LEVEL_LABELS } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ReceiptUploadForm } from "@/components/parent/ReceiptUploadForm";

const SBP_LINK =
  "https://qr.nspk.ru/AS1A00334PI5FGEA93GRK6JQO8NGMG81?type=01&bank=100000000284&crc=B5A0%3E";

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

        <Card className="sm:col-span-2">
          <CardBody>
            <p className="text-sm text-brand-text/60">Оплата занятий</p>
            <div className="mt-3 flex flex-wrap items-start gap-6">
              <div className="flex flex-col gap-3">
                <a
                  href={SBP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-cyan px-4 py-2.5 text-sm font-semibold text-brand-base transition hover:brightness-110"
                >
                  Оплатить через СБП
                </a>
                <div className="max-w-sm">
                  <ReceiptUploadForm />
                </div>
              </div>
              <div className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/sbp-qr.png"
                  alt="QR-код для оплаты через СБП"
                  className="h-32 w-32 rounded-lg bg-white p-1"
                />
                <p className="mt-1.5 text-xs text-brand-text/50">
                  или отсканируйте QR-код
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
