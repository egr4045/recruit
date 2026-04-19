import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMessageToEmployer } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { scope, profileIds } = await req.json() as {
    scope: "ALL" | "SELECTED";
    profileIds?: number[];
  };

  if (!scope || (scope === "SELECTED" && (!profileIds || profileIds.length === 0))) {
    return NextResponse.json({ error: "Укажите scope и profileIds для SELECTED" }, { status: 400 });
  }

  const inquiry = await prisma.employerInquiry.findUnique({
    where: { id: Number(id) },
  });

  if (!inquiry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Создаём или обновляем доступ
  const access = await prisma.employerAccess.upsert({
    where: { inquiryId: Number(id) },
    create: {
      inquiryId: Number(id),
      scope,
      profileIds: JSON.stringify(scope === "SELECTED" ? profileIds : []),
    },
    update: {
      scope,
      profileIds: JSON.stringify(scope === "SELECTED" ? profileIds : []),
    },
  });

  // Обновляем статус запроса
  await prisma.employerInquiry.update({
    where: { id: Number(id) },
    data: { status: "GRANTED" },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const accessUrl = `${baseUrl}/talent/${access.token}`;

  // Отправляем ссылку работодателю в бот
  if (inquiry.telegramChatId) {
    const scopeText = scope === "ALL"
      ? "Вам открыт доступ ко всей базе кандидатов"
      : `Вам открыт доступ к ${profileIds?.length} кандидатам`;

    await sendMessageToEmployer(
      inquiry.telegramChatId,
      `✅ ${scopeText}.\n\nВаша персональная ссылка:\n${accessUrl}`
    );
  }

  return NextResponse.json({ token: access.token, url: accessUrl });
}
