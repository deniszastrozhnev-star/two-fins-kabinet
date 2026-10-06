// Разовая дозапись оплат, подтверждённых ДО запуска учёта сумм (lib/payments.ts).
//
// Откуда берём дату: PaymentReceipt.resolvedAt — момент, когда тренер
// подтвердил чек. Это единственное место, где дата подтверждения сохранилась;
// оплаты по кнопке «Оплачено» и по ручной правке даты раньше нигде не
// фиксировали момент подтверждения — их дату определить нельзя.
// Сумма — тариф ребёнка СЕЙЧАС (группа + доп. занятие), а не фактический
// платёж: скидки и частичные оплаты не видны. Такие записи помечаются
// source = BACKFILL_TARIFF и в панели идут отдельной строкой.
//
// По умолчанию — только показ того, что будет записано (ничего не меняется).
// Запись в базу — только с флагом --apply.
//
//   Показать:  DATABASE_URL="..." node scripts/backfill-payment-confirmations.mjs
//   Записать:  DATABASE_URL="..." node scripts/backfill-payment-confirmations.mjs --apply
//
// Параметры: --from=YYYY-MM-DD (по умолчанию 2026-09-25, начало периода),
//            --until=YYYY-MM-DD (по умолчанию — момент первой записи учёта,
//            чтобы не дублировать то, что уже записано автоматически).
import crypto from "node:crypto";
import pg from "pg";
import { computeCombinedPrice } from "../src/lib/registrationTariffs.ts";

const NSK_OFFSET_MS = 7 * 60 * 60 * 1000;
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const argValue = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const fromDate = argValue("from") ?? "2026-09-25";
const fromInstant = new Date(new Date(`${fromDate}T00:00:00Z`).getTime() - NSK_OFFSET_MS);

let untilInstant;
if (argValue("until")) {
  untilInstant = new Date(new Date(`${argValue("until")}T00:00:00Z`).getTime() - NSK_OFFSET_MS);
} else {
  const first = await client.query(
    `select min("paidAt") as first from "PaymentConfirmation" where source::text <> 'BACKFILL_TARIFF'`,
  );
  untilInstant = first.rows[0].first ?? new Date();
}

const receipts = await client.query(
  `select r.id as "receiptId", r."resolvedAt", c.id as "childId", c."lastName", c."firstName", c."paidUntil",
          g.pool, g."pricePerMonth", g."daysOfWeek",
          eg.pool as "xPool", eg."pricePerMonth" as "xPrice", eg."daysOfWeek" as "xDays"
     from "PaymentReceipt" r
     join "Child" c on c.id = r."childId"
     left join "Group" g on g.id = c."groupId"
     left join "ExtraSessionEntitlement" e on e."childId" = c.id
     left join "Group" eg on eg.id = e."groupId"
    where r."resolvedAt" >= $1 and r."resolvedAt" < $2
    order by r."resolvedAt"`,
  [fromInstant, untilInstant],
);

// «Оплачено до» для дозаписи — конец месяца даты подтверждения (так делает
// кнопка «Продлить по тарифу»); для чеков, подтверждённых ручной датой, точный
// срок неизвестен — это лишь ключ, чтобы не задвоить оплату.
const endOfMonthNsk = (instant) => {
  const nsk = new Date(instant.getTime() + NSK_OFFSET_MS);
  return new Date(Date.UTC(nsk.getUTCFullYear(), nsk.getUTCMonth() + 1, 0));
};
const day = (d) => d.toISOString().slice(0, 10);

const plan = new Map(); // ключ "childId|paidUntil" — один платёж за срок
let skippedExisting = 0;
for (const r of receipts.rows) {
  const paidUntil = endOfMonthNsk(r.resolvedAt);
  const key = `${r.childId}|${day(paidUntil)}`;
  if (plan.has(key)) continue;
  const exists = await client.query(
    `select 1 from "PaymentConfirmation" where "childId" = $1 and "paidUntil" = $2`,
    [r.childId, paidUntil],
  );
  if (exists.rowCount > 0) {
    skippedExisting += 1;
    continue;
  }
  const base = r.pool ? { pool: r.pool, pricePerMonth: r.pricePerMonth, daysOfWeek: r.daysOfWeek } : null;
  const extra = r.xPool ? { pool: r.xPool, pricePerMonth: r.xPrice, daysOfWeek: r.xDays } : null;
  const tariff = base ? computeCombinedPrice(base, extra) : null;
  plan.set(key, {
    childId: r.childId,
    name: `${r.lastName} ${r.firstName}`,
    paidAt: r.resolvedAt,
    paidUntil,
    amountRub: tariff && tariff > 0 ? tariff : null,
  });
}

const rows = [...plan.values()];
const withAmount = rows.filter((r) => r.amountRub != null);
console.log(`Период: ${fromDate} … ${untilInstant.toISOString()} (подтверждения чеков)`);
console.log(`Подтверждённых чеков в периоде: ${receipts.rowCount}`);
console.log(`Уже есть запись об оплате (пропущено): ${skippedExisting}`);
console.log(`Будет записано оплат: ${rows.length}`);
console.log(`  с суммой по тарифу: ${withAmount.length} на ${withAmount.reduce((s, r) => s + r.amountRub, 0)}₽`);
console.log(`  без суммы (у ребёнка нет группы/тарифа): ${rows.length - withAmount.length}`);
for (const r of rows) {
  console.log(
    `  ${day(r.paidAt)}  ${r.name}  срок до ${day(r.paidUntil)}  ${r.amountRub != null ? r.amountRub + "₽ (по тарифу)" : "без суммы"}`,
  );
}

const withoutDate = await client.query(
  `select count(*)::int as n from "Child" c
    where c."paidUntil" >= $1
      and not exists (select 1 from "PaymentReceipt" r where r."childId" = c.id and r."resolvedAt" >= $2 and r."resolvedAt" < $3)`,
  [new Date(`${fromDate}T00:00:00Z`), fromInstant, untilInstant],
);
console.log(
  `Дети с «оплачено до» не раньше ${fromDate}, у которых нет подтверждённого чека в периоде: ${withoutDate.rows[0].n} ` +
    `(оплата по кнопке «Оплачено»/ручной дате — дату подтверждения определить нельзя, дозапись их не касается)`,
);

if (!apply) {
  console.log("\nРЕЖИМ ПОКАЗА: в базу ничего не записано. Для записи добавьте --apply.");
} else {
  await client.query("begin");
  try {
    for (const r of rows) {
      await client.query(
        `insert into "PaymentConfirmation" (id, "childId", "amountRub", "paidUntil", source, "paidAt")
         values ($1, $2, $3, $4, 'BACKFILL_TARIFF', $5)
         on conflict ("childId", "paidUntil") do nothing`,
        [crypto.randomUUID(), r.childId, r.amountRub, r.paidUntil, r.paidAt],
      );
    }
    await client.query("commit");
    console.log(`\nЗАПИСАНО оплат: ${rows.length}`);
  } catch (err) {
    await client.query("rollback");
    throw err;
  }
}
await client.end();
