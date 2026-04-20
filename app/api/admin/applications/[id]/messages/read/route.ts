import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const appId = Number(params.id);
  if (!appId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await prisma.chatMessage.updateMany({
    where: { applicationId: appId, fromAdmin: false, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
