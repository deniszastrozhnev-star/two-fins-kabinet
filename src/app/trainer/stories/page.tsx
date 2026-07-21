import { subHours } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { deleteStoryAction } from "@/lib/actions/athlete-profile-actions";
import { ACTIVE_STORY_HOURS } from "@/lib/stories";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmSubmitButton } from "@/components/trainer/ConfirmSubmitButton";
import { formatDateRu } from "@/lib/dates";

export default async function TrainerStoriesPage() {
  await requireTrainer();

  const stories = await prisma.athleteStory.findMany({
    where: { createdAt: { gte: subHours(new Date(), ACTIVE_STORY_HOURS) } },
    include: { athlete: { select: { lastName: true, firstName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Истории"
        description="Активные истории спортсменов (живут 24 часа) — модерация доступна любому тренеру"
      />

      {stories.length === 0 ? (
        <EmptyState title="Активных историй пока нет" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <Card key={s.id}>
              <CardBody>
                <div className="mb-2 aspect-[9/16] w-full overflow-hidden rounded-xl bg-black/40">
                  {s.mediaType === "PHOTO" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/stories/${s.id}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={`/api/stories/${s.id}`}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  )}
                </div>
                <p className="text-sm font-medium">
                  {s.athlete.lastName} {s.athlete.firstName}
                </p>
                {s.caption && <p className="mt-1 text-sm text-brand-text/70">{s.caption}</p>}
                <p className="mt-1 text-xs text-brand-text/50">
                  {formatDateRu(s.createdAt, "d MMMM, HH:mm")}
                </p>
                <form action={deleteStoryAction} className="mt-3">
                  <input type="hidden" name="id" value={s.id} />
                  <ConfirmSubmitButton confirmMessage="Удалить эту историю?">
                    Удалить
                  </ConfirmSubmitButton>
                </form>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
