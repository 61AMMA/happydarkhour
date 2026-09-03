import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// KAN-31: PUT /api/stories/[storyId] — blocca modifica se sessione attiva
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;

  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story) {
    return NextResponse.json({ error: 'Storia non trovata' }, { status: 404 });
  }

  const activeSession = await prisma.gameSession.findFirst({
    where: { storyId, status: { in: ['active', 'paused'] } },
    select: { id: true, status: true },
  });

  if (activeSession) {
    return NextResponse.json(
      {
        error: 'Storia in uso da una sessione attiva. Termina la sessione prima di modificare.',
        sessionId: activeSession.id,
        sessionStatus: activeSession.status,
      },
      { status: 409 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const { title, description, introduzione, difficulty, durationMin, isActive, realStatus, digitalStatus } = body as {
    title?: string;
    description?: string;
    introduzione?: string;
    difficulty?: string;
    durationMin?: number;
    isActive?: boolean;
    realStatus?: string;
    digitalStatus?: string;
  };

  // KAN — semafori stato storia: solo verde, giallo, rosso (String, non enum — vincolo SQLite)
  const validSemaforo = ['verde', 'giallo', 'rosso'];
  if (realStatus !== undefined && !validSemaforo.includes(realStatus)) {
    return NextResponse.json({ error: 'realStatus non valido' }, { status: 400 });
  }
  if (digitalStatus !== undefined && !validSemaforo.includes(digitalStatus)) {
    return NextResponse.json({ error: 'digitalStatus non valido' }, { status: 400 });
  }

  const updated = await prisma.story.update({
    where: { id: storyId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(introduzione !== undefined && { introduzione }),
      ...(difficulty !== undefined && { difficulty }),
      ...(durationMin !== undefined && { durationMin }),
      ...(isActive !== undefined && { isActive }),
      ...(realStatus !== undefined && { realStatus }),
      ...(digitalStatus !== undefined && { digitalStatus }),
    },
  });

  return NextResponse.json(updated);
}

// KAN-21: DELETE /api/stories/[storyId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;

  const story = await prisma.story.findUnique({ where: { id: storyId } });
  if (!story) {
    return NextResponse.json({ error: 'Storia non trovata' }, { status: 404 });
  }

  const activeSession = await prisma.gameSession.findFirst({
    where: { storyId, status: { in: ['active', 'paused'] } },
    select: { id: true },
  });
  if (activeSession) {
    return NextResponse.json(
      { error: 'Storia in uso. Termina la sessione prima di eliminare.' },
      { status: 409 }
    );
  }

  try {
    // SQLite non fa cascade su GameSession → Story, quindi eliminiamo prima le sessioni
    // e tutti i loro figli (SessionTeam, progress, attempts, ecc. cascadano da GameSession)
    const sessions = await prisma.gameSession.findMany({
      where: { storyId },
      select: { id: true },
    });
    for (const s of sessions) {
      await prisma.gameSession.delete({ where: { id: s.id } });
    }
    // Ora la storia può essere eliminata (StoryStep → StepAnswer/StepHint cascadano)
    await prisma.story.delete({ where: { id: storyId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore eliminazione storia:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// GET /api/stories/[storyId]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;

  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: {
      steps: {
        where: { isActive: true },
        orderBy: { stepNumber: 'asc' },
        include: { answers: true, hints: true },
      },
    },
  });

  if (!story) {
    return NextResponse.json({ error: 'Storia non trovata' }, { status: 404 });
  }

  const activeSession = await prisma.gameSession.findFirst({
    where: { storyId, status: { in: ['active', 'paused'] } },
    select: { id: true },
  });

  return NextResponse.json({ ...story, isInUse: !!activeSession });
}
