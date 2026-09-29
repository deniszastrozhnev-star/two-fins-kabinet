import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/Button";
import { NavCardGrid } from "@/components/shared/NavCardGrid";
import { ChildSwitcher } from "@/components/parent/ChildSwitcher";
import type { NavCardItem } from "@/components/shared/NavCard";
import { PaymentIcon, RegisterIcon, AttendanceIcon, MoreIcon } from "@/components/icons";
import type { PaymentStatus } from "@/lib/payment";
import type { MedicalStatus } from "@/lib/medical";

/** Упрощённый первый экран: на виду только оплата, документы (справка+договор
 * одним пунктом) и расписание — всё остальное (отработки, результаты,
 * курсовка, новости, календарь посещений, тренеры) убрано в "Ещё", без
 * потери функций — см. /parent/more. */
export function ParentShell({
  children,
  childName,
  childId,
  siblings,
  contractUploaded,
  payment,
  medical,
}: {
  children: React.ReactNode;
  childName: string;
  childId: string;
  siblings: { id: string; lastName: string; firstName: string }[];
  contractUploaded: boolean;
  payment: PaymentStatus;
  medical: MedicalStatus;
}) {
  const iconClass = "h-6 w-6";

  // "Документы" объединяет справку и договор одной отметкой — красная, если
  // хоть чего-то не хватает, чтобы сразу было видно, что нужно донести.
  const documentsOk = contractUploaded && medical.tone === "green";
  const documentsBadge = documentsOk
    ? { label: "В порядке", tone: "green" as const }
    : { label: "Нужно внимание", tone: "red" as const };

  const items: NavCardItem[] = [
    {
      href: "/parent#payment",
      label: "Оплата",
      icon: <PaymentIcon className={iconClass} />,
      badge: { label: payment.label, tone: payment.tone },
    },
    {
      href: "/parent#documents",
      label: "Документы",
      icon: <RegisterIcon className={iconClass} />,
      badge: documentsBadge,
    },
    {
      href: "/parent#schedule",
      label: "Расписание",
      icon: <AttendanceIcon className={iconClass} />,
    },
    {
      href: "/parent/more",
      label: "Ещё",
      icon: <MoreIcon className={iconClass} />,
    },
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
          <div className="flex items-center gap-2">
            {siblings.length > 1 && (
              <ChildSwitcher siblings={siblings} activeChildId={childId} />
            )}
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Выйти
              </Button>
            </form>
          </div>
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
