import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Card, CardBody } from "@/components/ui/Card";
import { TrainerLoginForm } from "@/components/auth/TrainerLoginForm";

export default async function TrainerLoginPage() {
  const session = await getSession();
  if (session?.role === "trainer") redirect("/trainer");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-brand-cyan">
            Вход для тренера
          </h1>
          <p className="mt-1 text-sm text-brand-text/60">
            Two Fins (Две Ласты)
          </p>
        </div>
        <Card>
          <CardBody>
            <TrainerLoginForm />
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
