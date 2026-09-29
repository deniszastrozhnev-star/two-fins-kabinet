import { prisma } from "@/lib/prisma";
import { requireParentFamily } from "@/lib/auth";
import { getPaymentStatus } from "@/lib/payment";
import { getMedicalStatus } from "@/lib/medical";
import { ParentShell } from "@/components/parent/ParentShell";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { child, siblings } = await requireParentFamily();
  const [contract, latestCertificate] = await Promise.all([
    prisma.contractDocument.findFirst({
      where: { childId: child.id },
      select: { id: true },
    }),
    prisma.medicalCertificate.findFirst({
      where: { childId: child.id },
      orderBy: { createdAt: "desc" },
      select: { validUntil: true },
    }),
  ]);
  const contractUploaded = contract != null;
  const payment = getPaymentStatus(child.paidUntil);
  const medical = getMedicalStatus(latestCertificate?.validUntil ?? null);

  return (
    <ParentShell
      childName={`${child.lastName} ${child.firstName}`}
      childId={child.id}
      siblings={siblings}
      contractUploaded={contractUploaded}
      payment={payment}
      medical={medical}
    >
      {children}
    </ParentShell>
  );
}
