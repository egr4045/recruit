import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessageToEmployer } from "@/lib/telegram";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const messages = await prisma.employerMessage.findMany({
    where: { inquiryId: Number(id) },
    orderBy: { sentAt: "asc" },
  });

  return NextResponse.json(
    messages.map((m) => ({ ...m, sentAt: m.sentAt.toISOString() }))
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { text } = await req.json();

  if (!text?.trim()) {
    return NextResponse.json({ error: "Текст не может быть пустым" }, { status: 400 });
  }

  const inquiry = await prisma.employerInquiry.findUnique({
    where: { id: Number(id) },
  });

  if (!inquiry?.telegramChatId) {
    return NextResponse.json(
      { error: "Работодатель ещё не написал боту" },
      { status: 422 }
    );
  }

  const sent = await sendMessageToEmployer(inquiry.telegramChatId, text.trim());
  if (!sent) {
    return NextResponse.json({ error: "Не удалось отправить сообщение" }, { status: 502 });
  }

  // Если статус ещё NEW — переводим в IN_PROGRESS
  if (inquiry.status === "NEW") {
    await prisma.employerInquiry.update({
      where: { id: Number(id) },
      data: { status: "IN_PROGRESS" },
    });
  }

  const message = await prisma.employerMessage.create({
    data: {
      inquiryId: Number(id),
      text: text.trim(),
      fromAdmin: true,
    },
  });

  return NextResponse.json({ ...message, sentAt: message.sentAt.toISOString() }, { status: 201 });
}
