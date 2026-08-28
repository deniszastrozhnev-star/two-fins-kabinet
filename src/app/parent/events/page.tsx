import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { EVENT_TYPE_LABELS } from "@/lib/labels";
import { formatDateRu } from "@/lib/dates";
import { isEventPast, sortEventsByRelevance } from "@/lib/events";
import { signUpForEventAction, cancelSignupAction } from "@/lib/actions/signup-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventSignupButton } from "@/components/parent/EventSignupButton";
import { PushNotificationPrompt } from "@/components/parent/PushNotificationPrompt";

export default async function ParentEventsPage() {
  const child = await requireParentChild();

  const [eventsRaw, mySignups] = await Promise.all([
    prisma.event.findMany(),
    prisma.eventSignup.findMany({
      where: { childId: child.id },
      select: { eventId: true },
    }),
  ]);
  const events = sortEventsByRelevance(eventsRaw);
  const signedUpIds = new Set(mySignups.map((s) => s.eventId));

  return (
    <>
      <PageHeader
        title="Новости и события"
        description="Новости, сборы и соревнования школы"
      />

      <PushNotificationPrompt />

      {events.length === 0 ? (
        <EmptyState
          title="Пока ничего нет"
          description="Здесь появятся новости, сборы и соревнования школы."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => {
            const signedUp = signedUpIds.has(event.id);
            const past = isEventPast(event);
            return (
              <Card key={event.id} className={past ? "opacity-60" : undefined}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="neutral">{EVENT_TYPE_LABELS[event.type]}</Badge>
                        {past && <Badge tone="neutral">Событие прошло</Badge>}
                      </div>
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
