import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/Button";
import { NavCardGrid } from "@/components/shared/NavCardGrid";
import { ChildSwitcher } from "@/components/parent/ChildSwitcher";
import { ChildAvatarUpload } from "@/components/parent/ChildAvatarUpload";
import type { NavCardItem } from "@/components/shared/NavCard";
import { PaymentIcon, RegisterIcon, AttendanceIcon, NewsIcon, MoreIcon } from "@/components/icons";
import { ATHLETE_RANK_COLORS, ATHLETE_RANK_LABELS } from "@/lib/labels";
import type { PaymentStatus } from "@/lib/payment";
import type { MedicalStatus } from "@/lib/medical";
import type { AthleteRank } from "@prisma/client";

/** Упрощённый первый экран: на виду только оплата, документы (справка+договор
 * одним пунктом), расписание и новости — всё остальное (отработки,
 * результаты, курсовка, календарь посещений, тренеры) убрано в "Ещё", без
 * потери функций — см. /parent/more. */
export function ParentShell({
  children,
  childName,
  childId,
  childAvatarUrl,
  groupLabel,
  athleteRank,
  siblings,
  contractUploaded,
  payment,
  medical,
  hasUnseenEvent,
}: {
  children: React.ReactNode;
  childName: string;
  childId: string;
  childAvatarUrl: string | null;
  groupLabel: string | null;
  athleteRank: AthleteRank | null;
  siblings: { id: string; lastName: string; firstName: string }[];
  contractUploaded: boolean;
  payment: PaymentStatus;
  medical: MedicalStatus;
  hasUnseenEvent: boolean;
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
      href: "/parent/events",
      label: "Новости",
      icon: <NewsIcon className={iconClass} />,
      badge: hasUnseenEvent ? { label: "Новое", tone: "cyan" } : undefined,
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

      <div className="mx-auto w-full max-w-3xl px-4 pt-6">
        <div className="flex flex-col items-center gap-2 pb-6 text-center">
          <ChildAvatarUpload name={childName} url={childAvatarUrl} size={96} />
          <p className="font-heading text-xl font-bold">{childName}</p>
          {groupLabel && <p className="text-sm text-brand-text/60">{groupLabel}</p>}
          {athleteRank && (
            <span
              className="mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold"
              style={{
                color: ATHLETE_RANK_COLORS[athleteRank],
                backgroundColor: `${ATHLETE_RANK_COLORS[athleteRank]}22`,
              }}
            >
              {ATHLETE_RANK_LABELS[athleteRank]}
            </span>
          )}
        </div>

        <div className="border-t border-white/10 pt-4">
          <NavCardGrid items={items} />
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">
        {children}
      </main>
    </div>
  );
}
