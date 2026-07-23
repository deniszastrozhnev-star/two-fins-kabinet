import { Card, CardBody } from "@/components/ui/Card";

const ANDROID_STEPS = [
  "Откройте сайт в приложении Chrome (не через встроенный браузер мессенджера)",
  "Нажмите на три точки (⋮) в правом верхнем углу",
  "Выберите «Добавить на главный экран»",
  "Подтвердите — на рабочем столе появится значок",
];

const IOS_STEPS = [
  "Откройте сайт в Safari (не в Chrome и не во встроенном браузере мессенджера)",
  "Нажмите на значок «Поделиться» (квадрат со стрелкой вверх) внизу экрана",
  "Прокрутите вниз и выберите «На экран «Домой»»",
  "Нажмите «Добавить» — на рабочем столе появится значок",
];

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-col gap-2 text-sm text-brand-text/70">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-brand-text/80">
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function InstallInstructions() {
  return (
    <Card className="text-left">
      <CardBody>
        <h2 className="font-heading text-base font-bold">Установить как приложение</h2>
        <p className="mt-1 text-sm text-brand-text/60">
          Добавьте Two Fins на экран «Домой» — будет открываться как обычное приложение
        </p>

        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-brand-cyan">Android (Chrome)</p>
            <StepList steps={ANDROID_STEPS} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-brand-violet">iPhone (Safari)</p>
            <StepList steps={IOS_STEPS} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
