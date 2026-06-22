// KAN-21 — PUT + DELETE /api/hints/[hintId]
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_HINT_TYPES = ['TEXT', 'PHOTO', 'VIDEO', 'AUDIO'];

// PUT /api/hints/[hintId] — aggiorna un hint
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ hintId: string }> }
) {
  const { hintId } = await params;

  const hint = await prisma.stepHint.findUnique({
    where: { id: hintId },
    include: { step: { select: { storyId: true } } },
  });
  if (!hint) {
    return NextResponse.json({ error: 'Hint non trovato' }, { status: 404 });
  }

  const activeSession = await prisma.gameSession.findFirst({
    where: { storyId: hint.step.storyId, status: { in: ['active', 'paused'] } },
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

  if (type !== undefined && !VALID_HINT_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `type deve essere uno di: ${VALID_HINT_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.stepHint.update({
      where: { id: hintId },
      data: {
        ...(type !== undefined && { type }),
        ...(contentText !== undefined && { contentText: contentText?.trim() ?? null }),
        ...(contentUrl !== undefined && { contentUrl: contentUrl?.trim() ?? null }),
        ...(typeof pointsCost === 'number' && { pointsCost }),
        ...(typeof triggerMinutesAfterFirstClear === 'number' && {
          triggerMinutesAfterFirstClear,
        }),
        ...(typeof order === 'number' && { order }),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'hint:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// DELETE /api/hints/[hintId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ hintId: string }> }
) {
  const { hintId } = await params;

  const hint = await prisma.stepHint.findUnique({
    where: { id: hintId },
    include: { step: { select: { storyId: true } } },
  });
  if (!hint) {
    return NextResponse.json({ error: 'Hint non trovato' }, { status: 404 });
  }

  const activeSession = await prisma.gameSession.findFirst({
    where: { storyId: hint.step.storyId, status: { in: ['active', 'paused'] } },
    select: { id: true },
  });
  if (activeSession) {
    return NextResponse.json(
      { error: 'Storia in uso da una sessione attiva.' },
      { status: 409 }
    );
  }

  try {
    await prisma.stepHint.delete({ where: { id: hintId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'hint:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
