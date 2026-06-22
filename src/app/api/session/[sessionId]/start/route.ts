import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Avvia sessione
    const session = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: 'active',
        startedAt: new Date()
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
