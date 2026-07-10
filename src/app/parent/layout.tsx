import { requireParentChild } from "@/lib/auth";
import { ParentShell } from "@/components/parent/ParentShell";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const child = await requireParentChild();

  return (
    <ParentShell childName={`${child.lastName} ${child.firstName}`}>
      {children}
    </ParentShell>
  );
}
