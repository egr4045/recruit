function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function notifyAdmin(data: {
  fullName: string;
  email: string;
  position: string;
  grade: string;
  slotDate: Date;
  applicationId: number;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const slotStr = data.slotDate.toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const text =
    `🔔 <b>Новая заявка на собес!</b>\n\n` +
    `👤 <b>${escapeHtml(data.fullName)}</b>\n` +
    `📧 ${escapeHtml(data.email)}\n` +
    `💼 ${escapeHtml(data.position)} (${escapeHtml(data.grade)})\n` +
    `📅 ${slotStr}`;

  const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/admin/applications/${data.applicationId}`;

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Открыть в админке", url: adminUrl }],
          ],
        },
      }),
    }
  ).catch((err) => {
    console.error("[Telegram] fetch error:", err);
    return null;
  });

  if (res && !res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error("[Telegram] API error:", res.status, body);
  }
}
