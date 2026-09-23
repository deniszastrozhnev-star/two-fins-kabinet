import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2 });
const prisma = new PrismaClient({ adapter });

const child = await prisma.child.create({
  data: {
    lastName: "Загрузков",
    firstName: "Тест",
    parentPhone: "79990006001",
    status: "ACTIVE",
  },
});
console.log("CHILD_ID:" + child.id);
console.log("LASTNAME:" + child.lastName);
console.log("FIRSTNAME:" + child.firstName);
console.log("PHONE:" + child.parentPhone);

await prisma.$disconnect();
process.exit(0);
