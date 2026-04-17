import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const slots = await prisma.timeSlot.findMany({
    orderBy: { startsAt: "asc" },
    include: { application: { select: { id: true, fullName: true, status: true } } },
  });
  return NextResponse.json(
    slots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      durationMin: s.durationMin,
      isAvailable: s.isAvailable,
      application: s.application
        ? { id: s.application.id, fullName: s.application.fullName, status: s.application.status }
        : null,
    }))
  );
}

export async function POST(req: NextRequest) {
  const { startsAt, durationMin = 60 } = await req.json();
  if (!startsAt) {
    return NextResponse.json({ error: "startsAt required" }, { status: 400 });
  }

  const slot = await prisma.timeSlot.create({
    data: { startsAt: new Date(startsAt), durationMin, isAvailable: true },
  });
  return NextResponse.json({ id: slot.id, startsAt: slot.startsAt.toISOString() }, { status: 201 });
}
