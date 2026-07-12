import { differenceInCalendarDays, startOfDay } from "date-fns";

export type MedicalStatus = {
  label: string;
  tone: "green" | "amber" | "red" | "neutral";
};

export function getMedicalStatus(validUntil: Date | null): MedicalStatus {
  if (!validUntil) {
    return { label: "Нет справки", tone: "neutral" };
  }

  const today = startOfDay(new Date());
  const daysLeft = differenceInCalendarDays(startOfDay(validUntil), today);

  if (daysLeft < 0) {
    return { label: "Справка истекла", tone: "red" };
  }
  if (daysLeft <= 14) {
    return { label: `Истекает через ${daysLeft} дн.`, tone: "amber" };
  }
  return { label: "Справка действует", tone: "green" };
}
