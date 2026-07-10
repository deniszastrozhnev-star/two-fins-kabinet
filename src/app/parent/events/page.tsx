import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { EVENT_TYPE_LABELS } from "@/lib/labels";
import { formatDateRu } from "@/lib/dates";
import { signUpForEventAction, cancelSignupAction } from "@/lib/actions/signup-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventSignupButton } from "@/components/parent/EventSignupButton";

const TYPE_TONE = {
  NEWS: "neutral",
  GATHERING: "violet",
  COMPETITION: "cyan",
} as const;

export default async function ParentEventsPage() {
  const child = await requireParentChild();

  const [events, mySignups] = await Promise.all([
    prisma.event.findMany({ orderBy: { dateStart: "desc" } }),
    prisma.eventSignup.findMany({
      where: { childId: child.id },
      select: { eventId: true },
    }),
  ]);
  const signedUpIds = new Set(mySignups.map((s) => s.eventId));

  return (
    <>
      <PageHeader
        title="Новости и события"
        description="Новости, сборы и соревнования школы"
      />

      {events.length === 0 ? (
        <EmptyState
          title="Пока ничего нет"
          description="Здесь появятся новости, сборы и соревнования школы."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => {
            const signedUp = signedUpIds.has(event.id);
            return (
              <Card key={event.id}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Badge tone={TYPE_TONE[event.type]}>
                        {EVENT_TYPE_LABELS[event.type]}
                      </Badge>
                      <p className="mt-2 font-heading text-lg font-bold">
                        {event.title}
                      </p>
                      <p className="text-sm text-brand-text/50">
                        {formatDateRu(event.dateStart)}
                        {event.dateEnd
                          ? ` – ${formatDateRu(event.dateEnd)}`
                          : ""}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                  </div>

                  {event.description && (
                    <p className="mt-3 text-sm text-brand-text/80">
                      {event.description}
                    </p>
                  )}
                  {event.suitableFor && (
                    <p className="mt-2 text-xs text-brand-text/50">
                      Для кого подходит: {event.suitableFor}
                    </p>
                  )}

                  <div className="mt-4">
                    <form action={signedUp ? cancelSignupAction : signUpForEventAction}>
                      <input type="hidden" name="eventId" value={event.id} />
                      <EventSignupButton signedUp={signedUp} />
                    </form>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
