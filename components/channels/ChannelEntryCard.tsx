export type ChannelEntry = {
  name: string;
  url: string;
  description: string;
  emoji?: string;
};

export function ChannelEntryCard({ entry }: { entry: ChannelEntry }) {
  return (
    <a
      href={entry.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-[#2AABEE] hover:shadow-md transition-all group block"
    >
      <div className="w-11 h-11 rounded-xl bg-[#2AABEE]/10 flex items-center justify-center text-xl shrink-0 group-hover:bg-[#2AABEE]/20 transition-colors">
        {entry.emoji || "📱"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 group-hover:text-[#2AABEE] transition-colors">
            {entry.name}
          </span>
          <span className="text-xs px-2 py-0.5 bg-[#2AABEE]/10 text-[#2AABEE] rounded-full font-medium">
            Telegram
          </span>
        </div>
        {entry.description && (
          <p className="text-sm text-gray-500 mt-1 leading-snug">{entry.description}</p>
        )}
      </div>

      <span className="text-gray-300 group-hover:text-[#2AABEE] transition-colors text-lg shrink-0 mt-0.5">
        →
      </span>
    </a>
  );
}
