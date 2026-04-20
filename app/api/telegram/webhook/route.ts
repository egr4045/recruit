import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendMessageToCandidate,
  sendMessageToEmployer,
  notifyAdminEmployerInquiry,
  notifyAdminEmployerMessage,
  notifyAdminEmployerInterest,
} from "@/lib/telegram";

export const runtime = "nodejs";

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
  const username: string = message.from?.username || "unknown";

  // ── /start handling ───────────────────────────────────────────────────────
  if (text.startsWith("/start")) {
    const param = text.slice(6).trim(); // everything after "/start "

    // employer_<profileId>  or  employer
    if (param === "employer" || param.startsWith("employer_")) {
      const profileIdStr = param.startsWith("employer_") ? param.slice(9) : null;
      const profileId =
        profileIdStr && /^\d+$/.test(profileIdStr) ? Number(profileIdStr) : null;

      // Find existing open inquiry for this chat
      const existing = await prisma.employerInquiry.findFirst({
        where: { telegramChatId: chatId, status: { not: "CLOSED" } },
        orderBy: { createdAt: "desc" },
      });

      const shouldCreate =
        !existing ||
        (profileId != null && existing.interestedInProfileId !== profileId);

      if (shouldCreate) {
        const inquiry = await prisma.employerInquiry.create({
          data: {
            telegramChatId: chatId,
            telegramUsername: username,
            ...(profileId != null && { interestedInProfileId: profileId }),
          },
        });
        await notifyAdminEmployerInquiry({ inquiryId: inquiry.id, username, profileId });
      }

      await sendMessageToEmployer(
        chatId,
        "Здравствуйте! Расскажите, кого ищете — стек, грейд, бюджет. Мы подберём из нашей базы отсмотренных кандидатов."
      );
      return NextResponse.json({ ok: true });
    }

    // interest_<profileId>  — «Хочу познакомиться» из приватного каталога
    if (param.startsWith("interest_")) {
      const profileIdStr = param.slice(9);
      const profileId = /^\d+$/.test(profileIdStr) ? Number(profileIdStr) : null;

      if (profileId != null) {
        const inquiry = await prisma.employerInquiry.findFirst({
          where: { telegramChatId: chatId },
          orderBy: { createdAt: "desc" },
        });
        await notifyAdminEmployerInterest({ inquiryId: inquiry?.id, username, profileId });
      }

      await sendMessageToEmployer(
        chatId,
        "Ваш запрос получен! Менеджер свяжется с вами в ближайшее время."
      );
      return NextResponse.json({ ok: true });
    }

    // /start <applicationId>  — link candidate's chat to their application
    const appId = /^\d+$/.test(param) ? Number(param) : null;
    if (appId) {
      await prisma.telegramChat.updateMany({
        where: { applicationId: appId },
        data: { telegramChatId: chatId, linkedAt: new Date() },
      });
      await sendMessageToCandidate(
        chatId,
        "Привет! Теперь вы будете получать сообщения от рекрутера здесь. Можете писать нам — мы ответим."
      );
    }
    return NextResponse.json({ ok: true });
  }

  // ── Incoming text message ─────────────────────────────────────────────────

  // 1. Check employer inquiries first
  const employerInquiry = await prisma.employerInquiry.findFirst({
    where: { telegramChatId: chatId, status: { not: "CLOSED" } },
    orderBy: { createdAt: "desc" },
  });

  if (employerInquiry) {
    await prisma.employerMessage.create({
      data: { inquiryId: employerInquiry.id, text, fromAdmin: false },
    });

    if (employerInquiry.status === "NEW") {
      await prisma.employerInquiry.update({
        where: { id: employerInquiry.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    await notifyAdminEmployerMessage({
      inquiryId: employerInquiry.id,
      username: employerInquiry.telegramUsername,
      text,
    });

    return NextResponse.json({ ok: true });
  }

  // 2. Candidate chat — store message and notify admin (delayed)
  const chat = await prisma.telegramChat.findFirst({
    where: { telegramChatId: chatId },
    include: { application: true },
  });

  if (!chat) return NextResponse.json({ ok: true });

  const msg = await prisma.chatMessage.create({
    data: { applicationId: chat.applicationId, text, fromAdmin: false },
  });

  // Delay notification for 5 minutes to avoid spam
  setTimeout(async () => {
    try {
      const currentMsg = await prisma.chatMessage.findUnique({ where: { id: msg.id } });
      if (currentMsg && !currentMsg.isRead) {
        const adminChatId = process.env.TELEGRAM_CHAT_ID;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (adminChatId && botToken) {
          const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/applications/${chat.applicationId}`;
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: adminChatId,
              text: `💬 <b>${chat.application.fullName}</b>:\n${text}`,
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [[{ text: "Открыть чат", url: adminUrl }]],
              },
            }),
          });
        }
      }
    } catch (err) {
      console.error("[Delayed Notification Error]", err);
    }
  }, 5 * 60 * 1000);

  return NextResponse.json({ ok: true });
}
