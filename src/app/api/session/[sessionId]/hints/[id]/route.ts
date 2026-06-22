import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// KAN-19: GET /api/session/[sessionId]/hints/[id]
// [id] = stepId — restituisce lo stato di ogni hint per il team che fa la richiesta
// Query param: teamId (obbligatorio)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; id: string }> }
) {
  const { sessionId, id: stepId } = await params;
  const teamId = request.nextUrl.searchParams.get('teamId');

  if (!teamId) {
    return NextResponse.json({ error: 'teamId richiesto come query param' }, { status: 400 });
  }

  // Carica hint dello step ordinati per order
  const hints = await prisma.stepHint.findMany({
    where: { stepId },
    orderBy: { order: 'asc' },
    include: {
      usages: { where: { teamId }, select: { id: true } },
    },
  });

  if (hints.length === 0) {
    return NextResponse.json([]);
  }

  // Carica la prima clear di questo step nella sessione (trigger base)
  const firstClear = await prisma.stepFirstClear.findUnique({
    where: { sessionId_stepId: { sessionId, stepId } },
  });

  const now = new Date();

  // Calcola stato di ogni hint sequenzialmente
  // Hint 1: disponibile dopo firstClear.clearedAt + hint1.triggerMinutesAfterFirstClear
  // Hint N: disponibile dopo che hint N-1 è diventato available + hintN.triggerMinutesAfterFirstClear
  let previousAvailableAt: Date | null = firstClear ? new Date(firstClear.clearedAt) : null;

  const result = hints.map((hint) => {
    const used = hint.usages.length > 0;

    let availableAt: Date | null = null;
    let status: 'locked' | 'available' | 'used' = 'locked';

    if (previousAvailableAt !== null) {
      availableAt = new Date(
        previousAvailableAt.getTime() + hint.triggerMinutesAfterFirstClear * 60 * 1000
      );
      if (used) {
        status = 'used';
      } else if (now >= availableAt) {
        status = 'available';
      } else {
        status = 'locked';
      }
    }

    // Il prossimo hint usa il momento in cui questo hint è diventato/diventa available
    previousAvailableAt = availableAt;

    return {
      id: hint.id,
      order: hint.order,
      type: hint.type,
      pointsCost: hint.pointsCost,
      triggerMinutesAfterFirstClear: hint.triggerMinutesAfterFirstClear,
      status,
      availableAt: availableAt?.toISOString() ?? null,
      // Contenuto: visibile solo se available o used
      ...(status !== 'locked' && {
        contentText: hint.contentText,
        contentUrl: hint.contentUrl,
      }),
    };
  });

  return NextResponse.json(result);
}
