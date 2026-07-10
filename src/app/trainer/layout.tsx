import { TrainerShell } from "@/components/trainer/TrainerShell";
import { requireTrainer } from "@/lib/auth";

export default async function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trainer = await requireTrainer();
  return <TrainerShell isHead={trainer.role === "HEAD"}>{children}</TrainerShell>;
}
