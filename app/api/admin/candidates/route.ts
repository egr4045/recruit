import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const search = searchParams.get("search") || "";

  const profiles = await prisma.candidateProfile.findMany({
    where: {
      ...(tag && { tags: { some: { tag: { contains: tag } } } }),
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
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const filtered = search
    ? profiles.filter(
        (p) =>
          p.application.fullName.toLowerCase().includes(search.toLowerCase()) ||
          p.application.email.toLowerCase().includes(search.toLowerCase()) ||
          p.application.position.toLowerCase().includes(search.toLowerCase())
      )
    : profiles;

  return NextResponse.json(
    filtered.map((p) => ({
      id: p.id,
      applicationId: p.applicationId,
      overallRating: p.overallRating,
      tags: p.tags.map((t) => t.tag),
      application: {
        ...p.application,
        createdAt: p.application.createdAt.toISOString(),
      },
    }))
  );
}
