import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/Button";
import { NavCardGrid } from "@/components/shared/NavCardGrid";
import type { NavCardItem } from "@/components/shared/NavCard";
import {
  PaymentIcon,
  RegisterIcon,
  MedicalIcon,
  WorkoffIcon,
  TrophyIcon,
  NewsIcon,
  CalendarIcon,
  TrainerIcon,
} from "@/components/icons";
import type { PaymentStatus } from "@/lib/payment";
import type { MedicalStatus } from "@/lib/medical";

export function ParentShell({
  children,
  childName,
  contractUploaded,
  payment,
  medical,
  workoffBalance,
  resultsCount,
}: {
  children: React.ReactNode;
  childName: string;
  contractUploaded: boolean;
  payment: PaymentStatus;
  medical: MedicalStatus;
  workoffBalance: number;
  resultsCount: number;
}) {
  const iconClass = "h-6 w-6";
  const items: NavCardItem[] = [
    {
      href: "/parent#payment",
      label: "Оплата",
      icon: <PaymentIcon className={iconClass} />,
      badge: { label: payment.label, tone: payment.tone },
    },
    {
      href: "/parent#contract",
      label: "Договор",
      icon: <RegisterIcon className={iconClass} />,
      badge: contractUploaded
        ? { label: "Загружен", tone: "green" }
        : { label: "Не загружен", tone: "red" },
    },
    {
      href: "/parent#contract",
      label: "Справка",
      icon: <MedicalIcon className={iconClass} />,
      badge: { label: medical.label, tone: medical.tone },
    },
    {
      href: "/parent/workoff-schedule",
      label: "Отработки",
      icon: <WorkoffIcon className={iconClass} />,
      badge: { label: workoffBalance > 0 ? `${workoffBalance} доступно` : "Нет", tone: "neutral" },
    },
    {
      href: "/parent#results",
      label: "Результаты",
      icon: <TrophyIcon className={iconClass} />,
      badge: { label: resultsCount > 0 ? `${resultsCount}` : "Нет", tone: "neutral" },
    },
    { href: "/parent/events", label: "Новости", icon: <NewsIcon className={iconClass} /> },
    { href: "/parent/calendar", label: "Календарь", icon: <CalendarIcon className={iconClass} /> },
    { href: "/parent/trainers", label: "Наши тренеры", icon: <TrainerIcon className={iconClass} /> },
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-white/10 bg-brand-base/70 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/parent">
            <p className="font-heading text-base font-bold text-brand-cyan leading-tight">
              Two Fins (Две Ласты)
            </p>
            <p className="text-xs text-brand-text/50">{childName}</p>
          </Link>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Выйти
            </Button>
          </form>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 pt-4">
        <NavCardGrid items={items} />
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">
        {children}
      </main>
    </div>
  );
}
