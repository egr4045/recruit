import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Полезные материалы и каналы | CareerFixer",
  description: "Подборки лучших Telegram каналов и полезные статьи для поиска работы.",
};

export const dynamic = "force-dynamic";

export default async function ChannelsPage() {
  const allArticles = await prisma.seoArticle.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, title: true, metaDescription: true, type: true, createdAt: true },
  });

  const channelsList = allArticles.filter((a) => a.type === "CHANNELS_LIST");
  const articlesList = allArticles.filter((a) => a.type === "ARTICLE");

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header band */}
      <div className="bg-white border-b border-gray-100 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Главная
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-6 tracking-tight">
            Полезные материалы
          </h1>
          <p className="text-gray-500 mt-3 text-lg max-w-lg leading-relaxed">
            Подборки Telegram-каналов и статьи для поиска работы и подготовки к собеседованиям.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">
        {/* Channels section */}
        {channelsList.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-8 bg-[#2AABEE]/10 rounded-xl flex items-center justify-center text-base">
                📱
              </span>
              <h2 className="text-xl font-semibold text-gray-900">Подборки каналов</h2>
              <span className="ml-auto text-sm text-gray-400">{channelsList.length} подборок</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {channelsList.map((item) => (
                <Link
                  key={item.id}
                  href={`/channels/${item.slug}`}
                  className="bg-white rounded-2xl border border-gray-100 p-6 border-l-4 border-l-[#2AABEE] hover:shadow-md hover:border-gray-200 transition-all group block"
                >
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#2AABEE] transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {item.metaDescription && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-snug">
                      {item.metaDescription}
                    </p>
                  )}
                  <span className="inline-block mt-4 text-xs font-medium text-[#2AABEE]">
                    Смотреть подборку →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Articles section */}
        {articlesList.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-base">
                ✍️
              </span>
              <h2 className="text-xl font-semibold text-gray-900">Статьи и гайды</h2>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {articlesList.map((item) => (
                <Link
                  key={item.id}
                  href={`/channels/${item.slug}`}
                  className="flex items-start justify-between gap-4 px-6 py-5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                      {item.title}
                    </h3>
                    {item.metaDescription && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-1">{item.metaDescription}</p>
                    )}
                  </div>
                  <span className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-0.5">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {allArticles.length === 0 && (
          <div className="text-center py-20 text-gray-400">В этом разделе пока ничего нет.</div>
        )}
      </div>
    </main>
  );
}
