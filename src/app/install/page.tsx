import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { InstallInstructions } from "@/components/InstallInstructions";

// Публичная страница — единственное место с инструкцией установки. Ссылаются
// сюда и карточка на главной (до входа), и пункт нава во всех трёх кабинетах
// (после входа) — вместо трёх копий текста в каждом кабинете отдельно.
export default function InstallPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link href="/" className="mb-4 inline-block text-sm text-brand-text/60 hover:text-brand-text">
        ← На главную
      </Link>
      <PageHeader
        title="Установка на телефон"
        description="Добавьте Two Fins на экран «Домой» — открывается как обычное приложение"
      />
      <InstallInstructions />
    </div>
  );
}
