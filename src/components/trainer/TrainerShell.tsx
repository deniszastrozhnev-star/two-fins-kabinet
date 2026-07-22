import { NavLink } from "@/components/NavLink";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/Button";

type NavLinkDef = { href: string; label: string; exact?: boolean };

const BASE_LINKS: NavLinkDef[] = [
  { href: "/trainer", label: "Обзор", exact: true },
  { href: "/trainer/attendance", label: "Посещаемость" },
  { href: "/trainer/children", label: "Дети" },
  { href: "/trainer/schedule", label: "Расписание" },
  { href: "/trainer/personal-trainings", label: "Персональные тренировки" },
  { href: "/trainer/rank-standards", label: "Разряды" },
  { href: "/trainer/athletes", label: "Спортсмены" },
  { href: "/trainer/events", label: "Новости и события" },
  { href: "/trainer/settings", label: "Настройки" },
];

const HEAD_ONLY_LINKS: NavLinkDef[] = [
  { href: "/trainer/team", label: "Тренеры" },
  { href: "/trainer/report", label: "Отчёт" },
  { href: "/trainer/cold-children", label: "Холодные дети" },
  { href: "/trainer/metrics", label: "Показатели" },
  { href: "/trainer/athlete-levels", label: "Тренировки" },
];

export function TrainerShell({
  children,
  isHead,
}: {
  children: React.ReactNode;
  isHead: boolean;
}) {
  const LINKS = isHead ? [...BASE_LINKS, ...HEAD_ONLY_LINKS] : BASE_LINKS;
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-white/10 bg-brand-base/70 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-heading text-lg font-bold text-brand-cyan whitespace-nowrap">
              Two Fins (Две Ласты)
            </span>
            <span className="hidden sm:inline text-xs text-brand-text/50">
              кабинет тренера
            </span>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Выйти
            </Button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              exact={link.exact}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition"
              activeClassName="-translate-y-px bg-brand-cyan/20 text-brand-cyan shadow-[0_4px_14px_-4px_rgba(140,64,252,0.55)] ring-1 ring-inset ring-brand-cyan/30"
              inactiveClassName="text-brand-text/60 hover:bg-white/5 hover:text-brand-text"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
