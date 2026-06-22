import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Legge sessione con tutti i dati correlati
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        venue: true,
        story: {
          include: {
            steps: {
              where: { isActive: true },
              orderBy: { stepNumber: 'asc' },
              include: {
                answers: true,
                hints: true,
              },
            },
          },
        },
        operator: true,
        teams: {
          where: { isActive: true },
          include: {
            progress: true,
            attempts: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sessione non trovata' },
        { status: 404 }
      );
    }

    // Calcola tempo rimanente
    const now = new Date();
    const startedAt = session.startedAt ? new Date(session.startedAt) : null;
    const maxDurationMs = session.maxDuration * 60 * 1000;
    const elapsedMs = startedAt ? now.getTime() - startedAt.getTime() : maxDurationMs;
    const remainingMs = Math.max(0, maxDurationMs - elapsedMs);

    // Determina se la sessione e scaduta
    const isExpired = remainingMs <= 0;

    // Se scaduta e non gia completata, aggiorna stato
    if (isExpired && session.status === 'active') {
      await prisma.gameSession.update({
        where: { id: sessionId },
        data: {
          status: 'expired',
          completedAt: now,
        },
      });
    }

    return NextResponse.json({
      ...session,
      timeRemaining: remainingMs,
      isExpired,
    });
  } catch (error) {
    console.error('Errore nel leggere sessione:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
