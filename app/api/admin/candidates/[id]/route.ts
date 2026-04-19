import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const profile = await prisma.candidateProfile.findUnique({
    where: { id: Number(id) },
    include: {
      tags: true,
      application: {
        include: { slot: true },
      },
    },
  });

  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...profile,
    technicalSkills: profile.technicalSkills ? JSON.parse(profile.technicalSkills) : [],
    softSkills: profile.softSkills ? JSON.parse(profile.softSkills) : [],
    languages: profile.languages ? JSON.parse(profile.languages) : [],
    industryExp: profile.industryExp ? JSON.parse(profile.industryExp) : [],
    tags: profile.tags.map((t) => ({ tag: t.tag, category: t.category })),
    application: {
      ...profile.application,
      industries: JSON.parse(profile.application.industries),
      workFormats: JSON.parse(profile.application.workFormats),
      createdAt: profile.application.createdAt.toISOString(),
      updatedAt: profile.application.updatedAt.toISOString(),
      slot: {
        id: profile.application.slot.id,
        startsAt: profile.application.slot.startsAt.toISOString(),
        durationMin: profile.application.slot.durationMin,
      },
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { technicalSkills, softSkills, languages, industryExp, interviewNotes, overallRating, tags } = body;

  // Update profile fields
  const profile = await prisma.candidateProfile.update({
    where: { id: Number(id) },
    data: {
      ...(technicalSkills !== undefined && { technicalSkills: JSON.stringify(technicalSkills) }),
      ...(softSkills !== undefined && { softSkills: JSON.stringify(softSkills) }),
      ...(languages !== undefined && { languages: JSON.stringify(languages) }),
      ...(industryExp !== undefined && { industryExp: JSON.stringify(industryExp) }),
      ...(interviewNotes !== undefined && { interviewNotes }),
      ...(overallRating !== undefined && { overallRating }),
    },
  });

  // Sync tags — accepts { tag, category }[] or string[] (legacy)
  if (tags !== undefined) {
    await prisma.candidateTag.deleteMany({ where: { profileId: Number(id) } });
    if (tags.length > 0) {
      await prisma.candidateTag.createMany({
        data: (tags as Array<{ tag: string; category?: string } | string>).map((t) => {
          const isObj = typeof t === "object" && t !== null;
          return {
            profileId: Number(id),
            tag: (isObj ? (t as { tag: string }).tag : String(t)).toLowerCase().trim(),
            category: isObj ? ((t as { category?: string }).category || "other") : "other",
          };
        }),
      });
    }
  }

  return NextResponse.json({ id: profile.id });
}
