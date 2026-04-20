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
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Главная
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-6">Полезные материалы</h1>
          <p className="text-gray-500 mt-2">
            Всё, что нужно для поиска работы и подготовки к собеседованиям.
          </p>
        </div>

        {/* Секция: Каналы */}
        {channelsList.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <span>📱</span> Подборки каналов
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {channelsList.map((item) => (
                <Link
                  key={item.id}
                  href={`/channels/${item.slug}`}
                  className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#2AABEE] hover:shadow-md transition-all group block"
                >
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#2AABEE] transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {item.metaDescription && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.metaDescription}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Секция: Статьи */}
        {articlesList.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <span>✍️</span> Статьи и гайды
            </h2>
            <div className="space-y-4">
              {articlesList.map((item) => (
                <Link
                  key={item.id}
                  href={`/channels/${item.slug}`}
                  className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-300 transition-all block"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  </div>
                  {item.metaDescription && (
                    <p className="text-sm text-gray-500 mt-2">{item.metaDescription}</p>
                  )}
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
