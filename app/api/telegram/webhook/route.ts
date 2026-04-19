import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // Verify secret token from Telegram
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const headerSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (headerSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const update = await req.json();
  const message = update.message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = String(message.chat.id);
  const text: string = message.text || "";

  // Handle /start {applicationId} — link candidate's chat to their application
  const startMatch = text.match(/^\/start(?:\s+(\d+))?/);
  if (startMatch) {
    const appId = startMatch[1] ? Number(startMatch[1]) : null;
    if (appId) {
      await prisma.telegramChat.updateMany({
        where: { applicationId: appId },
        data: { telegramChatId: chatId, linkedAt: new Date() },
      });

      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (token) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "Привет! Теперь вы будете получать сообщения от рекрутера здесь. Можете писать нам — мы ответим.",
          }),
        }).catch(console.error);
      }
    }
    return NextResponse.json({ ok: true });
  }

  // Incoming message from candidate — store and notify admin
  const chat = await prisma.telegramChat.findFirst({
    where: { telegramChatId: chatId },
    include: { application: true },
  });

  if (!chat) return NextResponse.json({ ok: true });

  await prisma.chatMessage.create({
    data: {
      applicationId: chat.applicationId,
      text,
      fromAdmin: false,
    },
  });

  // Notify admin in their Telegram chat
  const adminChatId = process.env.TELEGRAM_CHAT_ID;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (adminChatId && token) {
    const candidateName = chat.application.fullName;
    const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/applications/${chat.applicationId}`;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: `💬 <b>${candidateName}</b>:\n${text}`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "Открыть чат", url: adminUrl }]],
        },
      }),
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}
