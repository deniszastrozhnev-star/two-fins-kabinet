import { requireParentChild } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { InstallInstructions } from "@/components/InstallInstructions";

export default async function ParentInstallPage() {
  await requireParentChild();

  return (
    <>
      <PageHeader
        title="Установка на телефон"
        description="Добавьте Two Fins на экран «Домой» — открывается как обычное приложение"
      />
      <InstallInstructions />
    </>
  );
}
