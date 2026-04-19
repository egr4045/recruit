import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessageToCandidate } from "@/lib/telegram";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const messages = await prisma.chatMessage.findMany({
    where: { applicationId: Number(id) },
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

  const chat = await prisma.telegramChat.findUnique({
    where: { applicationId: Number(id) },
  });

  if (!chat?.telegramChatId) {
    return NextResponse.json(
      { error: "Кандидат ещё не подключил бота" },
      { status: 422 }
    );
  }

  const sent = await sendMessageToCandidate(chat.telegramChatId, text.trim());
  if (!sent) {
    return NextResponse.json({ error: "Не удалось отправить сообщение" }, { status: 502 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      applicationId: Number(id),
      text: text.trim(),
      fromAdmin: true,
    },
  });

  return NextResponse.json({ ...message, sentAt: message.sentAt.toISOString() }, { status: 201 });
}
