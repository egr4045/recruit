import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";

  const tags = await prisma.candidateTag.groupBy({
    by: ["tag", "category"],
    where: {
      ...(q && { tag: { contains: q.toLowerCase() } }),
      ...(category && { category }),
    },
    _count: { tag: true },
    orderBy: { _count: { tag: "desc" } },
    take: 20,
  });

  return NextResponse.json(
    tags.map((t) => ({ tag: t.tag, category: t.category, count: t._count.tag }))
  );
}
