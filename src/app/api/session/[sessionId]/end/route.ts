import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Forza conclusione sessione
    const session = await prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completedAt: new Date()
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
    console.error('Errore conclusione sessione:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
