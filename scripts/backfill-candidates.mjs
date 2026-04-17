// Разовый бэкфилл: создаёт CandidateProfile для всех CONFIRMED/COMPLETED заявок,
// у которых профиль ещё не создан.
// Запуск: node --env-file=.env scripts/backfill-candidates.mjs

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("DATABASE_URL не задан");
  process.exit(1);
}

const url = new URL(rawUrl);
url.searchParams.delete("schema");

const pool = new pg.Pool({ connectionString: url.toString() });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const apps = await prisma.application.findMany({
    where: {
      status: { in: ["CONFIRMED", "COMPLETED"] },
      candidateProfile: null,
    },
    select: { id: true },
  });

  console.log(`Найдено заявок без профиля: ${apps.length}`);

  let created = 0;
  for (const app of apps) {
    await prisma.candidateProfile.create({
      data: { applicationId: app.id },
    });
    created++;
    console.log(`  ✓ CandidateProfile создан для заявки #${app.id}`);
  }

  console.log(`\nГотово. Создано профилей: ${created}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
