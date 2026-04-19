function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function telegramPost(method: string, body: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => {
    console.error(`[Telegram] fetch error (${method}):`, err);
    return null;
  });

  if (res && !res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error(`[Telegram] API error (${method}):`, res.status, data);
  }
  return res;
}

export async function notifyAdmin(data: {
  fullName: string;
  email: string;
  telegram: string;
  position: string;
  grade: string;
  slotDate: Date;
  applicationId: number;
}) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return;

  const slotStr = data.slotDate.toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const contactLine = data.telegram
    ? `📱 @${escapeHtml(data.telegram)}`
    : data.email
    ? `📧 ${escapeHtml(data.email)}`
    : "";

  const text =
    `🔔 <b>Новая заявка на собес!</b>\n\n` +
    `👤 <b>${escapeHtml(data.fullName)}</b>\n` +
    (contactLine ? `${contactLine}\n` : "") +
    `💼 ${escapeHtml(data.position)} (${escapeHtml(data.grade)})\n` +
    `📅 ${slotStr}`;

  const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/applications/${data.applicationId}`;

  await telegramPost("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Открыть в админке", url: adminUrl }]],
    },
  });
}

export async function sendMessageToCandidate(
  telegramChatId: string,
  text: string
): Promise<boolean> {
  const res = await telegramPost("sendMessage", {
    chat_id: telegramChatId,
    text,
  });
  return !!(res && res.ok);
}

export async function sendMessageToEmployer(
  telegramChatId: string,
  text: string
): Promise<boolean> {
  const res = await telegramPost("sendMessage", {
    chat_id: telegramChatId,
    text,
  });
  return !!(res && res.ok);
}

export async function notifyAdminEmployerInquiry(data: {
  inquiryId: number;
  username: string;
  profileId: number | null;
}) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return;

  const profileText = data.profileId
    ? ` (интересовался кандидатом #${data.profileId})`
    : "";
  const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/employer-inquiries/${data.inquiryId}`;

  await telegramPost("sendMessage", {
    chat_id: chatId,
    text:
      `💼 <b>Новый запрос от работодателя</b>\n\n` +
      `👤 @${escapeHtml(data.username)}${escapeHtml(profileText)}`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Открыть в админке", url: adminUrl }]],
    },
  });
}

export async function notifyAdminEmployerMessage(data: {
  inquiryId: number;
  username: string;
  text: string;
}) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return;

  const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/employer-inquiries/${data.inquiryId}`;

  await telegramPost("sendMessage", {
    chat_id: chatId,
    text: `💬 <b>@${escapeHtml(data.username)}</b>:\n${escapeHtml(data.text)}`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Открыть чат", url: adminUrl }]],
    },
  });
}

export async function notifyAdminEmployerInterest(data: {
  inquiryId: number | undefined;
  username: string;
  profileId: number;
}) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return;

  const adminUrl = data.inquiryId
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/admin/employer-inquiries/${data.inquiryId}`
    : `${process.env.NEXT_PUBLIC_BASE_URL}/admin/employer-inquiries`;

  await telegramPost("sendMessage", {
    chat_id: chatId,
    text:
      `⭐ <b>@${escapeHtml(data.username)}</b> хочет познакомиться с кандидатом #${data.profileId}`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[{ text: "Открыть в админке", url: adminUrl }]],
    },
  });
}

export async function setBotWebhook(webhookUrl: string) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  return telegramPost("setWebhook", {
    url: webhookUrl,
    ...(secret && { secret_token: secret }),
  });
}
