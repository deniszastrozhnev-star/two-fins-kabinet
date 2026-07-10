import { TrainerShell } from "@/components/trainer/TrainerShell";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TrainerShell>{children}</TrainerShell>;
}
