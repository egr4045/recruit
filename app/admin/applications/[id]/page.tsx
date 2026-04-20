"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";

type Application = {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  telegram: string | null;
  position: string;
  grade: string;
  resumeUrl: string | null;
  industries: string[];
  expectedSalary: string | null;
  painPoints: string;
  workFormats: string[];
  willingToRelocate: boolean;
  relocateTo: string | null;
  strengths: string;
  weaknesses: string;
  status: string;
  paymentLink: string | null;
  adminNotes: string | null;
  createdAt: string;
  slot: { id: number; startsAt: string; durationMin: number };
  candidateProfile: { id: number } | null;
  telegramChat: { telegramChatId: string | null; telegramUsername: string; linkedAt: string | null } | null;
};

type ChatMessage = {
  id: number;
  text: string;
  fromAdmin: boolean;
  sentAt: string;
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-2.5 border-b border-gray-50">
      <span className="text-sm text-gray-400 w-40 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 flex-1">{value || "—"}</span>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/admin/applications/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setApp(data);
        setPaymentLink(data.paymentLink || "");
        setAdminNotes(data.adminNotes || "");
        setLoading(false);
      });
    fetchMessages();
  }, [id]);

  async function fetchMessages() {
    const res = await fetch(`/api/admin/applications/${id}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
      fetch(`/api/admin/applications/${id}/messages/read`, { method: "POST" }).catch(() => {});
    }
  }

  const prevMessagesCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessagesCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages]);

  // Poll messages every 15 seconds
  useEffect(() => {
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [id]);

  async function updateStatus(status: string, extra?: Record<string, string>) {
    setActionLoading(true);
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra }),
    });
    const data = await res.json();
    setApp((prev) => prev ? { ...prev, status: data.status } : prev);
    setActionLoading(false);
    setShowConfirmModal(false);
  }

  async function saveNotes() {
    await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNotes }),
    });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  async function sendMessage() {
    if (!msgText.trim()) return;
    setMsgSending(true);
    const res = await fetch(`/api/admin/applications/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: msgText.trim() }),
    });
    if (res.ok) {
      setMsgText("");
      await fetchMessages();
    }
    setMsgSending(false);
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Загружаем...</div>;
  if (!app) return <div className="p-8 text-sm text-red-500">Заявка не найдена</div>;

  const tgLinked = app.telegramChat?.telegramChatId;
  const tgUsername = app.telegramChat?.telegramUsername || app.telegram;
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/applications" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← Все заявки
        </Link>
        <div className="flex items-center gap-4 mt-3">
          <h1 className="text-2xl font-semibold text-gray-900">{app.fullName}</h1>
          <Badge status={app.status} />
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Заявка #{app.id} · {format(new Date(app.createdAt), "d MMMM yyyy", { locale: ru })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Контакты</h2>
            {tgUsername && (
              <InfoRow
                label="Telegram"
                value={
                  <span className="flex items-center gap-2">
                    <a
                      href={`https://t.me/${tgUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      @{tgUsername}
                    </a>
                    {tgLinked ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">бот подключён</span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">ждём /start от кандидата</span>
                    )}
                  </span>
                }
              />
            )}
            {app.email && (
              <InfoRow label="Email" value={<a href={`mailto:${app.email}`} className="text-blue-600 hover:underline">{app.email}</a>} />
            )}
            {app.phone && <InfoRow label="Телефон" value={app.phone} />}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Профессиональный профиль</h2>
            <InfoRow label="Позиция" value={`${app.position} (${app.grade})`} />
            <InfoRow label="Ожидаемая ЗП" value={app.expectedSalary} />
            <InfoRow label="Интересующие сферы" value={app.industries.join(", ")} />
            <InfoRow label="Формат работы" value={app.workFormats.join(", ")} />
            <InfoRow label="Релокация" value={app.willingToRelocate ? `Да${app.relocateTo ? ` → ${app.relocateTo}` : ""}` : "Нет"} />
            {app.resumeUrl && (
              <InfoRow label="Резюме" value={
                <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  Скачать резюме
                </a>
              } />
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Мотивация и профиль</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Проблема / Почему ищет работу</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{app.painPoints}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Сильные стороны</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{app.strengths}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Слабые стороны</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{app.weaknesses}</p>
              </div>
            </div>
          </div>

          {/* Admin notes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Заметки (внутренние)</h2>
            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              onBlur={saveNotes}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Добавьте заметки для внутреннего использования..."
            />
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={saveNotes}
                className="px-4 py-1.5 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
              >
                Сохранить
              </button>
              {notesSaved && (
                <span className="text-xs text-green-600">Сохранено ✓</span>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Чат с кандидатом</h2>
            {!tgLinked && (
              <p className="text-xs text-yellow-700 bg-yellow-50 rounded-xl px-3 py-2 mb-3">
                Кандидат ещё не написал боту. Попросите его отправить{" "}
                {botUsername ? (
                  <a
                    href={`https://t.me/${botUsername}?start=${app.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-medium"
                  >
                    /start боту @{botUsername}
                  </a>
                ) : (
                  <span className="font-medium">/start вашему боту</span>
                )}.
              </p>
            )}
            <div className="border border-gray-100 rounded-xl h-56 overflow-y-auto p-3 space-y-2 mb-3 bg-gray-50">
              {messages.length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-8">Сообщений нет</p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.fromAdmin ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                      m.fromAdmin
                        ? "bg-black text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <p className={`text-xs mt-1 ${m.fromAdmin ? "text-gray-400" : "text-gray-400"}`}>
                      {format(new Date(m.sentAt), "HH:mm", { locale: ru })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2">
              <input
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={tgLinked ? "Написать кандидату..." : "Кандидат ещё не подключён"}
                disabled={!tgLinked || msgSending}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:bg-gray-50"
              />
              <button
                onClick={sendMessage}
                disabled={!tgLinked || !msgText.trim() || msgSending}
                className="px-4 py-2 bg-black text-white text-sm rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {msgSending ? "..." : "→"}
              </button>
            </div>
          </div>
        </div>

        {/* Action panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Слот</h2>
            <p className="text-sm text-gray-700">
              {format(new Date(app.slot.startsAt), "d MMMM yyyy, HH:mm", { locale: ru })}
            </p>
            <p className="text-xs text-gray-400 mt-1">{app.slot.durationMin} минут</p>
          </div>

          {app.candidateProfile && (
            <Link
              href={`/admin/candidates/${app.candidateProfile.id}`}
              className="block bg-blue-50 text-blue-700 text-sm font-medium rounded-2xl p-4 hover:bg-blue-100 transition-colors text-center"
            >
              Открыть профиль кандидата →
            </Link>
          )}

          {app.status === "PENDING" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="text-base font-semibold text-gray-800">Действия</h2>
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={actionLoading}
                className="w-full bg-green-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                Подтвердить
              </button>
              <button
                onClick={() => updateStatus("REJECTED")}
                disabled={actionLoading}
                className="w-full bg-red-50 text-red-600 rounded-xl py-2.5 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                Отклонить
              </button>
            </div>
          )}

          {app.status === "CONFIRMED" && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
              <h2 className="text-base font-semibold text-gray-800">Подтверждено</h2>
              {app.paymentLink && (
                <p className="text-xs text-gray-500 break-all">{app.paymentLink}</p>
              )}
              <button
                onClick={() => updateStatus("COMPLETED")}
                disabled={actionLoading}
                className="w-full bg-blue-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Отметить завершённым
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Подтвердить заявку</h3>
            <p className="text-sm text-gray-500 mb-4">
              Введите ссылку на оплату. Она будет отправлена кандидату вместе с подтверждением.
            </p>
            <input
              type="url"
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
              placeholder="https://payment.link/..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => updateStatus("CONFIRMED", { paymentLink })}
                disabled={!paymentLink || actionLoading}
                className="flex-1 bg-black text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                Подтвердить и отправить
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-200"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
