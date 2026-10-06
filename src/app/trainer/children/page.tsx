import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { getWorkoffBalances } from "@/lib/workoffs";
import { getPaymentStatus } from "@/lib/payment";
import { getMedicalStatus } from "@/lib/medical";
import { formatPhone } from "@/lib/phone";
import { formatDateRu } from "@/lib/dates";
import {
  formatDayMonth,
  formatLessonsCount,
  getChildrenWithoutPayment,
  type UnpaidChild,
} from "@/lib/unpaidAttendance";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { ChildrenList, type ChildListItem } from "@/components/trainer/ChildrenList";

const PENDING_VISIBLE = 8;
const UNPAID_VISIBLE = 8;

function UnpaidChildRow({ row }: { row: UnpaidChild }) {
  return (
    <li>
      <Link
        href={`/trainer/children/${row.id}`}
        className="flex flex-col gap-0.5 py-2.5 hover:bg-white/5"
      >
        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="min-w-0 break-words font-medium">
            {row.lastName} {row.firstName}
          </span>
          <span className="text-xs font-medium text-red-300">
            без оплаты: {formatLessonsCount(row.unpaid)}
          </span>
        </span>
        <span className="text-xs text-brand-text/60">
          {row.groupName ?? "без группы"} · последнее занятие {formatDayMonth(row.lastPresent)} ·{" "}
          {row.paidUntil ? `оплачено до ${formatDayMonth(row.paidUntil)}` : "не оплачивал"}
        </span>
      </Link>
    </li>
  );
}

function PendingReceiptRow({
  row,
}: {
  row: { id: string; name: string; latest: Date; count: number };
}) {
  return (
    <li>
      <Link
        href={`/trainer/children/${row.id}`}
        className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5 hover:bg-white/5"
      >
        <span className="min-w-0 break-words font-medium">{row.name}</span>
        <span className="text-xs text-brand-text/60">
          чек от {formatDateRu(row.latest)}
          {row.count > 1 ? ` · всего ${row.count}` : ""}
        </span>
      </Link>
    </li>
  );
}

