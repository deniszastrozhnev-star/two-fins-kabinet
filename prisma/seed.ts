import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { normalizePhone } from "../src/lib/phone";

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

  const groupData = [
    {
      name: "Дельфинята-1",
      level: "NOVICE" as const,
      daysOfWeek: ["Пн", "Ср", "Пт"],
      time: "16:00–16:45",
      pool: "Бассейн №1",
    },
    {
      name: "Дельфинята-2",
      level: "NOVICE" as const,
      daysOfWeek: ["Вт", "Чт"],
      time: "16:00–16:45",
      pool: "Бассейн №1",
    },
    {
      name: "Акулята",
      level: "CONFIDENT" as const,
      daysOfWeek: ["Пн", "Ср", "Пт"],
      time: "17:00–17:45",
      pool: "Бассейн №1",
    },
    {
      name: "Спорт-1",
      level: "SPORT" as const,
      daysOfWeek: ["Вт", "Чт", "Сб"],
      time: "18:00–19:00",
      pool: "Бассейн №2",
    },
    {
      name: "Сборная",
      level: "TEAM" as const,
      daysOfWeek: ["Пн", "Вт", "Ср", "Чт", "Пт"],
      time: "19:00–20:30",
      pool: "Бассейн №2",
    },
  ];

  const groups: Record<string, string> = {};
  for (const g of groupData) {
    const existing = await prisma.group.findFirst({ where: { name: g.name } });
    const group =
      existing ?? (await prisma.group.create({ data: g }));
    groups[g.name] = group.id;
  }
  console.log(`Групп готово: ${Object.keys(groups).length}`);

  const childrenData = [
    {
      lastName: "Иванов",
      firstName: "Матвей",
      group: "Дельфинята-1",
      phone: "+7 900 111-11-11",
      paidInDays: 20,
    },
    {
      lastName: "Петрова",
      firstName: "Анна",
      group: "Дельфинята-1",
      phone: "+7 900 222-22-22",
      paidInDays: -3,
    },
    {
      lastName: "Сидоров",
      firstName: "Егор",
      group: "Акулята",
      phone: "+7 900 333-33-33",
      paidInDays: 4,
    },
    {
      lastName: "Кузнецова",
      firstName: "Мария",
      group: "Спорт-1",
      phone: "+7 900 444-44-44",
      paidInDays: 15,
    },
    {
      lastName: "Смирнов",
      firstName: "Данил",
      group: "Сборная",
      phone: "+7 900 555-55-55",
      paidInDays: null,
    },
  ];

  for (const c of childrenData) {
    const existing = await prisma.child.findFirst({
      where: { lastName: c.lastName, firstName: c.firstName },
    });
    if (existing) continue;
    const paidUntil =
      c.paidInDays === null
        ? null
        : new Date(Date.now() + c.paidInDays * 24 * 60 * 60 * 1000);
    await prisma.child.create({
      data: {
        lastName: c.lastName,
        firstName: c.firstName,
        groupId: groups[c.group],
        parentPhone: normalizePhone(c.phone),
        paidUntil,
      },
    });
  }
  console.log(`Детей готово: ${childrenData.length}`);

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
