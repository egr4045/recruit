"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type Inquiry = {
  id: number;
  telegramUsername: string;
  telegramChatId: string | null;
  status: "NEW" | "IN_PROGRESS" | "GRANTED" | "CLOSED";
  createdAt: string;
  messageCount: number;
  interestedIn: { id: number; position: string; grade: string } | null;
  access: { scope: string; token: string } | null;
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  NEW:         { label: "Новый",      cls: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "В работе",   cls: "bg-yellow-100 text-yellow-700" },
  GRANTED:     { label: "Доступ выдан", cls: "bg-green-100 text-green-700" },
  CLOSED:      { label: "Закрыт",     cls: "bg-gray-100 text-gray-500" },
};

export default function EmployerInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/employer-inquiries")
      .then((r) => r.json())
      .then(setInquiries)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-sm text-gray-400">Загружаем...</div>;

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Продажи талантов</h1>
        <span className="text-sm text-gray-400">{inquiries.length} запросов</span>
      </div>

      {inquiries.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>Запросов от работодателей пока нет</p>
          <p className="text-xs mt-2">Они появятся когда кто-то нажмёт «Связаться» в каталоге</p>
        </div>
      ) : (
        <div className="space-y-2">
          {inquiries.map((i) => {
            const st = STATUS_LABELS[i.status];
            return (
              <Link
                key={i.id}
                href={`/admin/employer-inquiries/${i.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 px-5 py-4 hover:border-gray-300 transition-colors"
              >
                {/* Аватар */}
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm flex-shrink-0">
                  {i.telegramUsername.charAt(0).toUpperCase()}
                </div>

                {/* Основная инфо */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">@{i.telegramUsername}</span>
                    {!i.telegramChatId && (
                      <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">не написал боту</span>
                    )}
                  </div>
                  {i.interestedIn && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Интересовался: {i.interestedIn.position} ({i.interestedIn.grade})
                    </p>
                  )}
                </div>

                {/* Метрики */}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  {i.messageCount > 0 && (
                    <span>💬 {i.messageCount}</span>
                  )}
                  <span className="text-xs">
                    {format(new Date(i.createdAt), "d MMM", { locale: ru })}
                  </span>
                </div>

                {/* Статус */}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.cls}`}>
                  {st.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
