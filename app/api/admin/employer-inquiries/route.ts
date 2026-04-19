import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const inquiries = await prisma.employerInquiry.findMany({
    include: {
      interestedIn: {
        select: {
          id: true,
          application: { select: { position: true, grade: true } },
        },
      },
      access: { select: { scope: true, token: true, createdAt: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    inquiries.map((i) => ({
      id: i.id,
      telegramUsername: i.telegramUsername,
      telegramChatId: i.telegramChatId,
      status: i.status,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
      messageCount: i._count.messages,
      interestedIn: i.interestedIn
        ? {
            id: i.interestedIn.id,
            position: i.interestedIn.application.position,
            grade: i.interestedIn.application.grade,
          }
        : null,
      access: i.access
        ? {
            scope: i.access.scope,
            token: i.access.token,
            createdAt: i.access.createdAt.toISOString(),
          }
        : null,
    }))
  );
}
