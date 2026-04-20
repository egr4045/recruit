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

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const articles = await prisma.seoArticle.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(articles);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Ошибка валидации", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Check slug collision
    const existing = await prisma.seoArticle.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json({ error: "Такой slug уже существует" }, { status: 409 });
    }

    const article = await prisma.seoArticle.create({
      data: {
        slug: data.slug,
        title: data.title,
        metaDescription: data.metaDescription,
        content: data.content,
        isPublished: data.isPublished,
        type: data.type,
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
