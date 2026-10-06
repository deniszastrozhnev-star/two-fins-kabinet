import { requireTrainer } from "@/lib/auth";
import { getAppSettings } from "@/lib/appSettings";
import { countActiveSubscriberFamilies } from "@/lib/push";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ChangePasswordForm } from "@/components/trainer/ChangePasswordForm";
import { RunDailyRemindersButton } from "@/components/trainer/RunDailyRemindersButton";
import { BirthdayGreetingsToggle } from "@/components/trainer/BirthdayGreetingsToggle";
import { BroadcastPushForm } from "@/components/trainer/BroadcastPushForm";

export default async function SettingsPage() {
  const trainer = await requireTrainer();
  const appSettings = trainer.role === "HEAD" ? await getAppSettings() : null;
  const subscriberCount = trainer.role === "HEAD" ? await countActiveSubscriberFamilies() : 0;

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
            <h2 className="mb-2 font-heading text-lg font-bold">Суточные напоминания</h2>
            <p className="mb-4 text-sm text-brand-text/60">
              Оплата, справки и дни рождения проверяются автоматически раз в
              сутки в 10:00 по Новосибирску. Кнопка ниже запускает ту же
              проверку вручную — полезно, если нужно подтвердить настройку
              или сервер пропустил суточный запуск. Повторный запуск
              безопасен: уже отправленные напоминания не дублируются.
            </p>
            <RunDailyRemindersButton />
            <div className="mt-5 border-t border-white/10 pt-4">
              <BirthdayGreetingsToggle enabled={appSettings?.sendBirthdayGreetings ?? false} />
            </div>
          </CardBody>
        </Card>
      )}

      {trainer.role === "HEAD" && (
        <Card className="mt-6 max-w-md">
          <CardBody>
            <h2 className="mb-2 font-heading text-lg font-bold">Рассылка push всем родителям</h2>
            <p className="mb-4 text-sm text-brand-text/60">
              Произвольное уведомление, без привязки к оплате/справке/дню
              рождения — например, объявление или напоминание про сборы.
              Отправляется всем, у кого сейчас включены push-уведомления.
            </p>
            <BroadcastPushForm subscriberCount={subscriberCount} />
          </CardBody>
        </Card>
      )}
    </>
  );
}
