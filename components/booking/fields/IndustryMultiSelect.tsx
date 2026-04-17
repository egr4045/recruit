"use client";

const INDUSTRIES = [
  "Финтех",
  "Крипто",
  "Бигтех",
  "Стартап",
  "Гемблинг",
  "E-commerce",
  "Медтех",
  "Аутсорс",
  "Консалтинг",
  "Другое",
];

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
}

export function IndustryMultiSelect({ value, onChange, error }: Props) {
  function toggle(industry: string) {
    if (value.includes(industry)) {
      onChange(value.filter((v) => v !== industry));
    } else {
      onChange([...value, industry]);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {INDUSTRIES.map((ind) => (
          <button
            key={ind}
            type="button"
            onClick={() => toggle(ind)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              value.includes(ind)
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
            }`}
          >
            {ind}
          </button>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
