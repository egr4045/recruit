"use client";

const GRADE_COLORS: Record<string, string> = {
  Junior: "bg-green-100 text-green-700",
  Middle: "bg-blue-100 text-blue-700",
  Senior: "bg-purple-100 text-purple-700",
  Lead: "bg-orange-100 text-orange-700",
  Principal: "bg-red-100 text-red-700",
};

const FORMAT_LABELS: Record<string, string> = {
  remote: "Удалённо",
  hybrid: "Гибрид",
  office: "Офис",
};

export type TalentCardData = {
  id: number;
  position: string;
  grade: string;
  expectedSalary: string | null;
  workFormats: string[];
  industries: string[];
  willingToRelocate: boolean;
  overallRating: number | null;
  tags: { tag: string; category: string }[];
  tagsByCategory: Record<string, string[]>;
  // только для приватного вида
  anonymousName?: string;
  interviewNotes?: string | null;
};

interface Props {
  candidate: TalentCardData;
  botUsername: string;
  isPrivate?: boolean;
  onInterest?: (id: number) => void;
}

export function TalentCard({ candidate, botUsername, isPrivate, onInterest }: Props) {
  const stackTags = candidate.tagsByCategory["stack"] || [];
  const industryTags = candidate.tagsByCategory["industry"] || candidate.industries;
  const visibleStack = stackTags.slice(0, 4);
  const extraStack = stackTags.length - 4;

  const formatLabels = candidate.workFormats
    .map((f) => FORMAT_LABELS[f] || f)
    .join(" / ");

  const botLink = `https://t.me/${botUsername}?start=employer_${candidate.id}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      {/* Бейдж отсмотрен */}
      <div className="flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 111.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd"/>
        </svg>
        <span className="text-xs text-green-600 font-medium">Отсмотрен лично командой</span>
      </div>

      {/* Заголовок */}
      <div>
        {isPrivate && candidate.anonymousName && (
          <p className="text-xs text-gray-400 mb-1">{candidate.anonymousName}</p>
        )}
        <h3 className="text-lg font-semibold text-gray-900">{candidate.position}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GRADE_COLORS[candidate.grade] || "bg-gray-100 text-gray-600"}`}>
            {candidate.grade}
          </span>
          {candidate.overallRating && (
            <span className="text-sm text-amber-400">
              {"★".repeat(candidate.overallRating)}{"☆".repeat(5 - candidate.overallRating)}
            </span>
          )}
        </div>
      </div>

      {/* Стек */}
      {stackTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleStack.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-lg">
              {tag}
            </span>
          ))}
          {extraStack > 0 && (
            <span className="text-xs text-gray-400 px-1">+{extraStack}</span>
          )}
        </div>
      )}

      {/* Индустрии */}
      {industryTags.length > 0 && (
        <p className="text-xs text-gray-500">{industryTags.slice(0, 3).join(" · ")}</p>
      )}

      {/* Заметки интервью (только приватный вид) */}
      {isPrivate && candidate.interviewNotes && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 italic">
          "{candidate.interviewNotes.slice(0, 150)}{candidate.interviewNotes.length > 150 ? "…" : ""}"
        </p>
      )}

      {/* Формат и зарплата */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        {formatLabels && <span>📍 {formatLabels}</span>}
        {candidate.expectedSalary && <span>💰 от {candidate.expectedSalary}</span>}
        {candidate.willingToRelocate && <span>✈️ Готов к релокации</span>}
      </div>

      {/* Кнопка */}
      {isPrivate ? (
        <button
          onClick={() => onInterest?.(candidate.id)}
          className="mt-auto w-full py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          Хочу познакомиться
        </button>
      ) : (
        <a
          href={botLink}
          target="_blank"
          rel="noreferrer"
          className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 bg-[#2AABEE] text-white text-sm font-medium rounded-xl hover:bg-[#229ED9] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.008 9.455c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.09 13.84l-2.944-.916c-.64-.204-.652-.64.134-.953l11.505-4.435c.537-.194 1.006.131.777.712z"/>
          </svg>
          Связаться
        </a>
      )}
    </div>
  );
}
