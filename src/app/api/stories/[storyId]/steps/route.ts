// KAN-21 — GET + POST /api/stories/[storyId]/steps
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/stories/[storyId]/steps — lista step ordinati per stepNumber
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;

  const story = await prisma.story.findUnique({ where: { id: storyId }, select: { id: true } });
  if (!story) {
    return NextResponse.json({ error: 'Storia non trovata' }, { status: 404 });
  }

  try {
    const steps = await prisma.storyStep.findMany({
      where: { storyId, isActive: true },
      orderBy: { stepNumber: 'asc' },
      include: {
        answers: true,
        hints: { orderBy: { order: 'asc' } },
      },
    });
    return NextResponse.json(steps);
  } catch (error) {
    console.error('Errore nel leggere gli step:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// POST /api/stories/[storyId]/steps — crea nuovo step
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;

  const story = await prisma.story.findUnique({ where: { id: storyId }, select: { id: true } });
  if (!story) {
    return NextResponse.json({ error: 'Storia non trovata' }, { status: 404 });
  }

  // Blocca modifiche se sessione attiva
  const activeSession = await prisma.gameSession.findFirst({
    where: { storyId, status: { in: ['active', 'paused'] } },
    select: { id: true },
  });
  if (activeSession) {
    return NextResponse.json(
      { error: 'Storia in uso da una sessione attiva. Termina la sessione prima di modificare.' },
      { status: 409 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const { stepNumber, title, description, question, answerType, inputCount, inputConfig } =
    body as {
      stepNumber?: number;
      title?: string;
      description?: string;
      question?: string;
      answerType?: string;
      inputCount?: number;
      inputConfig?: string;
    };

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Il titolo è obbligatorio' }, { status: 400 });
  }

  const validAnswerTypes = [
    'text_single',
    'number_single',
    'multi_text_ordered',
    'multi_group_ordered_numbers',
    'ordered_sequence_letters',
    'list_text_with_empty_allowed',
    'multi_number_unordered',
    'structured_choice_with_reason',
  ];
  const resolvedType =
    answerType && validAnswerTypes.includes(answerType) ? answerType : 'text_single';

  // Se stepNumber non fornito, usa il successivo disponibile
  let resolvedStepNumber = typeof stepNumber === 'number' ? stepNumber : undefined;
  if (!resolvedStepNumber) {
    const last = await prisma.storyStep.findFirst({
      where: { storyId },
      orderBy: { stepNumber: 'desc' },
      select: { stepNumber: true },
    });
    resolvedStepNumber = (last?.stepNumber ?? 0) + 1;
  }

  try {
    const step = await prisma.storyStep.create({
      data: {
        storyId,
        stepNumber: resolvedStepNumber,
        title: title.trim(),
        description: (description ?? '').trim(),
        question: (question ?? '').trim(),
        answerType: resolvedType,
        inputCount: typeof inputCount === 'number' ? inputCount : null,
        inputConfig: typeof inputConfig === 'string' ? inputConfig : null,
        isActive: true,
      },
    });
    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione dello step:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
