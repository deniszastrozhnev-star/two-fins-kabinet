"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Field";
import type { GroupLevel } from "@prisma/client";

export function LevelTrainingDatePicker({ level, date }: { level: GroupLevel; date: string }) {
  const router = useRouter();

  return (
    <Input
      type="date"
      value={date}
      onChange={(e) => {
        if (e.target.value) {
          router.push(`/trainer/athlete-levels/${level}?date=${e.target.value}`);
        }
      }}
      className="!w-auto"
    />
  );
}
