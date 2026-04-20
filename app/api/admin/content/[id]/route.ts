import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import z from "zod";

export const runtime = "nodejs";

const contentSchema = z.object({
  slug: z.string().min(1, "Slug обязателен").regex(/^[a-z0-9-]+$/, "Только маленькие буквы, цифры и дефис"),
  title: z.string().min(1, "Заголовок обязателен"),
  metaDescription: z.string().optional().nullable(),
  content: z.string().min(1, "Контент не может быть пустым"),
  isPublished: z.boolean().default(false),
  type: z.enum(["ARTICLE", "CHANNELS_LIST"]).default("ARTICLE"),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const article = await prisma.seoArticle.findUnique({
      where: { id: Number(params.id) },
    });
    if (!article) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json(article);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = contentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Ошибка валидации", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Check slug collision
    const existing = await prisma.seoArticle.findFirst({
      where: { slug: data.slug, NOT: { id: Number(params.id) } },
    });
    if (existing) {
      return NextResponse.json({ error: "Такой slug уже существует" }, { status: 409 });
    }

    const article = await prisma.seoArticle.update({
      where: { id: Number(params.id) },
      data: {
        slug: data.slug,
        title: data.title,
        metaDescription: data.metaDescription,
        content: data.content,
        isPublished: data.isPublished,
        type: data.type,
      },
    });

    return NextResponse.json(article);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.seoArticle.delete({
      where: { id: Number(params.id) },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
