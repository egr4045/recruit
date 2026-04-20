"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WysiwygEditor } from "@/components/admin/WysiwygEditor";
import { ChannelEntriesEditor } from "@/components/admin/ChannelEntriesEditor";

type Article = {
  id: number;
  slug: string;
  title: string;
  metaDescription: string | null;
  content: string;
  isPublished: boolean;
  type: string;
};

export default function ArticleEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isNew = params.id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [data, setData] = useState<Partial<Article>>({
    slug: "",
    title: "",
    metaDescription: "",
    content: "",
    isPublished: false,
    type: "ARTICLE",
  });

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/content/${params.id}`)
      .then((res) => res.json())
      .then((art) => {
        setData(art);
        setLoading(false);
      });
  }, [params.id, isNew]);

  async function handleSave() {
    setSaving(true);
    setError("");

    const url = isNew ? "/api/admin/content" : `/api/admin/content/${params.id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(body.error || "Ошибка сохранения");
      return;
    }

    if (isNew) {
      router.push(`/admin/content/${body.id}`);
    } else {
      alert("Сохранено!");
    }
  }

  function handleTypeChange(newType: string) {
    setData({ ...data, type: newType, content: newType === "CHANNELS_LIST" ? "[]" : "" });
  }

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all";

  if (loading) return <div className="p-8">Загрузка...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto pb-32">
      <div className="mb-6">
        <Link href="/admin/content" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← Назад к списку
        </Link>
      </div>

      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? "Создать материал" : "Редактирование материала"}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={data.isPublished || false}
              onChange={(e) => setData({ ...data, isPublished: e.target.checked })}
              className="rounded border-gray-300 w-4 h-4 text-black focus:ring-black"
            />
            Опубликовано
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Заголовок H1</label>
            <input
              value={data.title || ""}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              className={inputClass}
              placeholder="Как найти работу Devops..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">URL (Slug)</label>
            <input
              value={data.slug || ""}
              onChange={(e) => setData({ ...data, slug: e.target.value })}
              className={inputClass}
              placeholder="find-job-devops"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Тип контента</label>
          <select
            value={data.type || "ARTICLE"}
            onChange={(e) => handleTypeChange(e.target.value)}
            className={inputClass}
          >
            <option value="ARTICLE">Обычная статья</option>
            <option value="CHANNELS_LIST">Подборка каналов</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Meta Description (для SEO)</label>
          <textarea
            value={data.metaDescription || ""}
            onChange={(e) => setData({ ...data, metaDescription: e.target.value })}
            className={inputClass + " resize-none"}
            rows={2}
            placeholder="Краткое описание страницы для поисковиков"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            {data.type === "CHANNELS_LIST" ? "Каналы в подборке" : "Содержимое (редактор)"}
          </label>
          {data.type === "CHANNELS_LIST" ? (
            <ChannelEntriesEditor
              value={data.content || "[]"}
              onChange={(val) => setData({ ...data, content: val })}
            />
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden pb-10">
              <WysiwygEditor
                value={data.content || ""}
                onChange={(val) => setData({ ...data, content: val })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
