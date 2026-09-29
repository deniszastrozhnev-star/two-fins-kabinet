import { InstallInstructions } from "@/components/InstallInstructions";

/** Экран после отправки заявки на онлайн-запись — сжатая инструкция "что
 * дальше", без перегруза текстом. Про push-уведомления — только объяснение,
 * включить их можно только после входа (кнопка внутри кабинета сама требует
 * авторизованную сессию), поэтому здесь просто говорим "после входа". */
export function RegistrationSuccess({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">{message}</p>

      <div>
        <h2 className="mb-3 font-heading text-lg font-bold">Что дальше</h2>
        <ol className="flex flex-col gap-3 text-sm text-brand-text/80">
          <li className="flex gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
              1
            </span>
            <span>
              Войдите в личный кабинет родителя на{" "}
              <a href="/parent-login" className="text-brand-cyan hover:underline">
                странице входа
              </a>{" "}
              — фамилия и имя ребёнка + указанный телефон.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
              2
            </span>
            <span>
              Загрузите в кабинете подписанный договор и справку от педиатра —
              без них тренер не сможет допустить ребёнка к занятиям.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
              3
            </span>
            <span>
              После входа разрешите уведомления в кабинете — узнаете первыми
              об оплате и новостях школы.
            </span>
          </li>
        </ol>
      </div>

      <details className="group rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <summary className="cursor-pointer list-none text-sm font-medium text-brand-cyan">
          Как добавить сайт на экран «Домой» →
        </summary>
        <div className="mt-3">
          <InstallInstructions />
        </div>
      </details>

      <a
        href="/register"
        className="text-sm text-brand-text/60 underline decoration-dotted underline-offset-2 hover:text-brand-cyan"
      >
        Записать ещё одного ребёнка
      </a>
    </div>
  );
}
