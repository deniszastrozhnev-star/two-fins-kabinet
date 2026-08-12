import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { getPaymentStatus } from "@/lib/payment";
import { getMedicalStatus } from "@/lib/medical";
import { getWorkoffBalance } from "@/lib/workoffs";
import { COURSE_RESULT_NAME } from "@/lib/courseResults";
import { ParentShell } from "@/components/parent/ParentShell";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const child = await requireParentChild();
  const [contract, latestCertificate, workoffBalance, resultsCount] = await Promise.all([
    prisma.contractDocument.findFirst({
      where: { childId: child.id },
      select: { id: true },
    }),
    prisma.medicalCertificate.findFirst({
      where: { childId: child.id },
      orderBy: { createdAt: "desc" },
      select: { validUntil: true },
    }),
    getWorkoffBalance(child.id),
    prisma.competitionResult.count({
      where: { childId: child.id, competitionName: { not: COURSE_RESULT_NAME } },
    }),
  ]);
  const contractUploaded = contract != null;
  const payment = getPaymentStatus(child.paidUntil);
  const medical = getMedicalStatus(latestCertificate?.validUntil ?? null);

  return (
    <ParentShell
      childName={`${child.lastName} ${child.firstName}`}
      contractUploaded={contractUploaded}
      payment={payment}
      medical={medical}
      workoffBalance={workoffBalance > 0 ? workoffBalance : 0}
      resultsCount={resultsCount}
    >
      {children}
    </ParentShell>
  );
}
