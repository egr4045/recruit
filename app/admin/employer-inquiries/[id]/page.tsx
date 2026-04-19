"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Inquiry = {
  id: number;
  telegramUsername: string;
  telegramChatId: string | null;
  status: "NEW" | "IN_PROGRESS" | "GRANTED" | "CLOSED";
  createdAt: string;
  interestedIn: { id: number; position: string; grade: string; tags: { tag: string; category: string }[] } | null;
  access: { scope: string; profileIds: number[]; token: string; createdAt: string } | null;
};

type Message = {
  id: number;
  text: string;
  fromAdmin: boolean;
  sentAt: string;
};

type CandidateProfile = {
  id: number;
  position: string;
  grade: string;
  tags: { tag: string; category: string }[];
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Новый", IN_PROGRESS: "В работе", GRANTED: "Доступ выдан", CLOSED: "Закрыт",
};

export default function EmployerInquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Grant access state
  const [showGrant, setShowGrant] = useState(false);
  const [grantScope, setGrantScope] = useState<"ALL" | "SELECTED">("ALL");
  const [allCandidates, setAllCandidates] = useState<CandidateProfile[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [granting, setGranting] = useState(false);
  const [grantedUrl, setGrantedUrl] = useState<string | null>(null);

  const prevCountRef = useRef(0);

  useEffect(() => {
    fetch(`/api/admin/employer-inquiries/${id}`)
      .then((r) => r.json())
      .then(setInquiry)
      .finally(() => setLoading(false));
    fetchMessages();
  }, [id]);

  async function fetchMessages() {
    const res = await fetch(`/api/admin/employer-inquiries/${id}/messages`);
    if (res.ok) setMessages(await res.json());
  }

  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [id]);

  async function sendMessage() {
    if (!msgText.trim()) return;
    setMsgSending(true);
    const res = await fetch(`/api/admin/employer-inquiries/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: msgText.trim() }),
    });
    if (res.ok) {
      setMsgText("");
      await fetchMessages();
      setInquiry((prev) => prev ? { ...prev, status: prev.status === "NEW" ? "IN_PROGRESS" : prev.status } : prev);
    }
    setMsgSending(false);
  }

  async function loadCandidates() {
    const res = await fetch("/api/admin/candidates");
    if (res.ok) {
      const data = await res.json();
      setAllCandidates(data.map((c: { id: number; application: { position: string; grade: string }; tags: { tag: string; category: string }[] }) => ({
        id: c.id,
        position: c.application.position,
        grade: c.application.grade,
        tags: c.tags,
      })));
    }
  }

  function openGrantModal() {
    setShowGrant(true);
    loadCandidates();
  }

  async function grantAccess() {
    setGranting(true);
    const res = await fetch(`/api/admin/employer-inquiries/${id}/grant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: grantScope,
        profileIds: grantScope === "SELECTED" ? selectedIds : [],
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setGrantedUrl(data.url);
      setInquiry((prev) => prev ? { ...prev, status: "GRANTED", access: { scope: grantScope, profileIds: selectedIds, token: data.token, createdAt: new Date().toISOString() } } : prev);
      setShowGrant(false);
    }
    setGranting(false);
  }

  function toggleCandidate(cid: number) {
    setSelectedIds((prev) => prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]);
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Загружаем...</div>;
  if (!inquiry) return <div className="p-8 text-sm text-red-500">Запрос не найден</div>;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const accessUrl = inquiry.access ? `${baseUrl}/talent/${inquiry.access.token}` : null;

  return (
    <div className="p-8 max-w-4xl">
      {/* Заголовок */}
      <div className="mb-6">
        <Link href="/admin/employer-inquiries" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← Продажи
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <h1 className="text-2xl font-semibold text-gray-900">@{inquiry.telegramUsername}</h1>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            {STATUS_LABELS[inquiry.status]}
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Запрос #{inquiry.id} · {format(new Date(inquiry.createdAt), "d MMMM yyyy", { locale: ru })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Чат */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-1">Чат с работодателем</h2>
            {!inquiry.telegramChatId && (
              <p className="text-xs text-yellow-700 bg-yellow-50 rounded-xl px-3 py-2 mb-3">
                Работодатель ещё не написал боту — ответить нельзя
              </p>
            )}
            <div className="border border-gray-100 rounded-xl h-64 overflow-y-auto p-3 space-y-2 mb-3 bg-gray-50">
              {messages.length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-10">Сообщений нет</p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.fromAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                    m.fromAdmin
                      ? "bg-black text-white rounded-br-sm"
                      : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                  }`}>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <p className="text-xs mt-1 text-gray-400">
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
                placeholder={inquiry.telegramChatId ? "Написать работодателю..." : "Работодатель не подключён"}
                disabled={!inquiry.telegramChatId || msgSending}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:bg-gray-50"
              />
              <button
                onClick={sendMessage}
                disabled={!inquiry.telegramChatId || !msgText.trim() || msgSending}
                className="px-4 py-2 bg-black text-white text-sm rounded-xl hover:bg-gray-800 disabled:opacity-50"
              >
                {msgSending ? "..." : "→"}
              </button>
            </div>
          </div>
        </div>

        {/* Боковая панель */}
        <div className="space-y-4">
          {/* Интересовался кандидатом */}
          {inquiry.interestedIn && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Интересовался кандидатом</h2>
              <Link
                href={`/admin/candidates/${inquiry.interestedIn.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {inquiry.interestedIn.position} ({inquiry.interestedIn.grade}) →
              </Link>
              <div className="flex flex-wrap gap-1 mt-2">
                {inquiry.interestedIn.tags.slice(0, 5).map((t) => (
                  <span key={t.tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{t.tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Доступ */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Доступ к каталогу</h2>
            {inquiry.access ? (
              <div className="space-y-2">
                <p className="text-xs text-green-600 font-medium">✓ Доступ выдан</p>
                <p className="text-xs text-gray-500">
                  {inquiry.access.scope === "ALL" ? "Вся база" : `${inquiry.access.profileIds.length} кандидатов`}
                </p>
                {accessUrl && (
                  <a href={accessUrl} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline break-all">
                    {accessUrl}
                  </a>
                )}
                <button
                  onClick={openGrantModal}
                  className="w-full mt-2 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Изменить доступ
                </button>
              </div>
            ) : (
              <button
                onClick={openGrantModal}
                className="w-full py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800"
              >
                Выдать доступ
              </button>
            )}

            {grantedUrl && (
              <div className="mt-3 bg-green-50 rounded-xl p-3">
                <p className="text-xs text-green-700 font-medium mb-1">Ссылка отправлена в бот!</p>
                <a href={grantedUrl} target="_blank" rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline break-all">
                  {grantedUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно выдачи доступа */}
      {showGrant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Выдать доступ</h3>

            {/* Scope */}
            <div className="flex gap-3 mb-4">
              {(["ALL", "SELECTED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setGrantScope(s)}
                  className={`flex-1 py-2 text-sm rounded-xl border transition-colors ${
                    grantScope === s ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {s === "ALL" ? "Вся база" : "Конкретные кандидаты"}
                </button>
              ))}
            </div>

            {/* Список кандидатов */}
            {grantScope === "SELECTED" && (
              <div className="flex-1 overflow-y-auto space-y-1 mb-4 border border-gray-100 rounded-xl p-2">
                {allCandidates.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Загружаем...</p>
                ) : (
                  allCandidates.map((c) => (
                    <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleCandidate(c.id)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-800">{c.position}</span>
                      <span className="text-xs text-gray-400">{c.grade}</span>
                      <div className="flex gap-1 ml-auto">
                        {c.tags.filter((t) => t.category === "stack").slice(0, 2).map((t) => (
                          <span key={t.tag} className="text-xs bg-gray-100 px-1.5 rounded">{t.tag}</span>
                        ))}
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={grantAccess}
                disabled={granting || (grantScope === "SELECTED" && selectedIds.length === 0)}
                className="flex-1 bg-black text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {granting ? "Выдаём..." : "Выдать и отправить ссылку"}
              </button>
              <button
                onClick={() => setShowGrant(false)}
                className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-2.5 text-sm hover:bg-gray-200"
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
