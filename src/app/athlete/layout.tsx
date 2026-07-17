import { requireAthleteChild } from "@/lib/auth";
import { AthleteShell } from "@/components/athlete/AthleteShell";

export default async function AthleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const child = await requireAthleteChild();

  return (
    <AthleteShell childName={`${child.lastName} ${child.firstName}`}>
      {children}
    </AthleteShell>
  );
}
