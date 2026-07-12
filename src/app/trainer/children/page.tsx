import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { getWorkoffBalances } from "@/lib/workoffs";
import { getPaymentStatus } from "@/lib/payment";
import { getMedicalStatus } from "@/lib/medical";
import { formatPhone } from "@/lib/phone";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { SearchBox } from "@/components/trainer/SearchBox";

export default async function ChildrenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireTrainer();
  const { q } = await searchParams;

  const children = await prisma.child.findMany({
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
  });

  const [balances, unviewedReceipts, certificates] = await Promise.all([
    getWorkoffBalances(children.map((c) => c.id)),
    prisma.paymentReceipt.findMany({
      where: { childId: { in: children.map((c) => c.id) }, viewedAt: null },
      select: { childId: true },
    }),
    prisma.medicalCertificate.findMany({
      where: { childId: { in: children.map((c) => c.id) } },
      orderBy: { createdAt: "desc" },
      select: { childId: true, validUntil: true },
    }),
  ]);
  const childrenWithNewReceipt = new Set(unviewedReceipts.map((r) => r.childId));
  const latestValidUntilByChild = new Map<string, Date>();
  for (const cert of certificates) {
    if (!latestValidUntilByChild.has(cert.childId)) {
      latestValidUntilByChild.set(cert.childId, cert.validUntil);
    }
  }

  return (
    <>
      <PageHeader
        title="Дети"
        description="Все ученики школы, оплата и остаток отработок"
        action={<LinkButton href="/trainer/children/new">+ Добавить ребёнка</LinkButton>}
      />

      <div className="mb-5 max-w-sm">
        <SearchBox action="/trainer/children" defaultValue={q} placeholder="Поиск по имени…" />
      </div>

      {children.length === 0 ? (
        <EmptyState
          title={q ? "Никого не нашлось" : "Пока нет ни одного ребёнка"}
          description={
            q
              ? "Попробуйте изменить запрос."
              : "Добавьте первого ученика, чтобы начать вести посещаемость и оплату."
          }
          action={
            !q && (
              <LinkButton href="/trainer/children/new">Добавить ребёнка</LinkButton>
            )
          }
        />
      ) : (
        <Card>
          <CardBody className="flex flex-col divide-y divide-white/10 p-0">
            {children.map((child) => {
              const payment = getPaymentStatus(child.paidUntil);
              const balance = balances.get(child.id) ?? 0;
              const medical = getMedicalStatus(
                latestValidUntilByChild.get(child.id) ?? null,
              );
              return (
                <Link
                  key={child.id}
                  href={`/trainer/children/${child.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:bg-white/5 sm:px-5"
                >
                  <div>
                    <p className="font-medium">
                      {child.lastName} {child.firstName}
                    </p>
                    <p className="text-xs text-brand-text/50">
                      {child.group?.name ?? "Без группы"} ·{" "}
                      {formatPhone(child.parentPhone)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {child.status === "SICK" && (
                      <Badge tone="violet">болеет</Badge>
                    )}
                    {childrenWithNewReceipt.has(child.id) && (
                      <Badge tone="violet">есть чек</Badge>
                    )}
                    {(medical.tone === "amber" || medical.tone === "red") && (
                      <Badge tone={medical.tone}>{medical.label}</Badge>
                    )}
                    {balance > 0 && (
                      <Badge tone="amber">{balance} отраб.</Badge>
                    )}
                    <Badge tone={payment.tone === "neutral" ? "neutral" : payment.tone}>
                      {payment.label}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </CardBody>
        </Card>
      )}
    </>
  );
}
