import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { updateEventAction, deleteEventAction } from "@/lib/actions/event-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EventForm } from "@/components/trainer/EventForm";
import { ConfirmSubmitButton } from "@/components/trainer/ConfirmSubmitButton";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTrainer();
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      signups: {
        include: { child: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!event) notFound();

  return (
    <>
      <PageHeader title={event.title} description="Редактирование события" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <EventForm action={updateEventAction} initial={event} />
          </CardBody>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardBody>
              <h2 className="mb-3 font-heading text-lg font-bold">
                Записались ({event.signups.length})
              </h2>
              {event.signups.length === 0 ? (
                <p className="text-sm text-brand-text/50">
                  Пока никто не записался.
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-white/10">
                  {event.signups.map((s) => (
                    <li key={s.id} className="py-2 text-sm">
                      {s.child.lastName} {s.child.firstName}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="flex items-center justify-between">
              <div>
                <p className="font-medium">Удалить событие</p>
                <p className="text-xs text-brand-text/50">
                  Записи детей на него тоже удалятся
                </p>
              </div>
              <form action={deleteEventAction}>
                <input type="hidden" name="id" value={event.id} />
                <ConfirmSubmitButton
                  confirmMessage={`Удалить событие «${event.title}»?`}
                >
                  Удалить
                </ConfirmSubmitButton>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
