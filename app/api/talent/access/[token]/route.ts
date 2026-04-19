import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const access = await prisma.employerAccess.findUnique({
    where: { token },
    include: { inquiry: { select: { status: true } } },
  });

  if (!access) {
    return NextResponse.json({ error: "Доступ не найден" }, { status: 404 });
  }

  // Берём профили согласно scope
  let profileIds: number[] | null = null;
  if (access.scope === "SELECTED") {
    try {
      profileIds = JSON.parse(access.profileIds) as number[];
    } catch {
      profileIds = [];
    }
  }

  const profiles = await prisma.candidateProfile.findMany({
    where: {
      overallRating: { gte: 3 },
      application: { status: "COMPLETED" },
      ...(profileIds !== null && { id: { in: profileIds } }),
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

  return NextResponse.json({
    scope: access.scope,
    profiles: profiles.map((p, idx) => {
      let workFormats: string[] = [];
      let industries: string[] = [];
      try { workFormats = JSON.parse(p.application.workFormats); } catch {}
      try { industries = JSON.parse(p.application.industries); } catch {}

      const tagsByCategory: Record<string, string[]> = {};
      for (const t of p.tags) {
        if (!tagsByCategory[t.category]) tagsByCategory[t.category] = [];
        tagsByCategory[t.category].push(t.tag);
      }

      return {
        id: p.id,
        // Анонимное имя: Кандидат А, Б, В...
        anonymousName: `Кандидат ${String.fromCharCode(1040 + idx)}`,
        position: p.application.position,
        grade: p.application.grade,
        expectedSalary: p.application.expectedSalary,
        workFormats,
        industries,
        willingToRelocate: p.application.willingToRelocate,
        overallRating: p.overallRating,
        interviewNotes: p.interviewNotes,
        tags: p.tags.map((t) => ({ tag: t.tag, category: t.category })),
        tagsByCategory,
      };
    }),
  });
}
