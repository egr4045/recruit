"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";

type Application = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/applications/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setApp(data);
        setPaymentLink(data.paymentLink || "");
        setAdminNotes(data.adminNotes || "");
        setLoading(false);
      });
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
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Загружаем...</div>;
  if (!app) return <div className="p-8 text-sm text-red-500">Заявка не найдена</div>;

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
            <InfoRow label="Email" value={<a href={`mailto:${app.email}`} className="text-blue-600 hover:underline">{app.email}</a>} />
            <InfoRow label="Телефон" value={app.phone} />
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
