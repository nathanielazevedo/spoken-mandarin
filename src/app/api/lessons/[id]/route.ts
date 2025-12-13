import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        { error: 'Lesson id is required' },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        vocabulary: {
          orderBy: { order: 'asc' },
        },
        sentences: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Transform to match existing frontend structure
    const transformed = {
      id: lesson.id,
      title: lesson.title,
      vocabulary: lesson.vocabulary.map(
        (v: {
          id: string;
          pinyin: string;
          english: string;
          audioUrl: string | null;
          hanzi?: string | null;
        }) => ({
        id: v.id,
        pinyin: v.pinyin,
        english: v.english,
          hanzi: v.hanzi ?? undefined,
          audioUrl: v.audioUrl,
        })
      ),
      sentences: lesson.sentences.map(
        (s: {
          id: string;
          pinyin: string;
          english: string;
          audioUrl: string | null;
          hanzi?: string | null;
        }) => ({
          id: s.id,
          pinyin: s.pinyin,
          english: s.english,
          hanzi: s.hanzi ?? undefined,
          audioUrl: s.audioUrl,
        })
      ),
    };

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}
