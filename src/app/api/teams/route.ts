import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId è obbligatorio' },
        { status: 400 }
      );
    }

    // Ottieni tutti i team della sessione
    const teams = await prisma.sessionTeam.findMany({
      where: { sessionId },
      include: {
        progress: true
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Errore nel leggere team:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, teamName, members } = body;

    if (!sessionId || !teamName) {
      return NextResponse.json(
        { error: 'sessionId e teamName sono obbligatori' },
        { status: 400 }
      );
    }

    // Crea nuovo team
    const team = await prisma.sessionTeam.create({
      data: {
        sessionId,
        teamName,
        members: members || 2
      }
    });

    // Crea progress iniziale
    await prisma.teamProgress.create({
      data: {
        teamId: team.id,
        currentStep: 1,
        hintsUsed: 0,
        totalScore: 0,
        isCompleted: false
      }
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Errore nel creare team:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
