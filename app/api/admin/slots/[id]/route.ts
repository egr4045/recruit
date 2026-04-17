import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { isAvailable } = await req.json();

  const slot = await prisma.timeSlot.update({
    where: { id: Number(id) },
    data: { isAvailable },
  });
  return NextResponse.json({ id: slot.id, isAvailable: slot.isAvailable });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const slot = await prisma.timeSlot.findUnique({
    where: { id: Number(id) },
    include: { application: true },
  });
  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (slot.application) {
    return NextResponse.json({ error: "Слот уже занят заявкой" }, { status: 409 });
  }

  await prisma.timeSlot.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
