import { requireTrainer } from "@/lib/auth";
import { createEventAction } from "@/lib/actions/event-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EventForm } from "@/components/trainer/EventForm";

export default async function NewEventPage() {
  await requireTrainer();

  return (
    <>
      <PageHeader title="Новое событие" description="Новость, сбор или соревнование" />
      <Card className="max-w-xl">
        <CardBody>
          <EventForm action={createEventAction} submitLabel="Опубликовать" />
        </CardBody>
      </Card>
    </>
  );
}
