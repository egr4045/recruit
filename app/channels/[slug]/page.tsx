import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChannelEntryCard, type ChannelEntry } from "@/components/channels/ChannelEntryCard";

interface Params {
  params: { slug: string };
}

export const revalidate = 60;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const article = await prisma.seoArticle.findUnique({
    where: { slug: params.slug, isPublished: true },
    select: { title: true, metaDescription: true },
  });

  if (!article) return { title: "Не найдено" };

  return {
    title: `${article.title} | CareerFixer`,
    description: article.metaDescription || article.title,
  };
}

export default async function ArticlePage({ params }: Params) {
  const article = await prisma.seoArticle.findUnique({
    where: { slug: params.slug, isPublished: true },
  });

  if (!article) notFound();

  prisma.seoArticle.update({
    where: { id: article.id },
    data: { views: { increment: 1 } },
  }).catch(() => {});

  let channelEntries: ChannelEntry[] = [];
  if (article.type === "CHANNELS_LIST") {
    try {
      const parsed = JSON.parse(article.content);
      if (Array.isArray(parsed)) channelEntries = parsed;
    } catch {
      // legacy HTML content — fall through to prose render
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/channels" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Назад к материалам
          </Link>
        </div>

        <article className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100">
          <header className="mb-10 text-center">
            <span className="text-[#2AABEE] text-xs font-bold uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">
              {article.type === "CHANNELS_LIST" ? "Подборка каналов" : "Статья"}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-6 leading-tight">
              {article.title}
            </h1>
            <div className="text-sm text-gray-400 mt-4 flex items-center justify-center gap-2">
              <time dateTime={article.createdAt.toISOString()}>
                {format(article.createdAt, "d MMMM yyyy", { locale: ru })}
              </time>
              <span>·</span>
              <span>{article.views} просмотров</span>
            </div>
          </header>

          {article.type === "CHANNELS_LIST" && channelEntries.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 mb-6 text-center">
                {channelEntries.length} {channelEntries.length === 1 ? "канал" : channelEntries.length < 5 ? "канала" : "каналов"} в подборке
              </p>
              {channelEntries.map((entry, i) => (
                <ChannelEntryCard key={i} entry={entry} />
              ))}
            </div>
          ) : (
            <div
              className="prose prose-lg prose-blue max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-[#2AABEE]"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          )}
        </article>
      </div>
    </main>
  );
}
