"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { TalentCard, TalentCardData } from "@/components/talent/TalentCard";

const GRADES = ["Junior", "Middle", "Senior", "Lead", "Principal"];
const FORMATS = [
  { value: "remote", label: "Удалённо" },
  { value: "hybrid", label: "Гибрид" },
  { value: "office", label: "Офис" },
];

export default function TalentPage() {
  const [candidates, setCandidates] = useState<TalentCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтры
  const [grades, setGrades] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";

  useEffect(() => {
    const params = new URLSearchParams();
    grades.forEach((g) => params.append("grade", g));
    formats.forEach((f) => params.append("format", f));
    if (salaryMin) params.set("salaryMin", salaryMin);
    if (salaryMax) params.set("salaryMax", salaryMax);

    setLoading(true);
    fetch(`/api/talent?${params}`)
      .then((r) => r.json())
      .then((data) => { setCandidates(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [grades, formats, salaryMin, salaryMax]);

  function toggleGrade(g: string) {
    setGrades((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  }

  function toggleFormat(f: string) {
    setFormats((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Главная
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900">База талантов</h1>
            <p className="text-xs text-gray-400 mt-0.5">Каждый кандидат отсмотрен лично нашей командой</p>
          </div>
          <a
            href={`https://t.me/${botUsername}?start=employer`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[#2AABEE] hover:underline"
          >
            Общий запрос →
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Фильтры */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8">
          <div className="flex flex-wrap gap-6">
            {/* Грейд */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Грейд</p>
              <div className="flex flex-wrap gap-1.5">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => toggleGrade(g)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      grades.includes(g)
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Формат */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Формат работы</p>
              <div className="flex flex-wrap gap-1.5">
                {FORMATS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => toggleFormat(f.value)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      formats.includes(f.value)
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Зарплата */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Зарплата (₽)</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="от"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  className="w-24 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black"
                />
                <span className="text-gray-300">—</span>
                <input
                  type="number"
                  placeholder="до"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  className="w-24 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Результаты */}
        {loading ? (
          <div className="text-center py-20 text-sm text-gray-400">Загружаем...</div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-2">По вашим фильтрам никого нет</p>
            <button
              onClick={() => { setGrades([]); setFormats([]); setSalaryMin(""); setSalaryMax(""); }}
              className="text-sm text-blue-600 hover:underline"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">{candidates.length} кандидатов</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map((c) => (
                <TalentCard key={c.id} candidate={c} botUsername={botUsername} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
