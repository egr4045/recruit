"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

type CandidateItem = {
  id: number;
  applicationId: number;
  overallRating: number | null;
  tags: string[];
  application: {
    fullName: string;
    email: string;
    position: string;
    grade: string;
    status: string;
    createdAt: string;
  };
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagSearch, setTagSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");

  async function fetchData() {
    setLoading(true);
    const params = new URLSearchParams();
    if (tagSearch) params.set("tag", tagSearch);
    if (nameSearch) params.set("search", nameSearch);
    const res = await fetch(`/api/admin/candidates?${params}`);
    const data = await res.json();
    setCandidates(data);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [tagSearch, nameSearch]);

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

      <div className="flex gap-4 mb-6">
        <input
          type="search"
          placeholder="Поиск по имени, email, позиции..."
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black w-64"
        />
        <div className="relative">
          <input
            type="search"
            placeholder="Поиск по тегу..."
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black w-48 pl-8"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">#</span>
        </div>
      </div>

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
                  {c.tags.slice(0, 5).map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                      #{tag}
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
