"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { TalentCard, TalentCardData } from "@/components/talent/TalentCard";

const GRADES = ["Junior", "Middle", "Senior", "Lead", "Principal"];
const FORMATS = [
  { value: "remote", label: "Удалённо" },
  { value: "hybrid", label: "Гибрид" },
  { value: "office", label: "Офис" },
];
const INDUSTRIES = [
  "FinTech", "E-commerce", "SaaS", "EdTech", "HealthTech",
  "GameDev", "Маркетплейс", "Медиа", "Логистика", "B2B",
];

export default function TalentPage() {
  const [candidates, setCandidates] = useState<TalentCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Фильтры
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [grades, setGrades] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";

  // Дебаунс поиска
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    grades.forEach((g) => params.append("grade", g));
    formats.forEach((f) => params.append("format", f));
    industries.forEach((i) => params.append("industry", i));
    if (salaryMin) params.set("salaryMin", salaryMin);
    if (salaryMax) params.set("salaryMax", salaryMax);

    setLoading(true);
    fetch(`/api/talent?${params}`)
      .then((r) => r.json())
      .then((data) => { setCandidates(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debouncedSearch, grades, formats, industries, salaryMin, salaryMax]);

  function toggle<T>(arr: T[], val: T, set: (fn: (prev: T[]) => T[]) => void) {
    set((prev) => prev.includes(val) ? prev.filter((x) => x !== val) : [...prev, val]);
  }

  const hasFilters = debouncedSearch || grades.length || formats.length || industries.length || salaryMin || salaryMax;

  function resetFilters() {
    setSearch(""); setDebouncedSearch("");
    setGrades([]); setFormats([]); setIndustries([]);
    setSalaryMin(""); setSalaryMax("");
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
          {botUsername ? (
            <a
              href={`https://t.me/${botUsername}?start=employer`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[#2AABEE] hover:underline hidden sm:block"
            >
              Общий запрос →
            </a>
          ) : (
            <div className="w-20" />
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Фильтры */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 space-y-5">
          {/* Поиск */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по должности или стеку: React, Python, Lead..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-6">
            {/* Грейд */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Грейд</p>
              <div className="flex flex-wrap gap-1.5">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    onClick={() => toggle(grades, g, setGrades)}
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
                    onClick={() => toggle(formats, f.value, setFormats)}
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
                  className="w-24 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-black"
                />
                <span className="text-gray-300">—</span>
                <input
                  type="number"
                  placeholder="до"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  className="w-24 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
          </div>

          {/* Индустрия */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Индустрия</p>
            <div className="flex flex-wrap gap-1.5">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind}
                  onClick={() => toggle(industries, ind, setIndustries)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    industries.includes(ind)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          {/* Сброс фильтров */}
          {hasFilters && (
            <div className="flex justify-end pt-1 border-t border-gray-100">
              <button
                onClick={resetFilters}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                Сбросить все фильтры
              </button>
            </div>
          )}
        </div>

        {/* Результаты */}
        {loading ? (
          <div className="text-center py-20 text-sm text-gray-400">Загружаем...</div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-2">По вашим критериям никого нет</p>
            {hasFilters && (
              <button onClick={resetFilters} className="text-sm text-blue-600 hover:underline">
                Сбросить фильтры
              </button>
            )}
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
