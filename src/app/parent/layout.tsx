import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { ParentShell } from "@/components/parent/ParentShell";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const child = await requireParentChild();
  const contract = await prisma.contractDocument.findFirst({
    where: { childId: child.id },
    select: { id: true },
  });

  return (
    <ParentShell
      childName={`${child.lastName} ${child.firstName}`}
      contractUploaded={contract != null}
    >
      {children}
    </ParentShell>
  );
}
