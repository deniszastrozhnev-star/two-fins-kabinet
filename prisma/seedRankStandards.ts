import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { AthleteRank, FinDiscipline, TimingType } from "@prisma/client";
import { parseSwimTime } from "@/lib/swimTime";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type Row = {
  discipline: FinDiscipline;
  timing: TimingType;
  values: (string | null)[];
};

// Порядок колонок-разрядов ровно как в таблице ЕВСК пользователя: МСМК/МС/КМС/I/II/III.
const ADULT_RANKS: AthleteRank[] = ["MSMK", "MS", "KMS", "ADULT_1", "ADULT_2", "ADULT_3"];
// I юн/II юн/III юн.
const YOUTH_RANKS: AthleteRank[] = ["YOUTH_1", "YOUTH_2", "YOUTH_3"];

const ADULT_ROWS: Row[] = [
  { discipline: "APNEA50", timing: "MANUAL", values: [null, null, "16.00/18.00", "17.00/19.10", "18.50/20.90", "20.00/22.70"] },
  { discipline: "APNEA50", timing: "AUTO", values: ["14.70/16.70", "15.40/17.30", "16.20/18.20", "17.20/19.30", "18.70/21.10", "20.20/22.90"] },

  { discipline: "M50", timing: "MANUAL", values: [null, null, "17.30/19.50", "18.30/20.80", "19.90/22.70", "21.60/24.50"] },
  { discipline: "M50", timing: "AUTO", values: ["15.80/18.00", "16.70/18.70", "17.50/19.70", "18.50/21.00", "20.10/22.90", "21.80/24.70"] },

  { discipline: "M100", timing: "MANUAL", values: [null, null, "39.00/43.50", "41.80/46.50", "45.70/50.30", "49.50/54.50"] },
  { discipline: "M100", timing: "AUTO", values: ["35.50/39.90", "37.30/40.90", "39.20/43.70", "42.00/46.70", "45.70/50.50", "49.70/54.70"] },

  { discipline: "M200", timing: "MANUAL", values: [null, null, "1:30.50/1:40.30", "1:37.00/1:46.50", "1:46.00/1:55.00", "1:54.60/2:05.00"] },
  { discipline: "M200", timing: "AUTO", values: ["1:22.50/1:30.70", "1:26.00/1:33.00", "1:30.70/1:40.50", "1:37.20/1:46.70", "1:46.20/1:55.20", "1:54.80/2:05.20"] },

  { discipline: "M400", timing: "MANUAL", values: [null, null, "3:20.50/3:37.00", "3:35.50/3:53.00", "3:52.50/4:10.00", "4:11.60/4:30.00"] },
  { discipline: "M400", timing: "AUTO", values: ["3:03.00/3:18.00", "3:12.50/3:25.60", "3:20.20/3:37.20", "3:35.70/3:53.20", "3:52.70/4:10.20", "4:11.80/4:30.20"] },

  { discipline: "M800", timing: "MANUAL", values: [null, null, "7:13.50/7:46.50", "7:34.50/8:18.30", "8:23.00/8:59.80", "9:03.00/9:40.50"] },
  { discipline: "M800", timing: "AUTO", values: ["6:33.00/7:03.80", "6:50.00/7:20.70", "7:13.70/7:46.70", "7:34.70/8:18.50", "8:23.20/9:00.00", "9:03.20/9:40.70"] },

  { discipline: "M1500", timing: "MANUAL", values: [null, null, "13:55.80/14:56.50", "14:50.30/15:56.50", "16:10.00/17:20.00", "17:29.80/18:44.80"] },
  { discipline: "M1500", timing: "AUTO", values: ["12:40.00/13:39.00", "13:20.00/14:15.00", "13:56.00/14:56.20", "14:50.50/15:56.70", "16:10.20/17:20.20", "17:30.00/18:45.00"] },

  { discipline: "UNDERWATER100", timing: "MANUAL", values: [null, null, "36.00/39.50", "39.70/42.50", "42.00/46.00", "45.70/49.80"] },
  { discipline: "UNDERWATER100", timing: "AUTO", values: ["33.00/36.00", "34.50/37.90", "36.20/39.70", "39.90/42.70", "42.20/46.20", "45.90/50.00"] },

  { discipline: "UNDERWATER400", timing: "MANUAL", values: [null, null, "3:07.30/3:22.80", "3:20.80/3:37.80", "3:37.80/3:55.50", "3:56.30/4:13.60"] },
  { discipline: "UNDERWATER400", timing: "AUTO", values: ["2:50.00/3:05.00", "2:59.00/3:14.60", "3:07.50/3:23.00", "3:21.00/3:38.00", "3:38.00/3:55.70", "3:56.50/4:13.80"] },

  { discipline: "CLASSIC50", timing: "MANUAL", values: [null, null, "21.00/24.30", "22.70/26.00", "24.50/27.50", "26.10/30.10"] },
  { discipline: "CLASSIC50", timing: "AUTO", values: ["19.30/22.00", "20.20/23.20", "21.20/24.50", "22.90/26.20", "24.70/27.70", "26.30/30.30"] },

  { discipline: "CLASSIC100", timing: "MANUAL", values: [null, null, "46.90/53.00", "50.50/56.80", "55.50/1:01.40", "1:00.00/1:07.20"] },
  { discipline: "CLASSIC100", timing: "AUTO", values: ["43.00/47.90", "44.40/50.00", "47.10/53.20", "50.70/57.00", "55.70/1:01.60", "1:00.20/1:07.40"] },

  { discipline: "CLASSIC200", timing: "MANUAL", values: [null, null, "1:44.80/1:57.00", "1:53.50/2:06.50", "2:02.50/2:15.50", "2:12.60/2:26.80"] },
  { discipline: "CLASSIC200", timing: "AUTO", values: ["1:36.40/1:47.00", "1:40.50/1:51.00", "1:45.20/1:57.20", "1:53.70/2:06.70", "2:02.70/2:15.70", "2:12.80/2:27.00"] },

  { discipline: "CLASSIC400", timing: "MANUAL", values: [null, null, "3:53.00/4:12.60", "4:07.00/4:28.00", "4:25.00/4:46.50", "4:45.00/5:06.00"] },
  { discipline: "CLASSIC400", timing: "AUTO", values: ["3:32.40/3:48.90", "3:42.50/3:59.50", "3:53.20/4:12.80", "4:07.20/4:28.20", "4:25.20/4:46.70", "4:45.20/5:06.20"] },
];

