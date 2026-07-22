import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/shared/Avatar";
import { ATHLETE_RANK_COLORS, ATHLETE_RANK_LABELS, TRAINER_ROLE_LABELS } from "@/lib/labels";

export default async function ParentTrainersPage() {
  await requireParentChild();

  const trainers = await prisma.trainer.findMany({
    include: { groups: true },
    orderBy: [{ role: "asc" }, { username: "asc" }],
  });

  return (
    <>
      <PageHeader title="Наши тренеры" description="Тренерский состав школы" />

      <div className="grid gap-4 sm:grid-cols-2">
        {trainers.map((t) => {
          const avatarUrl = t.avatarUrl ? `/api/trainer-avatars/${t.id}` : null;
          return (
            <Card key={t.id}>
              <CardBody className="flex flex-col items-center gap-3 text-center">
                <Avatar name={t.username} url={avatarUrl} size={88} />
                <div>
                  <p className="font-heading text-lg font-bold">{t.username}</p>
                  <Badge tone={t.role === "HEAD" ? "violet" : "neutral"} className="mt-1">
                    {TRAINER_ROLE_LABELS[t.role]}
                  </Badge>
                </div>

                {t.rank && (
                  <p
                    className="font-heading text-xl font-bold"
                    style={{
                      color: ATHLETE_RANK_COLORS[t.rank],
                      textShadow: `0 0 10px ${ATHLETE_RANK_COLORS[t.rank]}`,
                    }}
                  >
                    {ATHLETE_RANK_LABELS[t.rank]}
                  </p>
                )}

                {t.bio && <p className="text-sm text-brand-text/70">{t.bio}</p>}

                {t.groups.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {t.groups.map((g) => (
                      <Badge key={g.id} tone="cyan">
                        {g.name} · {g.pool}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
}
