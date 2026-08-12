import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { getPaymentStatus } from "@/lib/payment";
import { getMedicalStatus } from "@/lib/medical";
import { ParentShell } from "@/components/parent/ParentShell";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const child = await requireParentChild();
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
  const paymentOk = getPaymentStatus(child.paidUntil).tone === "green";
  const medicalOk = getMedicalStatus(latestCertificate?.validUntil ?? null).tone === "green";

  return (
    <ParentShell
      childName={`${child.lastName} ${child.firstName}`}
      contractUploaded={contractUploaded}
      paymentOk={paymentOk}
      medicalOk={medicalOk}
    >
      {children}
    </ParentShell>
  );
}
