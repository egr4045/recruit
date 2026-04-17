import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function formatDateTime(date: Date) {
  return date.toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    dateStyle: "long",
    timeStyle: "short",
  });
}

export async function sendCandidateAcknowledgement(
  email: string,
  fullName: string,
  slotDate: Date
) {
  if (!process.env.SMTP_USER) return;
  await transporter.sendMail({
    from: `"Recruiting" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Заявка получена — ожидайте подтверждения",
    html: `
      <h2>Привет, ${fullName}!</h2>
      <p>Мы получили вашу заявку на собеседование.</p>
      <p><strong>Желаемое время:</strong> ${formatDateTime(slotDate)}</p>
      <p>Мы рассмотрим её и пришлём подтверждение в ближайшее время.</p>
      <hr/>
      <p style="color:#888;font-size:12px">Recruiting Platform</p>
    `,
  });
}

export async function sendCandidateConfirmation(
  email: string,
  fullName: string,
  slotDate: Date,
  paymentLink: string
) {
  if (!process.env.SMTP_USER) return;
  await transporter.sendMail({
    from: `"Recruiting" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Собеседование подтверждено",
    html: `
      <h2>Привет, ${fullName}!</h2>
      <p>Ваше собеседование <strong>подтверждено</strong>!</p>
      <p><strong>Дата и время:</strong> ${formatDateTime(slotDate)}</p>
      <p>Для завершения бронирования, пожалуйста, оплатите:</p>
      <p><a href="${paymentLink}" style="background:#000;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Оплатить</a></p>
      <p>Ссылка: <a href="${paymentLink}">${paymentLink}</a></p>
      <hr/>
      <p style="color:#888;font-size:12px">Recruiting Platform</p>
    `,
  });
}

export async function sendCandidateRejection(
  email: string,
  fullName: string
) {
  if (!process.env.SMTP_USER) return;
  await transporter.sendMail({
    from: `"Recruiting" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Обновление по вашей заявке",
    html: `
      <h2>Привет, ${fullName}!</h2>
      <p>К сожалению, мы не сможем взять вас на собеседование в данный момент.</p>
      <p>Мы сохраним вашу заявку и свяжемся при появлении подходящей возможности.</p>
      <hr/>
      <p style="color:#888;font-size:12px">Recruiting Platform</p>
    `,
  });
}

export async function sendAdminNotification(data: {
  fullName: string;
  email: string;
  position: string;
  grade: string;
  slotDate: Date;
}) {
  if (!process.env.SMTP_USER || !process.env.ADMIN_EMAIL) return;
  await transporter.sendMail({
    from: `"Recruiting Bot" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `Новая заявка: ${data.fullName} — ${data.position}`,
    html: `
      <h2>Новая заявка на собеседование</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Имя</strong></td><td style="padding:8px;border:1px solid #ddd">${data.fullName}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ddd">${data.email}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Позиция</strong></td><td style="padding:8px;border:1px solid #ddd">${data.position}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Грейд</strong></td><td style="padding:8px;border:1px solid #ddd">${data.grade}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Слот</strong></td><td style="padding:8px;border:1px solid #ddd">${formatDateTime(data.slotDate)}</td></tr>
      </table>
      <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/applications">Открыть в админке →</a></p>
    `,
  });
}
