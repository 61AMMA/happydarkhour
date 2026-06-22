import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// KAN-19: POST /api/session/[sessionId]/hints/[id]/use
// [id] = hintId — consuma un hint: crea TeamHintUsed, deduce pointsCost dal punteggio del team
// Body: { teamId }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; id: string }> }
) {
  const { sessionId, id: hintId } = await params;

  let body: { teamId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const { teamId } = body;
  if (!teamId) {
    return NextResponse.json({ error: 'teamId richiesto nel body' }, { status: 400 });
  }

  // Carica hint
  const hint = await prisma.stepHint.findUnique({
    where: { id: hintId },
    select: {
      id: true,
      order: true,
      type: true,
      contentText: true,
      contentUrl: true,
      pointsCost: true,
      triggerMinutesAfterFirstClear: true,
      stepId: true,
    },
  });

  if (!hint) {
    return NextResponse.json({ error: 'Hint non trovato' }, { status: 404 });
  }

  // Verifica che il team appartenga alla sessione
  const sessionTeam = await prisma.sessionTeam.findFirst({
    where: { sessionId, id: teamId },
    select: { id: true, score: true },
  });

  if (!sessionTeam) {
    return NextResponse.json({ error: 'Team non trovato nella sessione' }, { status: 404 });
  }

  // Verifica che l'hint non sia già stato usato da questo team
  const alreadyUsed = await prisma.teamHintUsed.findUnique({
    where: { teamId_hintId: { teamId, hintId } },
  });

  if (alreadyUsed) {
    return NextResponse.json({ error: 'Hint già utilizzato da questo team' }, { status: 409 });
  }

  // Verifica che il trigger sia scattato (firstClear + timer)
  const firstClear = await prisma.stepFirstClear.findUnique({
    where: { sessionId_stepId: { sessionId, stepId: hint.stepId } },
  });

  if (!firstClear) {
    return NextResponse.json(
      { error: 'Hint non ancora disponibile: nessun team ha completato questo step' },
      { status: 403 }
    );
  }

  // Controlla timer sequenziale: ogni hint ha il suo timer, basato sul momento in cui il precedente è diventato available
  const hintsInOrder = await prisma.stepHint.findMany({
    where: { stepId: hint.stepId },
    orderBy: { order: 'asc' },
    select: { id: true, order: true, triggerMinutesAfterFirstClear: true },
  });

  let previousAvailableAt = new Date(firstClear.clearedAt);
  let thisHintAvailableAt: Date | null = null;

  for (const h of hintsInOrder) {
    const availableAt = new Date(
      previousAvailableAt.getTime() + h.triggerMinutesAfterFirstClear * 60 * 1000
    );
    if (h.id === hintId) {
      thisHintAvailableAt = availableAt;
      break;
    }
    previousAvailableAt = availableAt;
  }

  if (!thisHintAvailableAt || new Date() < thisHintAvailableAt) {
    return NextResponse.json(
      { error: 'Hint non ancora disponibile', availableAt: thisHintAvailableAt?.toISOString() },
      { status: 403 }
    );
  }

  // Transazione: crea TeamHintUsed e deduce punti dal punteggio del team
  await prisma.$transaction([
    prisma.teamHintUsed.create({
      data: { teamId, hintId, usedAt: new Date() },
    }),
    prisma.sessionTeam.update({
      where: { id: sessionTeam.id },
      data: { score: { decrement: hint.pointsCost } },
    }),
    prisma.sessionEvent.create({
      data: {
        sessionId,
        teamId,
        eventType: 'hint_used',
        message: `Hint #${hint.order} usato (step ${hint.stepId})`,
        metadata: `hintId:${hintId}|order:${hint.order}|pointsCost:${hint.pointsCost}`,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    hintId: hint.id,
    type: hint.type,
    contentText: hint.contentText,
    contentUrl: hint.contentUrl,
    pointsDeducted: hint.pointsCost,
    newScore: sessionTeam.score - hint.pointsCost,
  })}
}