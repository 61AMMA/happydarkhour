import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const now = new Date();

    // cast: campo gameMode presente nel DB ma non ancora rigenerato nei tipi Prisma in questo ambiente
    const existing = await (prisma.gameSession as any).findUnique({ where: { id: sessionId } });
    if (!existing) {
      return NextResponse.json({ error: 'Sessione non trovata' }, { status: 404 });
    }

    // KAN-ASYNC: in SINCRONA l'avvio della sessione avvia anche tutti i tavoli nello stesso istante
    // (comportamento identico a prima dell'introduzione della modalità Asincrona).
    // In ASINCRONA la sala si apre ma ogni tavolo parte autonomamente (operatore o giocatore).
    if (existing.gameMode !== 'ASINCRONA') {
      await (prisma.sessionTeam as any).updateMany({
        where: { sessionId, startedAt: null },
        data: { startedAt: now },
      });
    }

    // Avvia sessione
    const session = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: 'active',
        startedAt: now
      },
      include: {
        venue: true,
        story: true,
        operator: true,
        teams: true
      }
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Errore avvio sessione:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
