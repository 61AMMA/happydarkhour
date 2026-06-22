// KAN-21 — GET + PUT + DELETE /api/steps/[stepId]
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/steps/[stepId] — step completo con answers e hints
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const { stepId } = await params;

  try {
    const step = await prisma.storyStep.findUnique({
      where: { id: stepId },
      include: {
        answers: { orderBy: { position: 'asc' } },
        hints: { orderBy: { order: 'asc' } },
      },
    });
    if (!step) {
      return NextResponse.json({ error: 'Step non trovato' }, { status: 404 });
    }
    return NextResponse.json(step);
  } catch (error) {
    console.error('Errore nel leggere lo step:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// PUT /api/steps/[stepId] — aggiorna campi step (senza answers/hints)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const { stepId } = await params;

  const step = await prisma.storyStep.findUnique({
    where: { id: stepId },
    select: { id: true, storyId: true },
  });
  if (!step) {
    return NextResponse.json({ error: 'Step non trovato' }, { status: 404 });
  }

  // Blocca modifiche se sessione attiva
  const activeSession = await prisma.gameSession.findFirst({
    where: { storyId: step.storyId, status: { in: ['active', 'paused'] } },
    select: { id: true },
  });
  if (activeSession) {
    return NextResponse.json(
      { error: 'Storia in uso da una sessione attiva.' },
      { status: 409 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const { title, description, question, answerType, inputCount, inputConfig, isActive } =
    body as {
      title?: string;
      description?: string;
      question?: string;
      answerType?: string;
      inputCount?: number | null;
      inputConfig?: string | null;
      isActive?: boolean;
    };

  const validAnswerTypes = [
    'text_single', 'number_single', 'multi_text_ordered',
    'multi_group_ordered_numbers', 'ordered_sequence_letters',
    'list_text_with_empty_allowed', 'multi_number_unordered',
    'structured_choice_with_reason',
  ];

  try {
    const updated = await prisma.storyStep.update({
      where: { id: stepId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(question !== undefined && { question }),
        ...(answerType !== undefined && validAnswerTypes.includes(answerType) && { answerType }),
        ...(inputCount !== undefined && { inputCount }),
        ...(inputConfig !== undefined && { inputConfig }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        answers: { orderBy: { position: 'asc' } },
        hints: { orderBy: { order: 'asc' } },
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Errore nell\'aggiornamento dello step:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// DELETE /api/steps/[stepId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const { stepId } = await params;

  const step = await prisma.storyStep.findUnique({
    where: { id: stepId },
    select: { id: true, storyId: true },
  });
  if (!step) {
    return NextResponse.json({ error: 'Step non trovato' }, { status: 404 });
  }

  const activeSession = await prisma.gameSession.findFirst({
    where: { storyId: step.storyId, status: { in: ['active', 'paused'] } },
    select: { id: true },
  });
  if (activeSession) {
    return NextResponse.json(
      { error: 'Storia in uso da una sessione attiva.' },
      { status: 409 }
    );
  }

  try {
    await prisma.storyStep.delete({ where: { id: stepId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore nell\'eliminazione dello step:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
