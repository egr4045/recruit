"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Article = {
  id: number;
  slug: string;
  title: string;
  isPublished: boolean;
  type: string;
  views: number;
  createdAt: string;
};

export default function AdminContentPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchArticles() {
    setLoading(true);
    const res = await fetch("/api/admin/content");
    if (res.ok) {
      setArticles(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchArticles();
  }, []);

  async function togglePublish(id: number, current: boolean) {
    const article = articles.find((a) => a.id === id);
    if (!article) return;
    const res = await fetch(`/api/admin/content/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...article, isPublished: !current }),
    });
    if (res.ok) fetchArticles();
  }

  async function deleteArticle(id: number) {
    if (!confirm("Удалить материал?")) return;
    const res = await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
    if (res.ok) fetchArticles();
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Контент (SEO)</h1>
          <p className="text-sm text-gray-500 mt-1">Управление статьями и каналами</p>
        </div>
        <Link
          href="/admin/content/new"
          className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          + Создать
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Загрузка...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 text-gray-400 border border-dashed rounded-xl">
          Нет статей. Создайте первую!
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Заголовок</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Тип</th>
                <th className="px-6 py-4">Просмотры</th>
                <th className="px-6 py-4">Статус</th>
                <th className="px-6 py-4 shrink-0"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-gray-900">{article.title}</td>
                  <td className="px-6 py-4 text-gray-400">{article.slug}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{article.type}</span>
                  </td>
                  <td className="px-6 py-4">{article.views}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => togglePublish(article.id, article.isPublished)}
                      className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                        article.isPublished ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {article.isPublished ? "Опубликовано" : "Скрыто"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link
                      href={`/admin/content/${article.id}`}
                      className="text-[#2AABEE] hover:underline font-medium"
                    >
                      Редактировать
                    </Link>
                    <button
                      onClick={() => deleteArticle(article.id)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
