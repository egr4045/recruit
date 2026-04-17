import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pg = require("pg");
import bcrypt from "bcryptjs";
import { addDays, setHours, setMinutes, startOfDay } from "date-fns";

// Strip ?schema= — baked into generated SQL via @@schema
const rawUrl = "postgresql://postgres:postgres@localhost:5432/dating?schema=recruit";
const url = new URL(rawUrl);
url.searchParams.delete("schema");

const pool = new pg.Pool({ connectionString: url.toString() });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);
  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", passwordHash },
  });
  console.log("✅ Admin user created: admin / admin123");

  const slotTimes = [10, 12, 14, 16, 18];
  let count = 0;
  for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
    const day = addDays(startOfDay(new Date()), dayOffset);
    if ([0, 6].includes(day.getDay())) continue;
    for (const hour of slotTimes) {
      const startsAt = setMinutes(setHours(day, hour), 0);
      await prisma.timeSlot.create({ data: { startsAt, durationMin: 60, isAvailable: true } });
      count++;
    }
  }
  console.log(`✅ Created ${count} time slots`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
