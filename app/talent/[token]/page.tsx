"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TalentCard, TalentCardData } from "@/components/talent/TalentCard";

type AccessData = {
  scope: "ALL" | "SELECTED";
  profiles: (TalentCardData & { anonymousName: string; interviewNotes: string | null })[];
};

export default function TalentAccessPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<AccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interestSent, setInterestSent] = useState<Set<number>>(new Set());

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";

  useEffect(() => {
    fetch(`/api/talent/access/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          const e = await r.json();
          throw new Error(e.error || "Ошибка");
        }
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleInterest(profileId: number) {
    // Открываем бота с пометкой interest_ — вебхук создаст уведомление
    const link = `https://t.me/${botUsername}?start=interest_${profileId}`;
    window.open(link, "_blank");
    setInterestSent((prev) => new Set(prev).add(profileId));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Загружаем...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error || "Доступ не найден"}</p>
          <Link href="/talent" className="text-sm text-blue-600 hover:underline">
            Открытый каталог →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <Link href="/talent" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
              ← Каталог
            </Link>
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900">Ваша подборка</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {data.scope === "ALL" ? "Полный доступ к базе" : `${data.profiles.length} кандидатов`}
              </p>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {data.profiles.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>Кандидаты не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.profiles.map((c) => (
              <div key={c.id} className="relative">
                <TalentCard
                  candidate={c}
                  botUsername={botUsername}
                  isPrivate
                  onInterest={handleInterest}
                />
                {interestSent.has(c.id) && (
                  <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                    <p className="text-sm font-medium text-green-600">✓ Запрос отправлен</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
