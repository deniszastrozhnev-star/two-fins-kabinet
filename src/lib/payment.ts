import { differenceInCalendarDays, startOfDay } from "date-fns";

export type PaymentStatus = {
  label: string;
  tone: "green" | "amber" | "red" | "neutral";
  daysLeft: number | null;
};

export function getPaymentStatus(paidUntil: Date | null): PaymentStatus {
  if (!paidUntil) {
    return { label: "Не оплачено", tone: "neutral", daysLeft: null };
  }

  const today = startOfDay(new Date());
  const daysLeft = differenceInCalendarDays(startOfDay(paidUntil), today);

  if (daysLeft < 0) {
    return { label: "Оплата просрочена", tone: "red", daysLeft };
  }
  if (daysLeft <= 5) {
    return { label: `Осталось ${daysLeft} дн.`, tone: "amber", daysLeft };
  }
  return { label: `Осталось ${daysLeft} дн.`, tone: "green", daysLeft };
}
