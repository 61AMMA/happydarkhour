import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// KAN-ASYNC: classifica "fantasma" in stile GOST per la modalità ASINCRONA.
// Non restituisce punteggi assoluti: per ogni tavolo avversario che ha iniziato
// con te o prima di te, restituisce la durata (in secondi) impiegata per ciascuna
// fase della storia, così il client può "rigiocarle" sul proprio cronometro
// (il segmento fase i di un avversario si accende quando il TUO tempo trascorso
// supera il tempo che quell'avversario impiegò per arrivare in fondo alla fase i).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({ error: 'teamId è obbligatorio' }, { status: 400 });
    }

    // cast: campo startedAt presente nel DB ma non ancora rigenerato nei tipi Prisma in questo ambiente
    const viewerTeam = await (prisma.sessionTeam as any).findUnique({
      where: { id: teamId },
    });

    if (!viewerTeam) {
      return NextResponse.json({ error: 'Tavolo non trovato' }, { status: 404 });
    }

    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        story: {
          include: {
            steps: {
              where: { isActive: true },
              orderBy: { stepNumber: 'asc' },
              select: { id: true, stepNumber: true },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Sessione non trovata' }, { status: 404 });
    }

    const totalSteps = session.story.steps.length;
    const stepOrder = session.story.steps.map((s) => s.id);

    if (!viewerTeam.startedAt) {
      return NextResponse.json({ sessionId, totalSteps, viewerStartedAt: null, opponents: [] });
    }

    // Solo tavoli partiti con te o prima di te (mai chi ha iniziato dopo), esclude te stesso
    const opponentTeams = await (prisma.sessionTeam as any).findMany({
      where: {
        sessionId,
        id: { not: teamId },
        startedAt: { not: null, lte: viewerTeam.startedAt },
      },
      select: { id: true, teamName: true, startedAt: true },
    });

    const opponents = await Promise.all(
      opponentTeams.map(async (opp: { id: string; teamName: string; startedAt: Date }) => {
        const correctAttempts = await prisma.answerAttempt.findMany({
          where: { teamId: opp.id, isCorrect: true, stepId: { in: stepOrder } },
          orderBy: { createdAt: 'asc' },
        });

        // Prima risposta corretta per ciascuno step (non si "retrocede": la prima vale)
        const firstCorrectByStep = new Map<string, Date>();
        for (const attempt of correctAttempts) {
          if (!firstCorrectByStep.has(attempt.stepId)) {
            firstCorrectByStep.set(attempt.stepId, attempt.createdAt);
          }
        }

        let previousTime = opp.startedAt;
        const phaseDurationsSeconds: Array<number | null> = [];
        for (const stepId of stepOrder) {
          const clearedAt = firstCorrectByStep.get(stepId);
          if (!clearedAt) {
            phaseDurationsSeconds.push(null); // fase non ancora superata da questo avversario
            continue;
          }
          const durationSec = Math.max(0, Math.round((clearedAt.getTime() - previousTime.getTime()) / 1000));
          phaseDurationsSeconds.push(durationSec);
          previousTime = clearedAt;
        }

        return {
          teamId: opp.id,
          teamName: opp.teamName,
          phaseDurationsSeconds,
        };
      })
    );

    return NextResponse.json({
      sessionId,
      totalSteps,
      viewerStartedAt: viewerTeam.startedAt,
      opponents,
    });
  } catch (error) {
    console.error('Errore nel calcolare classifica GOST:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