export default async function ChildrenPage() {
  const trainer = await requireTrainer();

  const [children, totalChildren, allForDuplicateCheck] = await Promise.all([
    prisma.child.findMany({
      include: { group: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.child.count(),
    trainer.role === "HEAD"
      ? prisma.child.findMany({
          select: {
            id: true,
            lastName: true,
            firstName: true,
            birthDate: true,
            group: { select: { name: true } },
          },
        })
      : Promise.resolve(
          [] as {
            id: string;
            lastName: string;
            firstName: string;
            birthDate: Date | null;
            group: { name: string } | null;
          }[],
        ),
  ]);

  // Совпадение по фамилии+имени (без учёта регистра/пробелов) — уже сигнал
  // возможного дубля; совпадающая дата рождения делает его увереннее, но не
  // обязательна (не у всех детей она вообще указана).
  const duplicateGroupsByKey = new Map<string, typeof allForDuplicateCheck>();
  for (const c of allForDuplicateCheck) {
    const key = `${c.lastName.trim().toLowerCase()}|${c.firstName.trim().toLowerCase()}`;
    const group = duplicateGroupsByKey.get(key);
    if (group) group.push(c);
    else duplicateGroupsByKey.set(key, [c]);
  }
  const duplicateClusters = [...duplicateGroupsByKey.values()].filter((g) => g.length > 1);
  const duplicateChildIds = new Set(duplicateClusters.flat().map((c) => c.id));

  const [balances, unviewedReceipts, pendingReceipts, certificates, contracts, unpaidChildren] = await Promise.all([
    getWorkoffBalances(children.map((c) => c.id)),
    prisma.paymentReceipt.findMany({
      where: { childId: { in: children.map((c) => c.id) }, viewedAt: null },
      select: { childId: true },
    }),
    // Чек загружен, но тренер ещё не подтвердил оплату (resolvedAt пуст) —
    // даже если карточку уже открывали (viewedAt не пуст): работа с чеком не
    // закончена. Идёт в отдельный блок наверху, порядок основного списка не трогаем.
    prisma.paymentReceipt.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: "desc" },
      select: { childId: true, createdAt: true },
    }),
    prisma.medicalCertificate.findMany({
      where: { childId: { in: children.map((c) => c.id) } },
      orderBy: { createdAt: "desc" },
      select: { childId: true, validUntil: true },
    }),
    prisma.contractDocument.findMany({
      where: { childId: { in: children.map((c) => c.id) } },
      select: { childId: true },
    }),
    // Отдельный блок наверху (порядок основного списка не трогаем): дети с
    // отметками «Пришёл» позже срока оплаты, см. lib/unpaidAttendance.ts.
    getChildrenWithoutPayment(),
  ]);
  const childrenWithNewReceipt = new Set(unviewedReceipts.map((r) => r.childId));

  // Один ребёнок — одна строка блока: дата самого свежего неподтверждённого чека
  // (pendingReceipts уже отсортирован от новых к старым) и сколько их всего.
  const childById = new Map(children.map((c) => [c.id, c]));
  const pendingByChild = new Map<string, { latest: Date; count: number }>();
  for (const r of pendingReceipts) {
    if (!childById.has(r.childId)) continue;
    const entry = pendingByChild.get(r.childId);
    if (entry) entry.count += 1;
    else pendingByChild.set(r.childId, { latest: r.createdAt, count: 1 });
  }
  const pendingRows = [...pendingByChild.entries()].map(([childId, info]) => {
    const c = childById.get(childId)!;
    return { id: childId, name: `${c.lastName} ${c.firstName}`, ...info };
  });
  const latestValidUntilByChild = new Map<string, Date>();
  for (const cert of certificates) {
    if (!latestValidUntilByChild.has(cert.childId)) {
      latestValidUntilByChild.set(cert.childId, cert.validUntil);
    }
  }
  const childrenWithContract = new Set(contracts.map((c) => c.childId));

  const enrichedChildren = children.map((child) => {
    const payment = getPaymentStatus(child.paidUntil);
    const medical = getMedicalStatus(latestValidUntilByChild.get(child.id) ?? null);
    const contractOk = childrenWithContract.has(child.id);
    const paymentOk = payment.tone === "green";
    const medicalOk = medical.tone === "green";
    const hasIssue = !paymentOk || !medicalOk || !contractOk;
    return { child, payment, medical, paymentOk, medicalOk, contractOk, hasIssue };
  });
  enrichedChildren.sort((a, b) => {
    if (a.hasIssue !== b.hasIssue) return a.hasIssue ? -1 : 1;
    const lastNameCmp = a.child.lastName.localeCompare(b.child.lastName, "ru");
    if (lastNameCmp !== 0) return lastNameCmp;
    return a.child.firstName.localeCompare(b.child.firstName, "ru");
  });

  const listItems: ChildListItem[] = enrichedChildren.map(
    ({ child, paymentOk, medicalOk, contractOk }) => ({
      id: child.id,
      lastName: child.lastName,
      firstName: child.firstName,
      groupName: child.group?.name ?? null,
      phone: formatPhone(child.parentPhone),
      balance: balances.get(child.id) ?? 0,
      isDuplicate: duplicateChildIds.has(child.id),
      isSick: child.status === "SICK",
      hasNewReceipt: childrenWithNewReceipt.has(child.id),
      paymentOk,
      medicalOk,
      contractOk,
    }),
  );

  return (
    <>
      <PageHeader
        title="Дети"
        description="Все ученики школы, оплата и остаток отработок"
        action={<LinkButton href="/trainer/children/new">+ Добавить ребёнка</LinkButton>}
      />

      <p className="mb-4 text-sm text-brand-text/60">
        Всего детей: <span className="font-heading text-lg font-bold text-brand-text">{totalChildren}</span>
      </p>

      {duplicateClusters.length > 0 && (
        <Card className="mb-5 border-amber-500/30 bg-amber-500/10">
          <CardBody>
            <h2 className="mb-3 font-heading text-base font-bold text-amber-200">
              Возможные дубликаты ({duplicateClusters.length})
            </h2>
            <div className="flex flex-col gap-2">
              {duplicateClusters.map((cluster) => (
                <div
                  key={cluster.map((c) => c.id).join("-")}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-amber-500/20 bg-brand-base/40 px-3 py-2"
                >
                  {cluster.map((c) => (
                    <Link
                      key={c.id}
                      href={`/trainer/children/${c.id}`}
                      className="text-sm text-brand-text hover:underline"
                    >
                      {c.lastName} {c.firstName}
                      {c.birthDate && ` · ${formatDateRu(c.birthDate)}`}
                      {c.group?.name && ` · ${c.group.name}`}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {pendingRows.length > 0 && (
        <Card className="mb-5 border-brand-violet/30 bg-brand-violet/10">
          <CardBody>
            <h2 className="mb-3 font-heading text-base font-bold">
              Чеки на проверке ({pendingRows.length})
            </h2>
            <ul className="flex flex-col divide-y divide-white/10">
              {pendingRows.slice(0, PENDING_VISIBLE).map((r) => (
                <PendingReceiptRow key={r.id} row={r} />
              ))}
            </ul>
            {pendingRows.length > PENDING_VISIBLE && (
              <details className="mt-1">
                <summary className="cursor-pointer py-2 text-sm text-brand-cyan">
                  Показать ещё {pendingRows.length - PENDING_VISIBLE}
                </summary>
                <ul className="flex flex-col divide-y divide-white/10">
                  {pendingRows.slice(PENDING_VISIBLE).map((r) => (
                    <PendingReceiptRow key={r.id} row={r} />
                  ))}
                </ul>
              </details>
            )}
          </CardBody>
        </Card>
      )}

      {unpaidChildren.length > 0 && (
        <Card className="mb-5 border-red-500/30 bg-red-500/10">
          <CardBody>
            <h2 className="mb-3 font-heading text-base font-bold text-red-200">
              Ходят без оплаты ({unpaidChildren.length})
            </h2>
            <ul className="flex flex-col divide-y divide-white/10">
              {unpaidChildren.slice(0, UNPAID_VISIBLE).map((r) => (
                <UnpaidChildRow key={r.id} row={r} />
              ))}
            </ul>
            {unpaidChildren.length > UNPAID_VISIBLE && (
              <details className="mt-1">
                <summary className="cursor-pointer py-2 text-sm text-brand-cyan">
                  Показать ещё {unpaidChildren.length - UNPAID_VISIBLE}
                </summary>
                <ul className="flex flex-col divide-y divide-white/10">
                  {unpaidChildren.slice(UNPAID_VISIBLE).map((r) => (
                    <UnpaidChildRow key={r.id} row={r} />
                  ))}
                </ul>
              </details>
            )}
          </CardBody>
        </Card>
      )}

      <ChildrenList items={listItems} />
    </>
  );
}
