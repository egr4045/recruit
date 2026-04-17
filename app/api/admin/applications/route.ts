import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as ApplicationStatus | null;
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page") || "1");
  const limit = 20;

  const where = {
    ...(status && { status }),
    ...(search && {
      OR: [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { position: { contains: search } },
      ],
    }),
  };

  const [total, items] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { slot: { select: { startsAt: true } } },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pages: Math.ceil(total / limit),
    items: items.map((a) => ({
      id: a.id,
      fullName: a.fullName,
      email: a.email,
      position: a.position,
      grade: a.grade,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      slotStartsAt: a.slot.startsAt.toISOString(),
    })),
  });
}
