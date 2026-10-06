import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// max: раньше было 5 — расчёт под Vercel serverless, где каждый холодный
// инстанс функции держит свой отдельный Pool, так что даже маленький max
// умножается на N параллельных инстансов. На Timeweb Cloud приложение — один
// долгоживущий Node-процесс (см. instrumentation.ts), а не десятки serverless-
// инстансов, поэтому 5 соединений на ВЕСЬ сайт разом — это узкое место: при
// нескольких одновременных пользователях запросы к БД выстраиваются в очередь
// на свободное соединение из пула, что ощущается как случайные подвисания и
// неудачные загрузки страниц, особенно на медленном мобильном соединении.
// У Postgres на Timeweb max_connections = 200 — большой запас, подняли до 20.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 20 });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
