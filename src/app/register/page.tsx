import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { RegisterChildForm } from "@/components/register/RegisterChildForm";

// Список групп (вместимость/цены) должен быть всегда актуальным, а не запечённым
// в статическую страницу при сборке.
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const groups = await prisma.group.findMany({
    select: {
      id: true,
      name: true,
      level: true,
      daysOfWeek: true,
      time: true,
      pool: true,
      pricePerMonth: true,
    },
    orderBy: [{ level: "asc" }, { name: "asc" }],
  });

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-brand-cyan">
            Онлайн-запись в группу
          </h1>
          <p className="mt-1 text-sm text-brand-text/60">
            Two Fins (Две Ласты)
          </p>
        </div>
        <Card>
          <CardBody>
            <RegisterChildForm groups={groups} />
          </CardBody>
        </Card>
        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-brand-text/60 hover:text-brand-text">
            ← На главную
          </Link>
        </p>
      </div>
    </main>
  );
}
