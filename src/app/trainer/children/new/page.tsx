import { prisma } from "@/lib/prisma";
import { requireTrainer } from "@/lib/auth";
import { createChildAction } from "@/lib/actions/child-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ChildForm } from "@/components/trainer/ChildForm";

export default async function NewChildPage() {
  await requireTrainer();
  const groups = await prisma.group.findMany({
    orderBy: [{ level: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader
        title="Новый ребёнок"
        description="Добавьте ученика в базу школы"
      />
      <Card className="max-w-xl">
        <CardBody>
          <ChildForm
            action={createChildAction}
            groups={groups}
            submitLabel="Добавить"
          />
        </CardBody>
      </Card>
    </>
  );
}
