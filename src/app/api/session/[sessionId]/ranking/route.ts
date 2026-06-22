import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Verifica che la sessione esista
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        teams: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sessione non trovata' },
        { status: 404 }
      );
    }

    // Conta gli step attivi della storia
    const totalSteps = await prisma.storyStep.count({
      where: { storyId: session.storyId, isActive: true },
    });

    // Carica i team con i loro progress
    const teamsWithProgress = await prisma.sessionTeam.findMany({
      where: {
        sessionId: sessionId,
      },
      include: {
        progress: true,
      },
    });

    // Calcola ranking per tutti i team
    const teamRankings = teamsWithProgress.map((team) => {
      const progress = team.progress;
      const isCompleted = progress?.isCompleted ?? false;
      const score = progress?.totalScore ?? team.score ?? 0;
      const completedAt = progress?.completedAt ?? null;

      return {
        teamId: team.id,
        teamName: team.teamName,
        totalScore: score,
        hintsUsed: progress?.hintsUsed ?? 0,
        currentStep: progress?.currentStep ?? 1,
        totalSteps,
        isCompleted,
        completedAt,
        sortKey: {
          completed: isCompleted ? 1 : 0,
          score,
          time: completedAt ? new Date(completedAt).getTime() : 0,
        },
      };
    });

    // Ordina secondo criterio: completati prima, poi punteggio, poi tempo
    teamRankings.sort((a, b) => {
      // Prima i completati
      if (a.sortKey.completed !== b.sortKey.completed) {
        return b.sortKey.completed - a.sortKey.completed;
      }
      
      // Poi per punteggio (decrescente)
      if (a.sortKey.score !== b.sortKey.score) {
        return b.sortKey.score - a.sortKey.score;
      }
      
      // Poi per tempo (crescente - chi prima completa meglio)
      if (a.sortKey.time !== b.sortKey.time) {
        return a.sortKey.time - b.sortKey.time;
      }
      
      return 0;
    });

    // Aggiungi posizione ranking
    const rankedTeams = teamRankings.map((team, index) => ({
      ...team,
      position: index + 1,
      // Rimuovi chiave temporanea
      sortKey: undefined,
    }));

    return NextResponse.json({
      sessionId,
      sessionStatus: session.status,
      totalTeams: rankedTeams.length,
      teams: rankedTeams,
    });

  } catch (error) {
    console.error('Errore nel calcolare ranking:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
