import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await context.params;
    const body = await request.json();
    const { targetStep, reason } = body;

    if (!targetStep) {
      return NextResponse.json(
        { error: 'targetStep è obbligatorio' },
        { status: 400 }
      );
    }

    // Verifica che il team esista
    const team = await prisma.sessionTeam.findUnique({
      where: { id: teamId },
      include: {
        progress: true,
        session: {
          include: {
            story: {
              include: {
                steps: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
    });

    if (!team || !team.isActive) {
      return NextResponse.json(
        { error: 'Team non trovato o non attivo' },
        { status: 404 }
      );
    }

    const totalSteps = team.session.story.steps.length;
    const currentStep = team.progress?.currentStep || 1;

    // Validazioni
    if (targetStep < 1 || targetStep > totalSteps) {
      return NextResponse.json(
        { error: `Step deve essere tra 1 e ${totalSteps}` },
        { status: 400 }
      );
    }

    if (targetStep <= currentStep) {
      return NextResponse.json(
        { error: 'Puoi solo avanzare, non tornare indietro' },
        { status: 400 }
      );
    }

    // Aggiorna il progresso
    const isCompleted = targetStep > totalSteps;
    
    await prisma.teamProgress.update({
      where: { teamId },
      data: {
        currentStep: isCompleted ? totalSteps : targetStep,
        completedAt: isCompleted ? new Date() : undefined,
      },
    });

    // Crea evento di avanzamento manuale
    await prisma.sessionEvent.create({
      data: {
        sessionId: team.sessionId,
        teamId,
        eventType: 'step_completed',
        message: `Avanzamento manuale a Step ${targetStep}`,
        metadata: reason || `Forzato da operatore: ${currentStep} → ${targetStep}`,
      },
    });

    return NextResponse.json({
      success: true,
      previousStep: currentStep,
      newStep: isCompleted ? totalSteps : targetStep,
      isCompleted,
      reason: reason || 'Avanzamento manuale',
    });
  } catch (error) {
    console.error('Errore nell\'avanzare step:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
