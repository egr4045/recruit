import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";
import {
  sendCandidateConfirmation,
  sendCandidateRejection,
} from "@/lib/email";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const app = await prisma.application.findUnique({
    where: { id: Number(id) },
    include: {
      slot: true,
      candidateProfile: { include: { tags: true } },
      telegramChat: true,
    },
  });

  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...app,
    industries: JSON.parse(app.industries),
    workFormats: JSON.parse(app.workFormats),
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    slot: {
      id: app.slot.id,
      startsAt: app.slot.startsAt.toISOString(),
      durationMin: app.slot.durationMin,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, paymentLink, adminNotes } = body as {
    status?: ApplicationStatus;
    paymentLink?: string;
    adminNotes?: string;
  };

  const app = await prisma.application.findUnique({
    where: { id: Number(id) },
    include: { slot: true },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.application.update({
    where: { id: Number(id) },
    data: {
      ...(status && { status }),
      ...(paymentLink !== undefined && { paymentLink }),
      ...(adminNotes !== undefined && { adminNotes }),
    },
  });

  // Create CandidateProfile on CONFIRMED
  if (status === "CONFIRMED") {
    await prisma.candidateProfile.upsert({
      where: { applicationId: Number(id) },
      create: { applicationId: Number(id) },
      update: {},
    });
  }

  // Send emails on status change (only if candidate provided an email)
  if (app.email) {
    if (status === "CONFIRMED" && paymentLink) {
      sendCandidateConfirmation(
        app.email,
        app.fullName,
        app.slot.startsAt,
        paymentLink
      ).catch(console.error);
    } else if (status === "REJECTED") {
      sendCandidateRejection(app.email, app.fullName).catch(console.error);
    }
  }

  return NextResponse.json({ id: updated.id, status: updated.status });
}
