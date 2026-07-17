import { NavLink } from "@/components/NavLink";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/Button";

const LINKS = [
  { href: "/athlete", label: "Дневник", exact: true },
  { href: "/athlete/rating", label: "Рейтинг" },
];

export function AthleteShell({
  children,
  childName,
}: {
  children: React.ReactNode;
  childName: string;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col pb-20 sm:pb-0">
      <header className="border-b border-white/10 bg-brand-base/70 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="font-heading text-base font-bold text-brand-cyan leading-tight">
              Two Fins (Две Ласты)
            </p>
            <p className="text-xs text-brand-text/50">{childName}</p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Выйти
            </Button>
          </form>
        </div>
        <nav className="mx-auto hidden max-w-3xl gap-1 px-4 pb-2 sm:flex">
          {LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              exact={link.exact}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition"
              activeClassName="-translate-y-px bg-brand-cyan/20 text-brand-cyan shadow-[0_4px_14px_-4px_rgba(41,211,224,0.55)] ring-1 ring-inset ring-brand-cyan/30"
              inactiveClassName="text-brand-text/60 hover:bg-white/5 hover:text-brand-text"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-brand-base/95 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-3xl">
          {LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              exact={link.exact}
              className="mx-1 my-1.5 flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition"
              activeClassName="bg-brand-cyan/15 text-brand-cyan shadow-[inset_0_2px_5px_rgba(0,0,0,0.3)]"
              inactiveClassName="text-brand-text/50"
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
