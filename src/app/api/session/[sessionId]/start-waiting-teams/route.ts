import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// KAN-ASYNC: avvia in un unico istante tutti i tavoli di una sessione Asincrona
// ancora in attesa (startedAt null), cosi' partono "alla pari" e si vedono a
// vicenda nella Classifica in tempo reale (si vedono solo i tavoli partiti
// con te o prima di te: con lo stesso startedAt si vedono reciprocamente).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await prisma.gameSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      return NextResponse.json({ error: 'Sessione non trovata' }, { status: 404 });
    }
    if (session.status === 'completed' || session.status === 'expired') {
      return NextResponse.json({ error: 'La sessione è terminata' }, { status: 400 });
    }

    const now = new Date();

    const waitingTeams = await prisma.sessionTeam.findMany({
      where: { sessionId, isActive: true, startedAt: null },
      select: { id: true, teamName: true },
    });

    if (waitingTeams.length === 0) {
      return NextResponse.json({ startedCount: 0, startedAt: now });
    }

    await prisma.sessionTeam.updateMany({
      where: { id: { in: waitingTeams.map((t) => t.id) } },
      data: { startedAt: now },
    });

    await prisma.sessionEvent.createMany({
      data: waitingTeams.map((t) => ({
        sessionId,
        teamId: t.id,
        eventType: 'session_start',
        message: `Tavolo "${t.teamName}" avviato insieme ad altri ${waitingTeams.length - 1} tavoli (avvio multiplo asincrono)`,
      })),
    });

    return NextResponse.json({ startedCount: waitingTeams.length, startedAt: now });
  } catch (error) {
    console.error('Errore avvio multiplo tavoli:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
