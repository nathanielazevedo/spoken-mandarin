import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { QuestionType } from '@prisma/client';

// POST /api/lessons/[id]/exam/questions - Add question to exam
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: lessonId } = await context.params;
    const body = await request.json();
    const { type, prompt, promptAudioUrl, correctAnswer, options, explanation, points } = body;

    if (!type || !prompt || !correctAnswer) {
      return NextResponse.json(
        { error: 'type, prompt, and correctAnswer are required' },
        { status: 400 }
      );
    }

    // Validate question type
    if (!Object.values(QuestionType).includes(type)) {
      return NextResponse.json(
        { error: `Invalid question type. Must be one of: ${Object.values(QuestionType).join(', ')}` },
        { status: 400 }
      );
    }

    // Get or create exam for this lesson
    let exam = await prisma.exam.findUnique({
      where: { lessonId },
    });

    if (!exam) {
      exam = await prisma.exam.create({
        data: {
          lessonId,
          updatedAt: new Date(),
        },
      });
    }

    // Get next order number
    const maxOrder = await prisma.examQuestion.aggregate({
      where: { examId: exam.id },
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? 0) + 1;

    const question = await prisma.examQuestion.create({
      data: {
        examId: exam.id,
        order: nextOrder,
        type: type as QuestionType,
        prompt,
        promptAudioUrl: promptAudioUrl || null,
        correctAnswer,
        options: options || [],
        explanation: explanation || null,
        points: points || 1,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error('Error creating exam question:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
