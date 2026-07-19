import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Card, CardBody } from "@/components/ui/Card";
import { ParentLoginForm } from "@/components/auth/ParentLoginForm";

export default async function ParentLoginPage() {
  const session = await getSession();
  if (session?.role === "parent") redirect("/parent");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-brand-violet">
            Вход для родителей
          </h1>
          <p className="mt-1 text-sm text-brand-text/60">
            Two Fins (Две Ласты)
          </p>
        </div>
        <Card>
          <CardBody>
            <ParentLoginForm />
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
