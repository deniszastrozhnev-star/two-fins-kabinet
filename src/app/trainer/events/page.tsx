import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { EVENT_TYPE_LABELS } from "@/lib/labels";
import { formatDateRu } from "@/lib/dates";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

const TYPE_TONE = {
  NEWS: "neutral",
  GATHERING: "violet",
  COMPETITION: "cyan",
} as const;

export default async function EventsPage() {
  await requireTrainer();

  const events = await prisma.event.findMany({
    orderBy: { dateStart: "desc" },
    include: { _count: { select: { signups: true } } },
  });

  return (
    <>
      <PageHeader
        title="Новости и события"
        description="Новости, сборы и соревнования школы"
        action={<LinkButton href="/trainer/events/new">+ Создать</LinkButton>}
      />

      {events.length === 0 ? (
        <EmptyState
          title="Пока ничего не опубликовано"
          description="Создайте первую новость, сбор или соревнование."
          action={<LinkButton href="/trainer/events/new">Создать</LinkButton>}
        />
      ) : (
        <Card>
          <CardBody className="flex flex-col divide-y divide-white/10 p-0">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/trainer/events/${event.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:bg-white/5 sm:px-5"
              >
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-xs text-brand-text/50">
                    {formatDateRu(event.dateStart)}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{event._count.signups} записалось</Badge>
                  <Badge tone={TYPE_TONE[event.type]}>
                    {EVENT_TYPE_LABELS[event.type]}
                  </Badge>
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>
      )}
    </>
  );
}
