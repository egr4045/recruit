"use client";
import { useState } from "react";
import type { ChannelEntry } from "@/components/channels/ChannelEntryCard";

interface Props {
  value: string;
  onChange: (json: string) => void;
}

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all";

export function ChannelEntriesEditor({ value, onChange }: Props) {
  const [entries, setEntries] = useState<ChannelEntry[]>(() => {
    try {
      const p = JSON.parse(value);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  });

  const update = (next: ChannelEntry[]) => {
    setEntries(next);
    onChange(JSON.stringify(next));
  };

  const addEntry = () =>
    update([...entries, { name: "", url: "", description: "", emoji: "" }]);

  const removeEntry = (i: number) =>
    update(entries.filter((_, idx) => idx !== i));

  const updateField = (i: number, field: keyof ChannelEntry, val: string) => {
    const next = [...entries];
    next[i] = { ...next[i], [field]: val };
    update(next);
  };

  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Канал #{i + 1}</span>
            <button
              type="button"
              onClick={() => removeEntry(i)}
              className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
            >
              Удалить
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Название канала</label>
              <input
                value={entry.name}
                onChange={(e) => updateField(i, "name", e.target.value)}
                className={inputClass}
                placeholder="Python Jobs"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Emoji (опционально)</label>
              <input
                value={entry.emoji || ""}
                onChange={(e) => updateField(i, "emoji", e.target.value)}
                className={inputClass}
                placeholder="🐍"
                maxLength={4}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Ссылка на Telegram канал</label>
            <input
              value={entry.url}
              onChange={(e) => updateField(i, "url", e.target.value)}
              className={inputClass}
              placeholder="https://t.me/python_jobs"
              type="url"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Описание</label>
            <input
              value={entry.description}
              onChange={(e) => updateField(i, "description", e.target.value)}
              className={inputClass}
              placeholder="Вакансии для Python разработчиков"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addEntry}
        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-[#2AABEE] hover:text-[#2AABEE] transition-all font-medium"
      >
        + Добавить канал
      </button>

      {entries.length > 0 && (
        <p className="text-xs text-gray-400 text-right">{entries.length} каналов в подборке</p>
      )}
    </div>
  );
}
