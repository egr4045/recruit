const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete('schema');
const pool = new pg.Pool({ connectionString: url.toString() });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.seoArticle.findUnique({
    where: { slug: "where-to-find-it-jobs" }
  });

  if (existing) {
    console.log("Статья уже существует.");
    return;
  }

  await prisma.seoArticle.create({
    data: {
      slug: "where-to-find-it-jobs",
      title: "Где искать работу в IT в 2026 году?",
      metaDescription: "Сборник лучших каналов, сайтов и проверенных методов для поиска работы в сфере IT: от Джуна до Сеньора.",
      type: "ARTICLE",
      isPublished: true,
      content: `
        <h2>1. Telegram-каналы</h2>
        <p>Telegram стал одним из самых популярных мест для поиска работы.</p>
        <ul>
          <li><strong>IT Jobs</strong> — крупнейший канал с вакансиями.</li>
          <li><strong>DevOps Jobs</strong> — специализированный канал для DevOps инженеров.</li>
        </ul>
        <h2>2. Хабр Карьера и LinkedIn</h2>
        <p>Хабр Карьера отлично подходит для поиска работы в РФ и СНГ. LinkedIn — обязателен для удалёнки за рубежом.</p>
        <h2>3. Нетворкинг</h2>
        <p>Митапы, конференции (HighLoad, FrontendConf). Рекомендации от коллег работают эффективнее всего!</p>
      `
    }
  });

  console.log("✅ Тестовая статья успешно создана!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
