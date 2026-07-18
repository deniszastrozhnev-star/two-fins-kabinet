import { requireAthlete } from "@/lib/auth";
import { AthleteShell } from "@/components/athlete/AthleteShell";

export default async function AthleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const athlete = await requireAthlete();

  return (
    <AthleteShell athleteName={`${athlete.lastName} ${athlete.firstName}`}>
      {children}
    </AthleteShell>
  );
}
