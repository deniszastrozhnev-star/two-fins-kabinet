import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.env.TRAINER_USERNAME ?? "trainer";
  const password = process.env.TRAINER_INITIAL_PASSWORD ?? "change-me";
  const passwordHash = await hash(password, 12);

  await prisma.trainer.upsert({
    where: { username },
    update: { role: "HEAD" },
    create: { username, passwordHash, role: "HEAD" },
  });
  console.log(`Главный тренер "${username}" готов.`);

  // Название группы = само сочетание дня(-ей) недели и времени
  const groupData = [
    {
      name: "Пн, Ср 20:30-21:30",
      level: "CONFIDENT" as const,
      daysOfWeek: ["Пн", "Ср"],
      time: "20:30-21:30",
      pool: "Лазурный",
      pricePerMonth: 6800,
    },
    {
      name: "Вт, Чт 20:30-21:30",
      level: "CONFIDENT" as const,
      daysOfWeek: ["Вт", "Чт"],
      time: "20:30-21:30",
      pool: "Лазурный",
      pricePerMonth: 6800,
    },
    {
      name: "Сб 11:00-12:00",
      level: "NOVICE" as const,
      daysOfWeek: ["Сб"],
      time: "11:00-12:00",
      pool: "Лазурный (малая чаша, 6-8 лет)",
      pricePerMonth: 3600,
    },
    {
      name: "Сб 12:00-13:00",
      level: "CONFIDENT" as const,
      daysOfWeek: ["Сб"],
      time: "12:00-13:00",
      pool: "Лазурный",
      pricePerMonth: 3600,
    },
    {
      name: "Сб, Вс 12:50-13:50",
      level: "CONFIDENT" as const,
      daysOfWeek: ["Сб", "Вс"],
      time: "12:50-13:50",
      pool: "Лазурный",
      pricePerMonth: 6800,
    },
    {
      name: "Вс 10:30-11:30",
      level: "NOVICE" as const,
      daysOfWeek: ["Вс"],
      time: "10:30-11:30",
      pool: "Лазурный (малая чаша, 6-8 лет)",
      pricePerMonth: 3600,
    },
    {
      name: "Вс 12:00-13:00",
      level: "CONFIDENT" as const,
      daysOfWeek: ["Вс"],
      time: "12:00-13:00",
      pool: "Лазурный",
      pricePerMonth: 3600,
    },
    {
      name: "Пн, Пт 19:45-20:45 (Олимпик)",
      level: "CONFIDENT" as const,
      daysOfWeek: ["Пн", "Пт"],
      time: "19:45-20:45",
      pool: "Олимпик",
      pricePerMonth: 6200,
    },
    {
      name: "Вт, Чт 19:45-20:45 (Олимпик)",
      level: "CONFIDENT" as const,
      daysOfWeek: ["Вт", "Чт"],
      time: "19:45-20:45",
      pool: "Олимпик",
      pricePerMonth: 6200,
    },
  ];

  const groups: Record<string, string> = {};
  for (const g of groupData) {
    const existing = await prisma.group.findFirst({ where: { name: g.name } });
    const group = existing
      ? await prisma.group.update({
          where: { id: existing.id },
          data: { pricePerMonth: g.pricePerMonth },
        })
      : await prisma.group.create({ data: g });
    groups[g.name] = group.id;
  }
  console.log(`Групп готово: ${Object.keys(groups).length}`);

  const eventExists = await prisma.event.findFirst({
    where: { title: "Открытие сезона" },
  });
  if (!eventExists) {
    await prisma.event.create({
      data: {
        title: "Открытие сезона",
        type: "NEWS",
        dateStart: new Date(),
        location: "Бассейн №1",
        description: "Начинаем новый сезон тренировок! Ждём всех на воде.",
        suitableFor: "Все уровни",
      },
    });
    await prisma.event.create({
      data: {
        title: "Летний сбор на море",
        type: "GATHERING",
        dateStart: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        dateEnd: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000),
        location: "Анапа",
        description: "Недельный тренировочный сбор на открытой воде.",
        suitableFor: "8+ лет, Уверенный пловец и выше",
      },
    });
    await prisma.event.create({
      data: {
        title: "Городские соревнования",
        type: "COMPETITION",
        dateStart: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        location: "Дворец спорта",
        description: "Открытые городские соревнования по плаванию среди детей.",
        suitableFor: "Спортивный уровень, Сборная школы",
      },
    });
    console.log("События созданы.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
