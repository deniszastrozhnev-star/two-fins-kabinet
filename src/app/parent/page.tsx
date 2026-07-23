import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { getWorkoffBalance } from "@/lib/workoffs";
import { getPaymentStatus } from "@/lib/payment";
import { getMedicalStatus } from "@/lib/medical";
import { getActiveStoriesFeed } from "@/lib/stories";
import { COURSE_RESULT_NAME } from "@/lib/courseResults";
import { formatDateRu } from "@/lib/dates";
import { LEVEL_LABELS } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ReceiptUploadForm } from "@/components/parent/ReceiptUploadForm";
import { MedicalCertificateUpload } from "@/components/parent/MedicalCertificateUpload";
import { StoryRail } from "@/components/shared/StoryRail";

const SBP_LINK =
  "https://qr.nspk.ru/AS1A00334PI5FGEA93GRK6JQO8NGMG81?type=01&bank=100000000284&crc=B5A0%3E";

export default async function ParentOverviewPage() {
  const child = await requireParentChild();
  const [balance, payment, latestCertificate, results, storiesFeed] = await Promise.all([
    getWorkoffBalance(child.id),
    Promise.resolve(getPaymentStatus(child.paidUntil)),
    prisma.medicalCertificate.findFirst({
      where: { childId: child.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.competitionResult.findMany({
      where: { childId: child.id, competitionName: { not: COURSE_RESULT_NAME } },
      orderBy: { date: "desc" },
    }),
    getActiveStoriesFeed({ role: "parent", id: child.id }),
  ]);
  const medicalStatus = getMedicalStatus(latestCertificate?.validUntil ?? null);

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

      <Card className="mb-6">
        <CardBody>
          <h2 className="mb-3 font-heading text-lg font-bold">Истории</h2>
          <StoryRail
            feed={storiesFeed}
            ownName={`Родители ${child.lastName} ${child.firstName}`}
            ownAvatarUrl={null}
          />
        </CardBody>
      </Card>

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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-violet px-4 py-2.5 text-sm font-semibold text-brand-text transition hover:brightness-110"
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

        <Card className="sm:col-span-2">
          <CardBody>
            <p className="text-sm text-brand-text/60">Медицинские документы</p>
            <div className="mt-2">
              {latestCertificate ? (
                <p className="text-sm text-brand-text/70">
                  Анализы действительны до{" "}
                  {formatDateRu(latestCertificate.validUntil)}
                </p>
              ) : (
                <p className="text-sm text-brand-text/50">
                  Справка ещё не загружена
                </p>
              )}
              <Badge tone={medicalStatus.tone} className="mt-2">
                {medicalStatus.label}
              </Badge>
            </div>
            <div className="mt-4 max-w-sm border-t border-white/10 pt-4">
              <MedicalCertificateUpload />
            </div>
          </CardBody>
        </Card>

        {results.length > 0 && (
          <Card className="sm:col-span-2">
            <CardBody>
              <p className="mb-2 text-sm text-brand-text/60">
                Результаты соревнований
              </p>
              <ul className="flex flex-col divide-y divide-white/10">
                {results.map((r) => (
                  <li key={r.id} className="py-2">
                    <p className="text-sm font-medium">{r.competitionName}</p>
                    <p className="text-xs text-brand-text/50">
                      {formatDateRu(r.date)} · {r.result}
                    </p>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
