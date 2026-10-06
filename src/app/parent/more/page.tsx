import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { getWorkoffBalance } from "@/lib/workoffs";
import { COURSE_RESULT_NAME } from "@/lib/courseResults";
import { PageHeader } from "@/components/ui/PageHeader";
import { NavCardGrid } from "@/components/shared/NavCardGrid";
import type { NavCardItem } from "@/components/shared/NavCard";
import { WorkoffIcon, TrophyIcon, MetricsIcon, CalendarIcon, TrainerIcon } from "@/components/icons";

/** Всё, что убрали с первого экрана (см. ParentShell) — сюда, без потери
 * функций: те же разделы, что были раньше, просто на отдельной странице. */
export default async function ParentMorePage() {
  const child = await requireParentChild();
  const [workoffBalance, resultsCount, courseResultsCount] = await Promise.all([
    getWorkoffBalance(child.id),
    prisma.competitionResult.count({
      where: { childId: child.id, competitionName: { not: COURSE_RESULT_NAME } },
    }),
    prisma.competitionResult.count({
      where: { childId: child.id, competitionName: COURSE_RESULT_NAME },
    }),
  ]);

  const iconClass = "h-6 w-6";
  const items: NavCardItem[] = [
    {
      href: "/parent/workoff-schedule",
      label: "Отработки",
      icon: <WorkoffIcon className={iconClass} />,
      badge: { label: workoffBalance > 0 ? `${workoffBalance} доступно` : "Нет", tone: "neutral" },
    },
    {
      href: "/parent/results",
      label: "Результаты",
      icon: <TrophyIcon className={iconClass} />,
      badge: { label: resultsCount > 0 ? `${resultsCount}` : "Нет", tone: "neutral" },
    },
    {
      href: "/parent/course-results",
      label: "Курсовка",
      icon: <MetricsIcon className={iconClass} />,
      badge: { label: courseResultsCount > 0 ? `${courseResultsCount}` : "Нет", tone: "neutral" },
    },
    { href: "/parent/calendar", label: "Календарь", icon: <CalendarIcon className={iconClass} /> },
    { href: "/parent/trainers", label: "Наши тренеры", icon: <TrainerIcon className={iconClass} /> },
  ];

  return (
    <>
      <PageHeader title="Ещё" />
      <NavCardGrid items={items} />
    </>
  );
}
