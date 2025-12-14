import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { QuestionType } from '@prisma/client';
import { requireAdmin } from '@/lib/permissions-server';

// PATCH /api/lessons/[id]/exam/questions/[questionId] - Update a question
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; questionId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {

    const { questionId } = await context.params;
    const body = await request.json();
    const { type, prompt, promptAudioUrl, correctAnswer, options, explanation, points, order } = body;

    // Validate question type if provided
    if (type && !Object.values(QuestionType).includes(type)) {
      return NextResponse.json(
        { error: `Invalid question type. Must be one of: ${Object.values(QuestionType).join(', ')}` },
        { status: 400 }
      );
    }

    const question = await prisma.examQuestion.update({
      where: { id: questionId },
      data: {
        ...(type && { type: type as QuestionType }),
        ...(prompt !== undefined && { prompt }),
        ...(promptAudioUrl !== undefined && { promptAudioUrl }),
        ...(correctAnswer !== undefined && { correctAnswer }),
        ...(options !== undefined && { options }),
        ...(explanation !== undefined && { explanation }),
        ...(points !== undefined && { points }),
        ...(order !== undefined && { order }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error updating exam question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

// PUT /api/lessons/[id]/exam/questions/[questionId] - Update a question (alias for PATCH)
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; questionId: string }> }
) {
  return PATCH(request, context);
}

// DELETE /api/lessons/[id]/exam/questions/[questionId] - Delete a question
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; questionId: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {

    const { questionId } = await context.params;

    await prisma.examQuestion.delete({
      where: { id: questionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exam question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
