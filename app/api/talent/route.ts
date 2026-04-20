import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Публичный API: анонимизированные карточки кандидатов для работодателей.
// Показываем только COMPLETED кандидатов с рейтингом >= 3.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tags = searchParams.getAll("tag").filter(Boolean);
  const grades = searchParams.getAll("grade").filter(Boolean);
  const formats = searchParams.getAll("format").filter(Boolean);
  const industries = searchParams.getAll("industry").filter(Boolean);
  const salaryMin = searchParams.get("salaryMin");
  const salaryMax = searchParams.get("salaryMax");
  const q = searchParams.get("q")?.toLowerCase().trim() || "";

  const profiles = await prisma.candidateProfile.findMany({
    where: {
      overallRating: { gte: 3 },
      application: {
        status: "COMPLETED",
        ...(grades.length > 0 && { grade: { in: grades } }),
      },
      ...(tags.length > 0 && {
        AND: tags.map((tag) => ({
          tags: { some: { tag: { contains: tag.toLowerCase() } } },
        })),
      }),
    },
    include: {
      tags: true,
      application: {
        select: {
          position: true,
          grade: true,
          expectedSalary: true,
          workFormats: true,
          industries: true,
          willingToRelocate: true,
        },
      },
    },
    orderBy: [{ overallRating: "desc" }, { createdAt: "desc" }],
  });

  let filtered = profiles;

  // Фильтр по формату работы
  if (formats.length > 0) {
    filtered = filtered.filter((p) => {
      try {
        const wf: string[] = JSON.parse(p.application.workFormats);
        return formats.some((f) => wf.includes(f));
      } catch {
        return false;
      }
    });
  }

  // Фильтр по индустрии (тег с category="industry" или в application.industries)
  if (industries.length > 0) {
    const lowerIndustries = industries.map((i) => i.toLowerCase());
    filtered = filtered.filter((p) => {
      const tagIndustries = p.tags
        .filter((t) => t.category === "industry")
        .map((t) => t.tag.toLowerCase());
      let appIndustries: string[] = [];
      try { appIndustries = JSON.parse(p.application.industries).map((s: string) => s.toLowerCase()); } catch {}
      const allIndustries = [...tagIndustries, ...appIndustries];
      return lowerIndustries.some((ind) => allIndustries.some((a) => a.includes(ind)));
    });
  }

  // Фильтр по зарплате
  if (salaryMin || salaryMax) {
    const min = salaryMin ? Number(salaryMin) : null;
    const max = salaryMax ? Number(salaryMax) : null;
    filtered = filtered.filter((p) => {
      if (!p.application.expectedSalary) return false;
      const num = parseInt(p.application.expectedSalary.replace(/\D/g, ""), 10);
      if (isNaN(num)) return false;
      if (min && num < min) return false;
      if (max && num > max) return false;
      return true;
    });
  }

  // Текстовый поиск по должности и тегам
  if (q) {
    filtered = filtered.filter((p) => {
      const pos = (p.application.position || "").toLowerCase();
      const tagsText = p.tags.map((t) => t.tag.toLowerCase()).join(" ");
      return pos.includes(q) || tagsText.includes(q);
    });
  }

  return NextResponse.json(
    filtered.map((p) => {
      let workFormats: string[] = [];
      let industries: string[] = [];
      try { workFormats = JSON.parse(p.application.workFormats); } catch {}
      try { industries = JSON.parse(p.application.industries); } catch {}

      // Группируем теги по категории для красивого отображения
      const tagsByCategory: Record<string, string[]> = {};
      for (const t of p.tags) {
        if (!tagsByCategory[t.category]) tagsByCategory[t.category] = [];
        tagsByCategory[t.category].push(t.tag);
      }

      return {
        id: p.id,
        position: p.application.position,
        grade: p.application.grade,
        expectedSalary: p.application.expectedSalary,
        workFormats,
        industries,
        willingToRelocate: p.application.willingToRelocate,
        overallRating: p.overallRating,
        tags: p.tags.map((t) => ({ tag: t.tag, category: t.category })),
        tagsByCategory,
      };
    })
  );
}
