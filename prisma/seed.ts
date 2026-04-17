import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, setHours, setMinutes, startOfDay } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", passwordHash },
  });
  console.log("✅ Admin user created: admin / admin123");

  // Create sample time slots for next 14 days
  const slotTimes = [10, 12, 14, 16, 18]; // hours
  const slotsCreated: Date[] = [];

  for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
    const day = addDays(startOfDay(new Date()), dayOffset);
    const dayOfWeek = day.getDay(); // 0=Sun, 6=Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

    for (const hour of slotTimes) {
      const startsAt = setMinutes(setHours(day, hour), 0);
      await prisma.timeSlot.upsert({
        where: {
          id: dayOffset * 10 + hour,
        },
        update: {},
        create: { startsAt, durationMin: 60, isAvailable: true },
      });
      slotsCreated.push(startsAt);
    }
  }

  console.log(`✅ Created ${slotsCreated.length} time slots`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
