import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// POST /api/progress/[lessonId]/exam - Record an exam attempt
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
    const { score, passed, timeSpent, answers } = body;

    // Get or create user progress
    let userProgress = await prisma.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        },
      },
    });

    if (!userProgress) {
      userProgress = await prisma.userProgress.create({
        data: {
          userId: user.id,
          lessonId,
          updatedAt: new Date(),
        },
      });
    }

    // Create exam attempt
    const examAttempt = await prisma.examAttempt.create({
      data: {
        userProgressId: userProgress.id,
        score,
        passed,
        timeSpent,
        answers,
      },
    });

    // Update user progress with exam result
    const updatedProgress = await prisma.userProgress.update({
      where: { id: userProgress.id },
      data: {
        examPassed: passed || userProgress.examPassed, // Once passed, stays passed
        examHighScore: Math.max(score, userProgress.examHighScore || 0),
        completedAt: passed ? new Date() : userProgress.completedAt,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      examAttempt,
      progress: updatedProgress,
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording exam attempt:', error);
    return NextResponse.json({ error: 'Failed to record exam attempt' }, { status: 500 });
  }
}