const YOUTH_ROWS: Row[] = [
  { discipline: "M50", timing: "MANUAL", values: ["23.80/26.80", "26.00/29.30", "28.00/32.00"] },
  { discipline: "M50", timing: "AUTO", values: ["24.00/27.00", "26.20/29.50", "28.20/32.20"] },

  { discipline: "M100", timing: "MANUAL", values: ["54.10/59.50", "59.00/1:04.50", "1:04.00/1:09.50"] },
  { discipline: "M100", timing: "AUTO", values: ["54.30/59.70", "59.20/1:04.70", "1:04.20/1:09.70"] },

  { discipline: "M200", timing: "MANUAL", values: ["2:06.50/2:18.80", "2:18.30/2:29.80", "2:29.00/2:39.80"] },
  { discipline: "M200", timing: "AUTO", values: ["2:06.70/2:19.00", "2:18.50/2:30.00", "2:29.20/2:40.20"] },

  { discipline: "M400", timing: "MANUAL", values: ["4:39.80/4:57.00", "5:05.50/5:26.00", "5:30.00/5:50.00"] },
  { discipline: "M400", timing: "AUTO", values: ["4:40.00/4:57.20", "5:05.70/5:26.20", "5:30.20/5:50.20"] },

  { discipline: "M800", timing: "MANUAL", values: ["9:50.20/10:30.50", "10:51.80/11:37.00", "11:45.00/12:29.80"] },
  { discipline: "M800", timing: "AUTO", values: ["9:50.40/10:30.70", "10:52.00/11:37.20", "11:45.20/12:30.00"] },

  { discipline: "UNDERWATER100", timing: "MANUAL", values: ["50.00/54.50", "54.70/59.70", "59.00/1:04.70"] },
  { discipline: "UNDERWATER100", timing: "AUTO", values: ["50.20/54.70", "54.90/59.90", "59.20/1:04.90"] },

  { discipline: "CLASSIC50", timing: "MANUAL", values: ["29.50/33.00", "31.90/36.00", "35.00/39.00"] },
  { discipline: "CLASSIC50", timing: "AUTO", values: ["29.70/33.20", "32.10/36.20", "35.20/39.20"] },

  { discipline: "CLASSIC100", timing: "MANUAL", values: ["1:05.30/1:12.80", "1:11.30/1:18.80", "1:17.80/1:25.00"] },
  { discipline: "CLASSIC100", timing: "AUTO", values: ["1:05.50/1:13.00", "1:11.50/1:19.00", "1:18.00/1:25.20"] },

  { discipline: "CLASSIC200", timing: "MANUAL", values: ["2:25.50/2:42.00", "2:40.00/2:56.00", "2:50.00/3:10.00"] },
  { discipline: "CLASSIC200", timing: "AUTO", values: ["2:25.70/2:42.20", "2:40.20/2:56.20", "2:50.20/3:10.20"] },

  { discipline: "CLASSIC400", timing: "MANUAL", values: ["5:07.50/5:30.00", "5:30.50/5:58.00", "5:58.00/6:26.00"] },
  { discipline: "CLASSIC400", timing: "AUTO", values: ["5:07.70/5:30.20", "5:30.70/5:58.20", "5:58.20/6:26.20"] },
];

