import { NavLink } from "@/components/NavLink";
import { logoutAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { AvatarUpload } from "@/components/athlete/AvatarUpload";
import { AthleteRankSelect } from "@/components/athlete/AthleteRankSelect";
import { AthleteGenderSelect } from "@/components/athlete/AthleteGenderSelect";
import { StoryRail } from "@/components/shared/StoryRail";
import { ATHLETE_RANK_COLORS, ATHLETE_RANK_LABELS } from "@/lib/labels";
import type { AthleteRank, Gender } from "@prisma/client";
import type { StoriesFeed } from "@/lib/stories";

const LINKS = [
  { href: "/athlete", label: "Дневник", exact: true },
  { href: "/athlete/trainings", label: "Тренировки" },
  { href: "/athlete/competitions", label: "Соревнования" },
  { href: "/athlete/rank-standards", label: "Разряды" },
  { href: "/athlete/rating", label: "Рейтинг" },
];

export function AthleteShell({
  children,
  athleteName,
  avatarUrl,
  rank,
  gender,
  suggestedRank,
  weekVolumeMeters,
  weekGymMinutes,
  weekPlace,
  weekTotal,
  storiesFeed,
}: {
  children: React.ReactNode;
  athleteName: string;
  avatarUrl: string | null;
  rank: AthleteRank | null;
  gender: Gender | null;
  suggestedRank: AthleteRank | null;
  weekVolumeMeters: number;
  weekGymMinutes: number;
  weekPlace: number | null;
  weekTotal: number;
  storiesFeed: StoriesFeed;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-white/10 bg-brand-base/70 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-2.5">
          <p className="font-heading text-sm font-bold text-brand-cyan">Two Fins (Две Ласты)</p>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Выйти
            </Button>
          </form>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 pt-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <AvatarUpload name={athleteName} url={avatarUrl} size={112} />
          <p className="font-heading text-xl font-bold">{athleteName}</p>

          {rank ? (
            <p
              className="font-heading text-3xl font-bold sm:text-4xl"
              style={{
                color: ATHLETE_RANK_COLORS[rank],
                textShadow: `0 0 12px ${ATHLETE_RANK_COLORS[rank]}, 0 0 32px ${ATHLETE_RANK_COLORS[rank]}`,
              }}
            >
              {ATHLETE_RANK_LABELS[rank]}
            </p>
          ) : (
            <p className="text-sm text-brand-text/50">Укажи свой разряд</p>
          )}
          <AthleteRankSelect currentRank={rank} />

          {suggestedRank && (
            <p className="text-sm text-brand-text/60">
              По результатам соревнований:{" "}
              <span
                className="font-semibold"
                style={{ color: ATHLETE_RANK_COLORS[suggestedRank] }}
              >
                {ATHLETE_RANK_LABELS[suggestedRank]}
              </span>{" "}
              — при желании укажи в «Мой разряд» выше
            </p>
          )}

          <div className="flex items-center gap-2">
            {!gender && (
              <p className="text-xs text-brand-text/50">
                Укажи пол, чтобы видеть подсказку по разряду:
              </p>
            )}
            <AthleteGenderSelect currentGender={gender} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Card>
            <CardBody className="p-3 text-center sm:p-4">
              <p className="font-heading text-xl font-bold text-brand-cyan">
                {weekVolumeMeters}
              </p>
              <p className="mt-0.5 text-xs text-brand-text/60">м за неделю</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-3 text-center sm:p-4">
              <p className="font-heading text-xl font-bold text-brand-cyan">{weekGymMinutes}</p>
              <p className="mt-0.5 text-xs text-brand-text/60">мин ОФП</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-3 text-center sm:p-4">
              <p className="font-heading text-xl font-bold text-brand-cyan">
                {weekPlace ?? "—"}
                {weekPlace && <span className="text-sm text-brand-text/50">/{weekTotal}</span>}
              </p>
              <p className="mt-0.5 text-xs text-brand-text/60">место в рейтинге</p>
            </CardBody>
          </Card>
        </div>

        <div className="mt-6">
          <StoryRail feed={storiesFeed} ownName={athleteName} ownAvatarUrl={avatarUrl} />
        </div>
      </div>

      <nav className="mx-auto mt-4 flex w-full max-w-3xl gap-1 overflow-x-auto border-t border-white/10 px-4 pt-3">
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

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">{children}</main>
    </div>
  );
}
