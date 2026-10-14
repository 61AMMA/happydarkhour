import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// KAN-ASYNC: avvio individuale del cronometro di un tavolo (modalità ASINCRONA).
// Può essere richiamato sia dalla Console Operatore sia dalla pagina giocatore (/play):
// il primo dei due che lo chiama vince, l'azione è idempotente (non sovrascrive un avvio già registrato).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    const team = await prisma.sessionTeam.findUnique({
      where: { id: teamId },
      include: { session: true },
    });

    if (!team || !team.isActive) {
      return NextResponse.json({ error: 'Tavolo non trovato o non attivo' }, { status: 404 });
    }

    // cast: campo startedAt presente nel DB ma non ancora rigenerato nei tipi Prisma in questo ambiente
    const teamAny = team as any;

    if (team.session.status === 'completed' || team.session.status === 'expired') {
      return NextResponse.json({ error: 'La sessione è terminata' }, { status: 400 });
    }

    // Idempotente: se già avviato, ritorna lo stato attuale senza sovrascrivere l'istante di partenza
    if (teamAny.startedAt) {
      return NextResponse.json(team);
    }

    const now = new Date();

    const updated = await (prisma.sessionTeam as any).update({
      where: { id: teamId },
      data: { startedAt: now },
    });

    await prisma.sessionEvent.create({
      data: {
        sessionId: team.sessionId,
        teamId,
        eventType: 'session_start',
        message: `Tavolo "${team.teamName}" avviato (modalità asincrona)`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Errore avvio tavolo:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
