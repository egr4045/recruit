"use client";
import { useState } from "react";

const FORMATS = [
  { value: "Офис", label: "Офис" },
  { value: "Удалённо", label: "Удалённо" },
  { value: "Гибрид", label: "Гибрид" },
];

interface Props {
  formats: string[];
  onFormatsChange: (v: string[]) => void;
  willingToRelocate: boolean;
  onRelocateChange: (v: boolean) => void;
  relocateTo: string;
  onRelocateToChange: (v: string) => void;
  error?: string;
}

export function WorkFormatGroup({
  formats,
  onFormatsChange,
  willingToRelocate,
  onRelocateChange,
  relocateTo,
  onRelocateToChange,
  error,
}: Props) {
  function toggleFormat(format: string) {
    if (formats.includes(format)) {
      onFormatsChange(formats.filter((f) => f !== format));
    } else {
      onFormatsChange([...formats, format]);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        {FORMATS.map((f) => (
          <label
            key={f.value}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
              formats.includes(f.value)
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={formats.includes(f.value)}
              onChange={() => toggleFormat(f.value)}
            />
            {f.label}
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onRelocateChange(!willingToRelocate)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            willingToRelocate ? "bg-black" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              willingToRelocate ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm text-gray-700">Готов к релокации</span>
      </div>

      {willingToRelocate && (
        <input
          type="text"
          value={relocateTo}
          onChange={(e) => onRelocateToChange(e.target.value)}
          placeholder="Куда готов переехать (город, страна)"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      )}
    </div>
  );
}
