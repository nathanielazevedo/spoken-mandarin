import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// GET /api/progress/[lessonId] - Get user's progress for a specific lesson
export async function GET(
  request: Request,
  context: { params: Promise<{ lessonId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId } = await context.params;

    const progress = await prisma.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        },
      },
      include: {
        examAttempts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

// POST /api/progress/[lessonId] - Update user's progress for a lesson
export async function POST(
  request: Request,
  context: { params: Promise<{ lessonId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId } = await context.params;
    const body = await request.json();
    const { vocabularyMastery, sentenceMastery } = body;

    const progress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        },
      },
      update: {
        ...(vocabularyMastery !== undefined && { vocabularyMastery }),
        ...(sentenceMastery !== undefined && { sentenceMastery }),
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        lessonId,
        vocabularyMastery: vocabularyMastery || 0,
        sentenceMastery: sentenceMastery || 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
