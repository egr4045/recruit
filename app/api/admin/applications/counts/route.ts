import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";


export const dynamic = "force-dynamic";

export async function GET() {
  const pending = await prisma.application.count({
    where: { status: "PENDING" },
  });
  return NextResponse.json({ pending });
}
