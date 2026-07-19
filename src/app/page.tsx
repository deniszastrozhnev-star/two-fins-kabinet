import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Card, CardBody } from "@/components/ui/Card";

export default async function HomePage() {
  // PWA открывается со значка "На домой" всегда с этого адреса (start_url в
  // манифесте) — без этой проверки уже вошедший пользователь при каждом
  // запуске видел бы стартовый экран выбора роли вместо своего кабинета,
  // даже если кука сессии ещё вполне действительна.
  const session = await getSession();
  if (session?.role === "trainer") redirect("/trainer");
  if (session?.role === "parent") redirect("/parent");
  if (session?.role === "athlete") redirect("/athlete");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="font-heading text-3xl font-bold text-brand-cyan sm:text-4xl">
          Two Fins (Две Ласты)
        </h1>
        <p className="mt-2 text-brand-text/70">Личный кабинет школы плавания</p>

        <div className="mt-10 flex flex-col gap-4">
          <Link href="/login">
            <Card className="text-left transition hover:border-brand-cyan/50">
              <CardBody className="flex items-center justify-between">
                <div>
                  <p className="font-heading text-lg font-bold">Я тренер</p>
                  <p className="mt-1 text-sm text-brand-text/60">
                    Вход по логину и паролю
                  </p>
                </div>
                <span aria-hidden className="text-xl text-brand-cyan">
                  →
                </span>
              </CardBody>
            </Card>
          </Link>

          <Link href="/parent-login">
            <Card className="text-left transition hover:border-brand-violet/50">
              <CardBody className="flex items-center justify-between">
                <div>
                  <p className="font-heading text-lg font-bold">Я родитель</p>
                  <p className="mt-1 text-sm text-brand-text/60">
                    Вход по имени ребёнка и телефону
                  </p>
                </div>
                <span aria-hidden className="text-xl text-brand-violet">
                  →
                </span>
              </CardBody>
            </Card>
          </Link>

          <Link href="/athlete-login">
            <Card className="text-left transition hover:border-brand-cyan/50">
              <CardBody className="flex items-center justify-between">
                <div>
                  <p className="font-heading text-lg font-bold">Я спортсмен</p>
                  <p className="mt-1 text-sm text-brand-text/60">
                    Дневник тренировок и рейтинг
                  </p>
                </div>
                <span aria-hidden className="text-xl text-brand-cyan">
                  →
                </span>
              </CardBody>
            </Card>
          </Link>
        </div>

        <div className="mt-6 border-t border-white/10 pt-6">
          <Link href="/register">
            <Card className="text-left transition hover:border-brand-violet/50">
              <CardBody className="flex items-center justify-between">
                <div>
                  <p className="font-heading text-lg font-bold">Записаться в группу</p>
                  <p className="mt-1 text-sm text-brand-text/60">
                    Онлайн-запись без входа в кабинет
                  </p>
                </div>
                <span aria-hidden className="text-xl text-brand-violet">
                  →
                </span>
              </CardBody>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
