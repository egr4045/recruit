"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

type TagEntry = { tag: string; category: string };
type TagSuggestion = { tag: string; category: string; count: number };
type SkillEntry = { name: string; level: string };
type LangEntry = { lang: string; level: string };

type Profile = {
  id: number;
  applicationId: number;
  technicalSkills: SkillEntry[];
  softSkills: string[];
  languages: LangEntry[];
  industryExp: string[];
  interviewNotes: string | null;
  overallRating: number | null;
  tags: TagEntry[];
  application: {
    fullName: string;
    email: string | null;
    phone: string | null;
    telegram: string | null;
    position: string;
    grade: string;
    status: string;
    slot: { startsAt: string; durationMin: number };
    painPoints: string;
    strengths: string;
    weaknesses: string;
    industries: string[];
  };
};

const SKILL_LEVELS = ["", "Beginner", "Intermediate", "Advanced", "Expert"];

const CATEGORIES: { value: string; label: string }[] = [
  { value: "stack", label: "Стек" },
  { value: "role", label: "Роль" },
  { value: "industry", label: "Отрасль" },
  { value: "trait", label: "Особенности" },
  { value: "status", label: "Статус" },
  { value: "language", label: "Языки" },
  { value: "other", label: "Другое" },
];

const CATEGORY_COLORS: Record<string, string> = {
  stack: "bg-blue-100 text-blue-700",
  role: "bg-purple-100 text-purple-700",
  industry: "bg-orange-100 text-orange-700",
  trait: "bg-green-100 text-green-700",
  status: "bg-red-100 text-red-700",
  language: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-700",
};

