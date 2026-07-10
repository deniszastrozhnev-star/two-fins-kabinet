import { NavLink } from "@/components/NavLink";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/Button";

const LINKS = [
  { href: "/trainer", label: "Обзор", exact: true },
  { href: "/trainer/attendance", label: "Посещаемость" },
  { href: "/trainer/children", label: "Дети" },
  { href: "/trainer/schedule", label: "Расписание" },
  { href: "/trainer/workoffs", label: "Отработки" },
  { href: "/trainer/events", label: "Новости и события" },
  { href: "/trainer/settings", label: "Настройки" },
];

export function TrainerShell({ children }: { children: React.ReactNode }) {
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
              activeClassName="bg-brand-cyan/20 text-brand-cyan"
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
