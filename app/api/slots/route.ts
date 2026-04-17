import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const now = new Date();
  const fromDate = from ? new Date(from) : now;
  const toDate = to ? new Date(to) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const slots = await prisma.timeSlot.findMany({
    where: {
      isAvailable: true,
      startsAt: { gte: fromDate, lte: toDate },
    },
    orderBy: { startsAt: "asc" },
    select: { id: true, startsAt: true, durationMin: true },
  });

  // Group by date
  const grouped: Record<string, typeof slots> = {};
  for (const slot of slots) {
    const key = format(slot.startsAt, "yyyy-MM-dd");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(slot);
  }

  const result = Object.entries(grouped).map(([date, daySlots]) => ({
    date,
    slots: daySlots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      durationMin: s.durationMin,
    })),
  }));

  return NextResponse.json(result);
}
