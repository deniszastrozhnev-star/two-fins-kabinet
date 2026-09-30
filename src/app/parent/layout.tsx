import { prisma } from "@/lib/prisma";
import { requireParentFamily } from "@/lib/auth";
import { getPaymentStatus } from "@/lib/payment";
import { getMedicalStatus } from "@/lib/medical";
import { LEVEL_LABELS } from "@/lib/labels";
import { ParentShell } from "@/components/parent/ParentShell";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { child, siblings } = await requireParentFamily();
  const [contract, latestCertificate, linkedAthlete, latestEvent] = await Promise.all([
    prisma.contractDocument.findFirst({
      where: { childId: child.id },
      select: { id: true },
    }),
    prisma.medicalCertificate.findFirst({
      where: { childId: child.id },
      orderBy: { createdAt: "desc" },
      select: { validUntil: true },
    }),
    prisma.athlete.findUnique({
      where: { linkedChildId: child.id },
      select: { id: true, rank: true, avatarUrl: true },
    }),
    prisma.event.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);
  const contractUploaded = contract != null;
  const payment = getPaymentStatus(child.paidUntil);
  const medical = getMedicalStatus(latestCertificate?.validUntil ?? null);
  const groupLabel = child.group
    ? `${LEVEL_LABELS[child.group.level]} · ${child.group.pool}`
    : null;
  // Своя фотография у ребёнка — приоритет; если её нет, но аккаунты связаны
  // со спортсменом и там уже есть аватар — используем его как запасной вариант.
  const childAvatarUrl = child.avatarUrl
    ? `/api/child-avatars/${child.id}`
    : linkedAthlete?.avatarUrl
      ? `/api/avatars/${linkedAthlete.id}`
      : null;
  const hasUnseenEvent =
    latestEvent != null &&
    (!child.lastSeenEventsAt || latestEvent.createdAt > child.lastSeenEventsAt);

  return (
    <ParentShell
      childName={`${child.lastName} ${child.firstName}`}
      childId={child.id}
      childAvatarUrl={childAvatarUrl}
      groupLabel={groupLabel}
      athleteRank={linkedAthlete?.rank ?? null}
      chatUrl={child.group?.chatUrl ?? null}
      siblings={siblings}
      contractUploaded={contractUploaded}
      payment={payment}
      medical={medical}
      hasUnseenEvent={hasUnseenEvent}
    >
      {children}
    </ParentShell>
  );
}
