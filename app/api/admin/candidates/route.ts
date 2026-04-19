import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const tags = searchParams.getAll("tag").filter(Boolean);
  const grades = searchParams.getAll("grade").filter(Boolean);
  const salaryMin = searchParams.get("salaryMin");
  const salaryMax = searchParams.get("salaryMax");

  const profiles = await prisma.candidateProfile.findMany({
    where: {
      ...(tags.length > 0 && {
        AND: tags.map((tag) => ({
          tags: { some: { tag: { contains: tag.toLowerCase() } } },
        })),
      }),
      ...(grades.length > 0 && {
        application: { grade: { in: grades } },
      }),
    },
    include: {
      tags: true,
      application: {
        select: {
          fullName: true,
          email: true,
          position: true,
          grade: true,
          status: true,
          createdAt: true,
          expectedSalary: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  let filtered = profiles;

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.application.fullName.toLowerCase().includes(q) ||
        (p.application.email || "").toLowerCase().includes(q) ||
        p.application.position.toLowerCase().includes(q)
    );
  }

  // Salary range filter (best-effort: extract leading number from expectedSalary string)
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

  return NextResponse.json(
    filtered.map((p) => ({
      id: p.id,
      applicationId: p.applicationId,
      overallRating: p.overallRating,
      tags: p.tags.map((t) => ({ tag: t.tag, category: t.category })),
      application: {
        fullName: p.application.fullName,
        email: p.application.email,
        position: p.application.position,
        grade: p.application.grade,
        status: p.application.status,
        createdAt: p.application.createdAt.toISOString(),
      },
    }))
  );
}
