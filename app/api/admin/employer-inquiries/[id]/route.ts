import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const inquiry = await prisma.employerInquiry.findUnique({
    where: { id: Number(id) },
    include: {
      interestedIn: {
        include: {
          tags: true,
          application: { select: { position: true, grade: true, expectedSalary: true } },
        },
      },
      access: true,
    },
  });

  if (!inquiry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: inquiry.id,
    telegramUsername: inquiry.telegramUsername,
    telegramChatId: inquiry.telegramChatId,
    status: inquiry.status,
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
    interestedIn: inquiry.interestedIn
      ? {
          id: inquiry.interestedIn.id,
          position: inquiry.interestedIn.application.position,
          grade: inquiry.interestedIn.application.grade,
          tags: inquiry.interestedIn.tags.map((t) => ({ tag: t.tag, category: t.category })),
        }
      : null,
    access: inquiry.access
      ? {
          scope: inquiry.access.scope,
          profileIds: JSON.parse(inquiry.access.profileIds),
          token: inquiry.access.token,
          createdAt: inquiry.access.createdAt.toISOString(),
        }
      : null,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await req.json();

  const updated = await prisma.employerInquiry.update({
    where: { id: Number(id) },
    data: { status },
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
