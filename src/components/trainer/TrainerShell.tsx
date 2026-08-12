import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/Button";
import { NavCardGrid } from "@/components/shared/NavCardGrid";
import type { NavCardItem } from "@/components/shared/NavCard";
import {
  AttendanceIcon,
  ChildrenIcon,
  GroupsIcon,
  WorkoffIcon,
  NewsIcon,
  PersonalTrainingIcon,
  TrophyIcon,
  SettingsIcon,
  ReportIcon,
  ColdIcon,
  MetricsIcon,
  TeamIcon,
  LevelTaskIcon,
  AthleteIcon,
} from "@/components/icons";

export function TrainerShell({
  children,
  isHead,
  unpaidCount,
  groupsCount,
  athletesCount,
  trainersCount,
}: {
  children: React.ReactNode;
  isHead: boolean;
  unpaidCount: number;
  groupsCount: number;
  athletesCount: number;
  trainersCount: number;
}) {
  const iconClass = "h-6 w-6";
  const items: NavCardItem[] = [
    { href: "/trainer/attendance", label: "Посещаемость", icon: <AttendanceIcon className={iconClass} /> },
    {
      href: "/trainer/children",
      label: "Дети",
      icon: <ChildrenIcon className={iconClass} />,
      badge:
        unpaidCount > 0
          ? { label: `${unpaidCount} без оплаты`, tone: "red" }
          : { label: "Все оплачено", tone: "green" },
    },
    {
      href: "/trainer/schedule",
      label: "Группы",
      icon: <GroupsIcon className={iconClass} />,
      badge: { label: `${groupsCount} групп`, tone: "neutral" },
    },
    { href: "/trainer/workoffs", label: "Отработки", icon: <WorkoffIcon className={iconClass} /> },
    {
      href: "/trainer/athletes",
      label: "Спортсмены",
      icon: <AthleteIcon className={iconClass} />,
      badge: { label: `${athletesCount} спортсменов`, tone: "neutral" },
    },
    { href: "/trainer/events", label: "Новости", icon: <NewsIcon className={iconClass} /> },
    {
      href: "/trainer/personal-trainings",
      label: "Персональные тренировки",
      icon: <PersonalTrainingIcon className={iconClass} />,
    },
    { href: "/trainer/rank-standards", label: "Разряды", icon: <TrophyIcon className={iconClass} /> },
    { href: "/trainer/settings", label: "Настройки", icon: <SettingsIcon className={iconClass} /> },
  ];

  if (isHead) {
    items.push(
      { href: "/trainer/athlete-levels", label: "Тренировки", icon: <LevelTaskIcon className={iconClass} /> },
      { href: "/trainer/report", label: "Отчёт по тренеру", icon: <ReportIcon className={iconClass} /> },
      { href: "/trainer/cold-children", label: "Холодные дети", icon: <ColdIcon className={iconClass} /> },
      { href: "/trainer/metrics", label: "Панель с цифрами", icon: <MetricsIcon className={iconClass} /> },
      {
        href: "/trainer/team",
        label: "Тренеры",
        icon: <TeamIcon className={iconClass} />,
        badge: { label: `${trainersCount} тренеров`, tone: "neutral" },
      },
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-white/10 bg-brand-base/70 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/trainer" className="flex items-center gap-2">
            <span className="font-heading text-lg font-bold text-brand-cyan whitespace-nowrap">
              Two Fins (Две Ласты)
            </span>
            <span className="hidden sm:inline text-xs text-brand-text/50">
              кабинет тренера
            </span>
          </Link>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Выйти
            </Button>
          </form>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6">
        <NavCardGrid items={items} />
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
