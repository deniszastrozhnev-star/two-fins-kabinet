import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { getWorkoffBalance } from "@/lib/workoffs";
import { getPaymentStatus } from "@/lib/payment";
import { getMedicalStatus } from "@/lib/medical";
import { formatDateRu } from "@/lib/dates";
import {
  updateChildAction,
  markPaidAction,
  deleteChildAction,
  markChildSickAction,
  reactivateChildAction,
} from "@/lib/actions/child-actions";
import { markLatestReceiptViewed } from "@/lib/actions/receipt-actions";
import {
  addCompetitionResultAction,
  deleteCompetitionResultAction,
} from "@/lib/actions/competition-actions";
import { getKnownTariffs } from "@/lib/tariffs";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, FieldGroup } from "@/components/ui/Field";
import { ChildForm } from "@/components/trainer/ChildForm";
import { ConfirmSubmitButton } from "@/components/trainer/ConfirmSubmitButton";
import { SaveButton } from "@/components/trainer/SaveButton";
import { ReceiptTariffPrompt } from "@/components/trainer/ReceiptTariffPrompt";

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTrainer();
  const { id } = await params;

  const child = await prisma.child.findUnique({ where: { id } });
  if (!child) notFound();

  await markLatestReceiptViewed(id);

  const [groups, balance, history, receipts, certificates, results, tariffs] =
    await Promise.all([
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
      prisma.paymentReceipt.findMany({
        where: { childId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.medicalCertificate.findMany({
        where: { childId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.competitionResult.findMany({
        where: { childId: id },
        orderBy: { date: "desc" },
      }),
      getKnownTariffs(),
    ]);

  const payment = getPaymentStatus(child.paidUntil);
  const medicalStatus = getMedicalStatus(certificates[0]?.validUntil ?? null);

  return (
    <>
      <PageHeader
        title={`${child.lastName} ${child.firstName}`}
        description="Карточка ученика"
        action={
          <div className="flex items-center gap-2">
            <Badge tone={child.status === "SICK" ? "violet" : "green"}>
              {child.status === "SICK" ? "Болеет" : "Активен"}
            </Badge>
            <form
              action={
                child.status === "SICK"
                  ? reactivateChildAction
                  : markChildSickAction
              }
            >
              <input type="hidden" name="id" value={child.id} />
              <Button type="submit" variant="secondary" size="sm">
                {child.status === "SICK" ? "Вернуть в активные" : "Отметить болеющим"}
              </Button>
            </form>
          </div>
        }
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
                birthDate: child.birthDate,
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

          {receipts.length > 0 && (
            <Card>
              <CardBody>
                <h2 className="mb-3 font-heading text-lg font-bold">
                  Чеки об оплате
                </h2>
                <ul className="flex flex-col divide-y divide-white/10">
                  {receipts.map((r) => {
                    const isImage = r.contentType?.startsWith("image/");
                    const tariffMatch =
                      r.recognizedAmount != null
                        ? tariffs.find((t) => t.amount === r.recognizedAmount)
                        : undefined;
                    return (
                      <li key={r.id} className="flex flex-col gap-2 py-2">
                        <div className="flex items-center gap-3">
                          <a
                            href={`/api/receipts/${r.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            {isImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={`/api/receipts/${r.id}`}
                                alt="Превью чека"
                                className="h-12 w-12 rounded-lg border border-white/10 object-cover"
                              />
                            ) : (
                              <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-brand-text/60">
                                PDF
                              </span>
                            )}
                          </a>
                          <span className="flex-1 text-sm text-brand-text/70">
                            {formatDateRu(r.createdAt)}
                          </span>
                          <a
                            href={`/api/receipts/${r.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand-cyan hover:underline"
                          >
                            {isImage ? "Открыть →" : "Открыть PDF →"}
                          </a>
                        </div>
                        {r.recognizedAmount != null &&
                          !r.resolvedAt &&
                          tariffMatch && (
                            <ReceiptTariffPrompt
                              receiptId={r.id}
                              childId={child.id}
                              recognizedAmount={r.recognizedAmount}
                              tariffLabel={tariffMatch.label}
                            />
                          )}
                      </li>
                    );
                  })}
                </ul>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold">
                  Медицинские документы
                </h2>
                <Badge tone={medicalStatus.tone}>{medicalStatus.label}</Badge>
              </div>
              {certificates.length === 0 ? (
                <p className="text-sm text-brand-text/50">
                  Справка ещё не загружена родителем.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-white/10">
                  {certificates.map((cert) => {
                    const isImage = cert.contentType?.startsWith("image/");
                    return (
                      <li key={cert.id} className="flex items-center gap-3 py-2">
                        <a
                          href={`/api/medical/${cert.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                        >
                          {isImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`/api/medical/${cert.id}`}
                              alt="Превью справки"
                              className="h-12 w-12 rounded-lg border border-white/10 object-cover"
                            />
                          ) : (
                            <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-brand-text/60">
                              PDF
                            </span>
                          )}
                        </a>
                        <span className="flex-1 text-sm text-brand-text/70">
                          Анализы до {formatDateRu(cert.validUntil)}
                        </span>
                        <a
                          href={`/api/medical/${cert.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-brand-cyan hover:underline"
                        >
                          {isImage ? "Открыть →" : "Открыть PDF →"}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="mb-3 font-heading text-lg font-bold">
                Результаты соревнований
              </h2>
              <form
                action={addCompetitionResultAction}
                className="mb-4 flex flex-col gap-3 border-b border-white/10 pb-4"
              >
                <input type="hidden" name="childId" value={child.id} />
                <FieldGroup label="Соревнование" htmlFor="competitionName">
                  <Input
                    id="competitionName"
                    name="competitionName"
                    placeholder="Городские соревнования"
                    required
                  />
                </FieldGroup>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldGroup label="Дата" htmlFor="resultDate">
                    <Input id="resultDate" name="date" type="date" required />
                  </FieldGroup>
                  <FieldGroup label="Результат/место" htmlFor="result">
                    <Input
                      id="result"
                      name="result"
                      placeholder="1 место, 50 м вольный стиль"
                      required
                    />
                  </FieldGroup>
                </div>
                <div className="flex justify-end">
                  <SaveButton>Добавить результат</SaveButton>
                </div>
              </form>
              {results.length === 0 ? (
                <p className="text-sm text-brand-text/50">
                  Результатов пока нет.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-white/10">
                  {results.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {r.competitionName}
                        </p>
                        <p className="text-xs text-brand-text/50">
                          {formatDateRu(r.date)} · {r.result}
                        </p>
                      </div>
                      <form action={deleteCompetitionResultAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="childId" value={child.id} />
                        <ConfirmSubmitButton confirmMessage="Удалить этот результат?">
                          Удалить
                        </ConfirmSubmitButton>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
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
