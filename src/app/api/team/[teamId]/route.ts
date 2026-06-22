import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    const team = await prisma.sessionTeam.findUnique({
      where: { id: teamId },
      include: {
        session: {
          include: {
            story: {
              include: {
                steps: {
                  where: { isActive: true },
                  orderBy: { stepNumber: 'asc' },
                },
              },
            },
          },
        },
        progress: true,
        attempts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team non trovato' }, { status: 404 });
    }

    const currentStep = team.progress
      ? await prisma.storyStep.findUnique({
          where: {
            id:
              team.session.story.steps.find(
                (s: any) => s.stepNumber === team.progress!.currentStep
              )?.id || '',
          },
          include: {
            answers: true,
            hints: true,
            media: { orderBy: { position: 'asc' } },
          },
        })
      : null;

    const totalSteps = team.session.story.steps.length;
    const isCompleted = team.progress?.completedAt ? true : false;

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.teamName,
        members: team.members,
        score: team.score,
        isActive: team.isActive,
      },
      progress: {
        currentStep: team.progress?.currentStep || 1,
        totalSteps,
        hintsUsed: team.progress?.hintsUsed || 0,
        totalScore: team.progress?.totalScore || 0,
        isCompleted,
      },
      currentStep,
      session: {
        id: team.session.id,
        status: team.session.status,
        startedAt: team.session.startedAt,
        maxDuration: team.session.maxDuration,
        story: {
          id: team.session.story.id,
          title: team.session.story.title,
          durationMin: team.session.story.durationMin,
        },
      },
    });
  } catch (error) {
    console.error('Errore nel leggere stato team:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
