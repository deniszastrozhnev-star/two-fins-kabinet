import { requireTrainer } from "@/lib/auth";
import { createGroupAction } from "@/lib/actions/group-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { GroupForm } from "@/components/trainer/GroupForm";

export default async function NewGroupPage() {
  await requireTrainer();

  return (
    <>
      <PageHeader title="Новая группа" description="Добавьте группу в расписание" />
      <Card className="max-w-xl">
        <CardBody>
          <GroupForm action={createGroupAction} submitLabel="Добавить" />
        </CardBody>
      </Card>
    </>
  );
}
