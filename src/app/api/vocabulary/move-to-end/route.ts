import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions-server';

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const lessonId =
      typeof (body as { lessonId?: unknown }).lessonId === "string"
        ? (body as { lessonId: string }).lessonId.trim()
        : "";
    const vocabularyId =
      typeof (body as { vocabularyId?: unknown }).vocabularyId === "string"
        ? (body as { vocabularyId: string }).vocabularyId.trim()
        : "";

    if (!lessonId || !vocabularyId) {
      return NextResponse.json(
        { error: "lessonId and vocabularyId are required" },
        { status: 400 }
      );
    }

    const vocabulary = await prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
      select: { id: true, lessonId: true, order: true },
    });

    if (!vocabulary || vocabulary.lessonId !== lessonId) {
      return NextResponse.json(
        { error: "Vocabulary item not found for this lesson" },
        { status: 404 }
      );
    }

    const currentOrder = vocabulary.order ?? 0;

    const maxOrderEntry = await prisma.vocabulary.findFirst({
      where: { lessonId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const maxOrder = maxOrderEntry?.order ?? currentOrder;

    if (currentOrder >= maxOrder) {
      return NextResponse.json({ success: true });
    }

    await prisma.$transaction([
      prisma.vocabulary.updateMany({
        where: {
          lessonId,
          order: {
            gt: currentOrder,
            lte: maxOrder,
          },
        },
        data: {
          order: {
            decrement: 1,
          },
        },
      }),
      prisma.vocabulary.update({
        where: { id: vocabularyId },
        data: { order: maxOrder },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error moving vocabulary to end:", error);
    return NextResponse.json(
      { error: "Failed to move vocabulary to end" },
      { status: 500 }
    );
  }
}
