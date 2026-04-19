"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

type CandidateItem = {
  id: number;
  applicationId: number;
  overallRating: number | null;
  tags: { tag: string; category: string }[];
  application: {
    fullName: string;
    email: string | null;
    position: string;
    grade: string;
    status: string;
    createdAt: string;
  };
};

type TagSuggestion = { tag: string; category: string; count: number };

const GRADES = ["Junior", "Middle", "Senior", "Lead", "Principal"];
const LOCATIONS = ["Москва", "Санкт-Петербург", "Удалённо", "Релокация", "Другой город", "За рубежом"];
const CATEGORY_COLORS: Record<string, string> = {
  stack: "bg-blue-100 text-blue-700",
  role: "bg-purple-100 text-purple-700",
  industry: "bg-orange-100 text-orange-700",
  trait: "bg-green-100 text-green-700",
  status: "bg-red-100 text-red-700",
  language: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-700",
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameSearch, setNameSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<{ tag: string; category: string }[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [showTagSuggest, setShowTagSuggest] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const tagSuggestRef = useRef<HTMLDivElement>(null);

  async function fetchData() {
    setLoading(true);
    const params = new URLSearchParams();
    if (nameSearch) params.set("search", nameSearch);
    selectedTags.forEach((t) => params.append("tag", t.tag));
    selectedGrades.forEach((g) => params.append("grade", g));
    if (salaryMin) params.set("salaryMin", salaryMin);
    if (salaryMax) params.set("salaryMax", salaryMax);
    const res = await fetch(`/api/admin/candidates?${params}`);
    const data = await res.json();
    setCandidates(data);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [nameSearch, selectedTags, selectedGrades, salaryMin, salaryMax]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tagSuggestRef.current && !tagSuggestRef.current.contains(e.target as Node)) {
        setShowTagSuggest(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchTagSuggestions(q: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/tags?${params}`);
    if (res.ok) setTagSuggestions(await res.json());
  }

  function toggleGrade(grade: string) {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  }

  function addTag(tag: string, category: string) {
    if (!selectedTags.some((t) => t.tag === tag)) {
      setSelectedTags((prev) => [...prev, { tag, category }]);
    }
    setTagInput("");
    setShowTagSuggest(false);
  }

  const activeFiltersCount =
    selectedTags.length + selectedGrades.length + (salaryMin ? 1 : 0) + (salaryMax ? 1 : 0);

  function StarRating({ rating }: { rating: number | null }) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={`text-sm ${rating && s <= rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>
        ))}
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">База кандидатов</h1>
        <p className="text-sm text-gray-400 mt-1">{candidates.length} профилей</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="search"
          placeholder="Поиск по имени, позиции..."
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black w-64"
        />
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm transition-colors ${
            showFilters || activeFiltersCount > 0
              ? "bg-black text-white border-black"
              : "border-gray-200 text-gray-600 hover:border-gray-400"
          }`}
        >
          Фильтры
          {activeFiltersCount > 0 && (
            <span className="bg-white text-black text-xs px-1.5 py-0.5 rounded-full font-medium">
              {activeFiltersCount}
            </span>
          )}
        </button>
        {activeFiltersCount > 0 && (
          <button
            onClick={() => { setSelectedTags([]); setSelectedGrades([]); setSalaryMin(""); setSalaryMax(""); }}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 space-y-5">
          {/* Tag filter */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Теги</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedTags.map((t) => (
                <span
                  key={t.tag}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full ${CATEGORY_COLORS[t.category] || CATEGORY_COLORS.other}`}
                >
                  #{t.tag}
                  <button onClick={() => setSelectedTags((prev) => prev.filter((x) => x.tag !== t.tag))} className="opacity-60 hover:opacity-100">✕</button>
                </span>
              ))}
            </div>
            <div className="relative" ref={tagSuggestRef}>
              <input
                value={tagInput}
                onChange={(e) => { setTagInput(e.target.value); fetchTagSuggestions(e.target.value); setShowTagSuggest(true); }}
                onFocus={() => { fetchTagSuggestions(tagInput); setShowTagSuggest(true); }}
                onKeyDown={(e) => { if (e.key === "Enter" && tagInput.trim()) addTag(tagInput.trim().toLowerCase(), "other"); }}
                placeholder="Добавить тег для фильтра..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              {showTagSuggest && tagSuggestions.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {tagSuggestions.map((s) => (
                    <button
                      key={`${s.tag}-${s.category}`}
                      onMouseDown={(e) => { e.preventDefault(); addTag(s.tag, s.category); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 text-left"
                    >
                      <span className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${CATEGORY_COLORS[s.category] || CATEGORY_COLORS.other}`}>
                          {s.category}
                        </span>
                        #{s.tag}
                      </span>
                      <span className="text-xs text-gray-400">({s.count})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Grade filter */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Грейд</p>
            <div className="flex flex-wrap gap-2">
              {GRADES.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGrade(g)}
                  className={`px-3 py-1.5 text-sm rounded-xl border transition-colors ${
                    selectedGrades.includes(g)
                      ? "bg-black text-white border-black"
                      : "border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Salary filter */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ожидаемая ЗП (₽)</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="от"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <span className="text-gray-400">—</span>
              <input
                type="number"
                placeholder="до"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">Загружаем...</div>
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400">
          Профилей нет. Они создаются при подтверждении заявки.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {candidates.map((c) => (
            <Link
              key={c.id}
              href={`/admin/candidates/${c.id}`}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{c.application.fullName}</p>
                  <p className="text-xs text-gray-400">{c.application.position} · {c.application.grade}</p>
                </div>
                <Badge status={c.application.status} />
              </div>
              <StarRating rating={c.overallRating} />
              {c.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {c.tags.slice(0, 5).map((t) => (
                    <span key={t.tag} className={`text-xs px-2.5 py-1 rounded-full ${CATEGORY_COLORS[t.category] || CATEGORY_COLORS.other}`}>
                      #{t.tag}
                    </span>
                  ))}
                  {c.tags.length > 5 && (
                    <span className="text-xs text-gray-400">+{c.tags.length - 5}</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
