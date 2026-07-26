import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// max: node-postgres по умолчанию держит до 10 соединений на один Pool — на
// Vercel serverless каждый холодный инстанс функции создаёт свой отдельный Pool,
// так что при N параллельных инстансах это до N×10 соединений в сторону Neon
// одновременно. Neon-пуллер (PgBouncer) сам мультиплексирует много клиентов на
// малое число серверных соединений, но локальный Pool стоит держать маленьким,
// чтобы не забивать его лишними простаивающими соединениями — 5 с запасом
// покрывает самый широкий Promise.all в проекте (getAthleteLeaderboard, 7
// запросов, из которых часть — Promise.resolve([]) без реального соединения).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 5 });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
