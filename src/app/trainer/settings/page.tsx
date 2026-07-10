import { requireTrainer } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ChangePasswordForm } from "@/components/trainer/ChangePasswordForm";

export default async function SettingsPage() {
  const trainer = await requireTrainer();

  return (
    <>
      <PageHeader title="Настройки" description={`Логин: ${trainer.username}`} />
      <Card className="max-w-md">
        <CardBody>
          <h2 className="mb-4 font-heading text-lg font-bold">Смена пароля</h2>
          <ChangePasswordForm />
        </CardBody>
      </Card>
    </>
  );
}
