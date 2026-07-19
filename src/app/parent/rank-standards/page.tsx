import { requireParentChild } from "@/lib/auth";
import { getRankStandardsTable } from "@/lib/rankStandards";
import { PageHeader } from "@/components/ui/PageHeader";
import { RankStandardsTable } from "@/components/shared/RankStandardsTable";

export default async function ParentRankStandardsPage() {
  await requireParentChild();
  const standards = await getRankStandardsTable();

  return (
    <>
      <PageHeader
        title="Таблица разрядов"
        description="Нормативы ЕВСК 2023-24 по плаванию в ластах"
      />
      <RankStandardsTable standards={standards} />
    </>
  );
}