function TagBadge({ tag, category, onRemove }: { tag: string; category: string; onRemove: () => void }) {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  const catLabel = CATEGORIES.find((c) => c.value === category)?.label || category;
  return (
    <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full ${color}`}>
      <span className="opacity-60 text-[10px]">{catLabel}</span>
      #{tag}
      <button onClick={onRemove} className="opacity-50 hover:opacity-100 text-xs">✕</button>
    </span>
  );
}

export default function CandidateProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tagCategory, setTagCategory] = useState("other");
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newSoftSkill, setNewSoftSkill] = useState("");
  const [newLang, setNewLang] = useState("");
  const suggestRef = useRef<HTMLDivElement>(null);

  const fetchProfile = useCallback(async () => {
    const res = await fetch(`/api/admin/candidates/${id}`);
    const data = await res.json();
    setProfile(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchSuggestions(q: string) {
    if (!q && !tagCategory) { setSuggestions([]); return; }
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (tagCategory !== "other") params.set("category", tagCategory);
    const res = await fetch(`/api/admin/tags?${params}`);
    if (res.ok) setSuggestions(await res.json());
  }

  async function save(updates: Partial<Profile & { tags: TagEntry[] }>) {
    if (!profile) return;
    setSaving(true);
    await fetch(`/api/admin/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSaving(false);
  }

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function addTag(tag: string, category: string) {
    if (!profile) return;
    const normalized = tag.trim().toLowerCase();
    if (!normalized || profile.tags.some((t) => t.tag === normalized)) return;
    const updated = [...profile.tags, { tag: normalized, category }];
    update("tags", updated);
    save({ tags: updated });
    setTagInput("");
    setShowSuggestions(false);
  }

  function removeTag(tag: string) {
    if (!profile) return;
    const updated = profile.tags.filter((t) => t.tag !== tag);
    update("tags", updated);
    save({ tags: updated });
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Загружаем...</div>;
  if (!profile) return <div className="p-8 text-sm text-red-500">Профиль не найден</div>;

  const app = profile.application;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/admin/candidates" className="text-sm text-gray-400 hover:text-gray-700">
          ← Все кандидаты
        </Link>
        <div className="flex items-center gap-4 mt-3">
          <h1 className="text-2xl font-semibold text-gray-900">{app.fullName}</h1>
          <Badge status={app.status} />
        </div>
        <p className="text-sm text-gray-400 mt-1">{app.position} · {app.grade}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: profile editor */}
        <div className="lg:col-span-2 space-y-5">

          {/* Rating */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Общая оценка</h2>
              {saving && <span className="text-xs text-gray-400">Сохраняем...</span>}
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    update("overallRating", s);
                    save({ overallRating: s });
                  }}
                  className={`text-2xl transition-transform hover:scale-110 ${
                    profile.overallRating && s <= profile.overallRating ? "text-yellow-400" : "text-gray-200"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Technical skills */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Технические навыки</h2>
            <div className="space-y-2 mb-3">
              {profile.technicalSkills.map((sk, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-gray-800 flex-1">{sk.name}</span>
                  <select
                    value={sk.level}
                    onChange={(e) => {
                      const updated = profile.technicalSkills.map((s, j) =>
                        j === i ? { ...s, level: e.target.value } : s
                      );
                      update("technicalSkills", updated);
                      save({ technicalSkills: updated });
                    }}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l || "Уровень"}</option>)}
                  </select>
                  <button
                    onClick={() => {
                      const updated = profile.technicalSkills.filter((_, j) => j !== i);
                      update("technicalSkills", updated);
                      save({ technicalSkills: updated });
                    }}
                    className="text-gray-300 hover:text-red-500 transition-colors text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSkill.trim()) {
                  const updated = [...profile.technicalSkills, { name: newSkill.trim(), level: "" }];
                  update("technicalSkills", updated);
                  save({ technicalSkills: updated });
                  setNewSkill("");
                }
              }}
              placeholder="Добавить навык (Enter)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Soft skills */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Soft skills</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {profile.softSkills.map((sk, i) => (
                <span key={i} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full">
                  {sk}
                  <button
                    onClick={() => {
                      const updated = profile.softSkills.filter((_, j) => j !== i);
                      update("softSkills", updated);
                      save({ softSkills: updated });
                    }}
                    className="text-gray-400 hover:text-red-500 text-xs"
                  >✕</button>
                </span>
              ))}
            </div>
            <input
              value={newSoftSkill}
              onChange={(e) => setNewSoftSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSoftSkill.trim()) {
                  const updated = [...profile.softSkills, newSoftSkill.trim()];
                  update("softSkills", updated);
                  save({ softSkills: updated });
                  setNewSoftSkill("");
                }
              }}
              placeholder="Добавить (Enter)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Languages */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Языки</h2>
            <div className="space-y-2 mb-3">
              {profile.languages.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-gray-800 flex-1">{l.lang}</span>
                  <input
                    value={l.level}
                    onChange={(e) => {
                      const updated = profile.languages.map((lg, j) =>
                        j === i ? { ...lg, level: e.target.value } : lg
                      );
                      update("languages", updated);
                      save({ languages: updated });
                    }}
                    placeholder="Уровень"
                    className="w-28 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <button
                    onClick={() => {
                      const updated = profile.languages.filter((_, j) => j !== i);
                      update("languages", updated);
                      save({ languages: updated });
                    }}
                    className="text-gray-300 hover:text-red-500 text-sm"
                  >✕</button>
                </div>
              ))}
            </div>
            <input
              value={newLang}
              onChange={(e) => setNewLang(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newLang.trim()) {
                  const updated = [...profile.languages, { lang: newLang.trim(), level: "" }];
                  update("languages", updated);
                  save({ languages: updated });
                  setNewLang("");
                }
              }}
              placeholder="Добавить язык (Enter)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Interview notes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Заметки с собеса</h2>
            <textarea
              rows={5}
              value={profile.interviewNotes || ""}
              onChange={(e) => update("interviewNotes", e.target.value)}
              onBlur={() => save({ interviewNotes: profile.interviewNotes })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Впечатления от собеса, ключевые моменты, красные флаги..."
            />
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Теги для поиска</h2>

            {/* Grouped tags */}
            {CATEGORIES.map(({ value: cat, label }) => {
              const catTags = profile.tags.filter((t) => t.category === cat);
              if (catTags.length === 0) return null;
              return (
                <div key={cat} className="mb-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {catTags.map((t) => (
                      <TagBadge key={t.tag} tag={t.tag} category={t.category} onRemove={() => removeTag(t.tag)} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Add tag input */}
            <div className="flex gap-2 mt-3" ref={suggestRef}>
              <div className="relative flex-1">
                <input
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    fetchSuggestions(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => { fetchSuggestions(tagInput); setShowSuggestions(true); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagInput.trim()) {
                      addTag(tagInput, tagCategory);
                    }
                    if (e.key === "Escape") setShowSuggestions(false);
                  }}
                  placeholder="Тег (Enter для добавления нового)"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {suggestions.map((s) => (
                      <button
                        key={`${s.tag}-${s.category}`}
                        onMouseDown={(e) => { e.preventDefault(); addTag(s.tag, s.category); }}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 text-left"
                      >
                        <span className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${CATEGORY_COLORS[s.category] || CATEGORY_COLORS.other}`}>
                            {CATEGORIES.find((c) => c.value === s.category)?.label}
                          </span>
                          #{s.tag}
                        </span>
                        <span className="text-xs text-gray-400">({s.count})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={tagCategory}
                onChange={(e) => { setTagCategory(e.target.value); fetchSuggestions(tagInput); }}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: application info */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Из анкеты</h2>
            <div className="space-y-3 text-sm">
              {app.telegram && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Telegram</p>
                  <p className="text-gray-800">@{app.telegram}</p>
                </div>
              )}
              {app.email && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Email</p>
                  <p className="text-gray-800">{app.email}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-1">Интересующие сферы</p>
                <p className="text-gray-800">{app.industries.join(", ")}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Проблема</p>
                <p className="text-gray-700 text-xs whitespace-pre-wrap line-clamp-5">{app.painPoints}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Сильные стороны</p>
                <p className="text-gray-700 text-xs whitespace-pre-wrap line-clamp-3">{app.strengths}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Слабые стороны</p>
                <p className="text-gray-700 text-xs whitespace-pre-wrap line-clamp-3">{app.weaknesses}</p>
              </div>
            </div>
          </div>
          <Link
            href={`/admin/applications/${profile.applicationId}`}
            className="block text-center text-sm text-gray-500 hover:text-gray-800 transition-colors py-3 border border-gray-200 rounded-2xl hover:border-gray-300"
          >
            Полная заявка →
          </Link>
        </div>
      </div>
    </div>
  );
}