async function seedRows(rows: Row[], ranks: AthleteRank[]) {
  let count = 0;
  for (const row of rows) {
    for (let i = 0; i < ranks.length; i++) {
      const cell = row.values[i];
      if (!cell) continue;
      const rank = ranks[i];
      const [maleRaw, femaleRaw] = cell.split("/");

      const maleCentis = parseSwimTime(maleRaw);
      const femaleCentis = parseSwimTime(femaleRaw);
      if (maleCentis === null || femaleCentis === null) {
        throw new Error(
          `Не удалось разобрать время: ${row.discipline}/${row.timing}/${rank} = "${cell}"`,
        );
      }

      await prisma.rankStandard.upsert({
        where: {
          discipline_timing_gender_rank: {
            discipline: row.discipline,
            timing: row.timing,
            gender: "MALE",
            rank,
          },
        },
        update: { centiseconds: maleCentis },
        create: {
          discipline: row.discipline,
          timing: row.timing,
          gender: "MALE",
          rank,
          centiseconds: maleCentis,
        },
      });
      await prisma.rankStandard.upsert({
        where: {
          discipline_timing_gender_rank: {
            discipline: row.discipline,
            timing: row.timing,
            gender: "FEMALE",
            rank,
          },
        },
        update: { centiseconds: femaleCentis },
        create: {
          discipline: row.discipline,
          timing: row.timing,
          gender: "FEMALE",
          rank,
          centiseconds: femaleCentis,
        },
      });
      count += 2;
    }
  }
  return count;
}

async function main() {
  const adultCount = await seedRows(ADULT_ROWS, ADULT_RANKS);
  const youthCount = await seedRows(YOUTH_ROWS, YOUTH_RANKS);
  const total = await prisma.rankStandard.count();
  console.log(`Взрослые нормативы: ${adultCount} значений`);
  console.log(`Юношеские нормативы: ${youthCount} значений`);
  console.log(`Всего строк RankStandard в базе: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
