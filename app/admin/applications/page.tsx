"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type AppItem = {
  id: number;
  fullName: string;
  email: string;
  position: string;
  grade: string;
  status: string;
  createdAt: string;
  slotStartsAt: string;
};

const STATUS_TABS = [
  { value: "", label: "Все" },
  { value: "PENDING", label: "Ожидают" },
  { value: "CONFIRMED", label: "Подтверждены" },
  { value: "REJECTED", label: "Отклонены" },
  { value: "COMPLETED", label: "Завершены" },
];

export default function ApplicationsPage() {
  const [items, setItems] = useState<AppItem[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const initialRef = useRef(true);

  async function fetchData(silent = false) {
    if (!silent) setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/applications?${params}`);
    const data = await res.json();
    setItems(data.items);
    setTotal(data.total);
    if (!silent) setLoading(false);
  }

  useEffect(() => {
    initialRef.current = true;
    fetchData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  // Silent polling каждые 10 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 10_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Заявки</h1>
        <p className="text-sm text-gray-400 mt-1">{total} всего</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatus(t.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                status === t.value ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Поиск по имени, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black w-64"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Загружаем...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">Заявок нет</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Кандидат", "Позиция", "Слот", "Статус", ""].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-xs font-medium text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{item.fullName}</p>
                    <p className="text-xs text-gray-400">{item.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{item.position}</p>
                    <p className="text-xs text-gray-400">{item.grade}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {format(new Date(item.slotStartsAt), "d MMM, HH:mm", { locale: ru })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={item.status} />
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/applications/${item.id}`}
                      className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      Открыть →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
