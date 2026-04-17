import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookingSchema } from "@/lib/validations/booking";
import { sendCandidateAcknowledgement, sendAdminNotification } from "@/lib/email";
import { notifyAdmin } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = bookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ошибка валидации", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const application = await prisma.$transaction(async (tx) => {
      const slot = await tx.timeSlot.findUnique({ where: { id: data.slotId } });
      if (!slot || !slot.isAvailable) {
        throw new Error("SLOT_TAKEN");
      }

      await tx.timeSlot.update({
        where: { id: data.slotId },
        data: { isAvailable: false },
      });

      return tx.application.create({
        data: {
          slotId: data.slotId,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          position: data.position,
          grade: data.grade,
          resumeUrl: data.resumeUrl || null,
          industries: JSON.stringify(data.industries),
          expectedSalary: data.expectedSalary || null,
          painPoints: data.painPoints,
          workFormats: JSON.stringify(data.workFormats),
          willingToRelocate: data.willingToRelocate,
          relocateTo: data.relocateTo || null,
          strengths: data.strengths,
          weaknesses: data.weaknesses,
          status: "PENDING",
        },
        include: { slot: true },
      });
    });

    // Fire-and-forget notifications
    sendCandidateAcknowledgement(
      application.email,
      application.fullName,
      application.slot.startsAt
    ).catch(console.error);

    sendAdminNotification({
      fullName: application.fullName,
      email: application.email,
      position: application.position,
      grade: application.grade,
      slotDate: application.slot.startsAt,
    }).catch(console.error);

    notifyAdmin({
      fullName: application.fullName,
      email: application.email,
      position: application.position,
      grade: application.grade,
      slotDate: application.slot.startsAt,
      applicationId: application.id,
    }).catch(console.error);

    return NextResponse.json({ id: application.id, status: application.status }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return NextResponse.json(
        { error: "Этот слот уже занят. Пожалуйста, выберите другое время." },
        { status: 409 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
