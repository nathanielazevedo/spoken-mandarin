import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ id?: string | string[] }> }
) {
  try {
    const params = await context.params;
    const rawId = params?.id;
    const lessonId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!lessonId) {
      return NextResponse.json(
        { error: "Lesson id is required" },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        unit: {
          include: {
            level: {
              include: {
                program: true,
              },
            },
          },
        },
        vocabulary: {
          orderBy: { order: "asc" },
        },
        sentences: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Transform to match frontend structure
    const transformed = {
      id: lesson.id,
      order: lesson.order,
      name: lesson.name,
      description: lesson.description,
      // Include hierarchy info
      unit: {
        id: lesson.unit.id,
        order: lesson.unit.order,
        name: lesson.unit.name,
      },
      level: {
        id: lesson.unit.level.id,
        order: lesson.unit.level.order,
        name: lesson.unit.level.name,
      },
      program: {
        id: lesson.unit.level.program.id,
        name: lesson.unit.level.program.name,
      },
      vocabulary: lesson.vocabulary.map((v) => ({
        id: v.id,
        pinyin: v.pinyin,
        english: v.english,
        hanzi: v.hanzi ?? undefined,
        audioUrl: v.audioUrl,
      })),
      sentences: lesson.sentences.map((s) => ({
        id: s.id,
        pinyin: s.pinyin,
        english: s.english,
        hanzi: s.hanzi ?? undefined,
        audioUrl: s.audioUrl,
      })),
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}
