import { requireTrainer } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ChangePasswordForm } from "@/components/trainer/ChangePasswordForm";
import { RunPaymentRemindersButton } from "@/components/trainer/RunPaymentRemindersButton";

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

      {trainer.role === "HEAD" && (
        <Card className="mt-6 max-w-md">
          <CardBody>
            <h2 className="mb-2 font-heading text-lg font-bold">Напоминания об оплате</h2>
            <p className="mb-4 text-sm text-brand-text/60">
              Автоматически проверяются раз в сутки в 10:00 по Новосибирску. Кнопка
              ниже запускает ту же проверку вручную — полезно, если нужно
              подтвердить настройку или сервер пропустил суточный запуск.
              Повторный запуск безопасен: уже отправленные напоминания не
              дублируются.
            </p>
            <RunPaymentRemindersButton />
          </CardBody>
        </Card>
      )}
    </>
  );
}
