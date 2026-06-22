// KAN-21 — GET + POST /api/steps/[stepId]/hints
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_HINT_TYPES = ['TEXT', 'PHOTO', 'VIDEO', 'AUDIO'];

// GET /api/steps/[stepId]/hints — lista hint ordinati per order
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const { stepId } = await params;

  const step = await prisma.storyStep.findUnique({
    where: { id: stepId },
    select: { id: true },
  });
  if (!step) {
    return NextResponse.json({ error: 'Step non trovato' }, { status: 404 });
  }

  try {
    const hints = await prisma.stepHint.findMany({
      where: { stepId },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(hints);
  } catch (error) {
    console.error('Errore nel leggere gli hint:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// POST /api/steps/[stepId]/hints — crea nuovo hint
export async function POST(
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

  const { type, contentText, contentUrl, pointsCost, triggerMinutesAfterFirstClear, order } =
    body as {
      type?: string;
      contentText?: string | null;
      contentUrl?: string | null;
      pointsCost?: number;
      triggerMinutesAfterFirstClear?: number;
      order?: number;
    };

  if (!type || !VALID_HINT_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `type deve essere uno di: ${VALID_HINT_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  if (type === 'TEXT' && (!contentText || !contentText.trim())) {
    return NextResponse.json(
      { error: 'contentText è obbligatorio per hint di tipo TEXT' },
      { status: 400 }
    );
  }
  if (type !== 'TEXT' && (!contentUrl || !contentUrl.trim())) {
    return NextResponse.json(
      { error: 'contentUrl è obbligatorio per hint di tipo PHOTO/VIDEO/AUDIO' },
      { status: 400 }
    );
  }

  // Calcola order se non fornito
  let resolvedOrder = typeof order === 'number' ? order : undefined;
  if (!resolvedOrder) {
    const last = await prisma.stepHint.findFirst({
      where: { stepId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    resolvedOrder = (last?.order ?? 0) + 1;
  }

  try {
    const hint = await prisma.stepHint.create({
      data: {
        stepId,
        order: resolvedOrder,
        type,
        contentText: contentText?.trim() ?? null,
        contentUrl: contentUrl?.trim() ?? null,
        pointsCost: typeof pointsCost === 'number' ? pointsCost : 50,
        triggerMinutesAfterFirstClear:
          typeof triggerMinutesAfterFirstClear === 'number'
            ? triggerMinutesAfterFirstClear
            : 5,
      },
    });
    return NextResponse.json(hint, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione dell\'hint:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
