// Разовое закрытие СТАРЫХ неподтверждённых чеков.
//
// Подтверждение чека (resolvedAt) появилось недавно, поэтому почти все чеки,
// загруженные раньше, числятся «ждущими проверки», хотя давно обработаны
// вручную (кнопкой «Оплачено» или правкой даты). Из-за них блок «Чеки на
// проверке» на странице «Дети» забит историей. Скрипт ставит
// resolvedAt = дате загрузки чека тем из них, что загружены ДО указанной даты.
// Оплаты он НЕ записывает и дату «оплачено до» у детей НЕ меняет.
//
// По умолчанию — только показ (ничего не меняется). Запись — с флагом --apply.
//
//   Показать:  DATABASE_URL="..." node scripts/close-stale-receipts.mjs --before=2026-09-25
//   Закрыть:   DATABASE_URL="..." node scripts/close-stale-receipts.mjs --before=2026-09-25 --apply
//
// Откат: update "PaymentReceipt" set "resolvedAt" = null where "resolvedAt" = "createdAt";
import pg from "pg";

// Время в базе хранится как UTC без указания зоны, а драйвер разбирает его в
// зоне машины, где запущен скрипт, — из-за этого границы окна «съезжали» бы на
// разницу с UTC. Фиксируем UTC, чтобы результат не зависел от компьютера.
process.env.TZ = "UTC";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const before = args.find((a) => a.startsWith("--before="))?.split("=")[1];
if (!before || !/^\d{4}-\d{2}-\d{2}$/.test(before)) {
  console.error("Укажите дату: --before=YYYY-MM-DD (чеки, загруженные раньше неё, будут закрыты)");
  process.exit(1);
}
const NSK_OFFSET_MS = 7 * 60 * 60 * 1000;
const beforeInstant = new Date(new Date(`${before}T00:00:00Z`).getTime() - NSK_OFFSET_MS);

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const summary = await client.query(
  `select count(*)::int as receipts, count(distinct "childId")::int as children,
          min("createdAt") as oldest, max("createdAt") as newest
     from "PaymentReceipt" where "resolvedAt" is null and "createdAt" < $1`,
  [beforeInstant],
);
const left = await client.query(
  `select count(*)::int as receipts, count(distinct "childId")::int as children
     from "PaymentReceipt" where "resolvedAt" is null and "createdAt" >= $1`,
  [beforeInstant],
);
const s = summary.rows[0];
console.log(`Неподтверждённых чеков, загруженных до ${before}: ${s.receipts} (детей: ${s.children})`);
if (s.receipts > 0) console.log(`  самый старый: ${s.oldest.toISOString()}, самый новый: ${s.newest.toISOString()}`);
console.log(`Останется на проверке (загружены ${before} и позже): ${left.rows[0].receipts} чеков, детей: ${left.rows[0].children}`);

if (!apply) {
  console.log("\nРЕЖИМ ПОКАЗА: в базе ничего не изменено. Для закрытия добавьте --apply.");
} else {
  const r = await client.query(
    `update "PaymentReceipt" set "resolvedAt" = "createdAt" where "resolvedAt" is null and "createdAt" < $1`,
    [beforeInstant],
  );
  console.log(`\nЗАКРЫТО чеков: ${r.rowCount}`);
}
await client.end();
