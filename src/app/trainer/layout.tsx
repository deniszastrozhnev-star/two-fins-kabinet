import { prisma } from "@/lib/prisma";
import { TrainerShell } from "@/components/trainer/TrainerShell";
import { requireTrainer } from "@/lib/auth";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trainer = await requireTrainer();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [unpaidCount, groupsCount, athletesCount, trainersCount] = await Promise.all([
    prisma.child.count({
      where: { OR: [{ paidUntil: null }, { paidUntil: { lt: today } }] },
    }),
    prisma.group.count(),
    prisma.athlete.count(),
    prisma.trainer.count(),
  ]);

  return (
    <TrainerShell
      isHead={trainer.role === "HEAD"}
      unpaidCount={unpaidCount}
      groupsCount={groupsCount}
      athletesCount={athletesCount}
      trainersCount={trainersCount}
    >
      {children}
    </TrainerShell>
  );
}
