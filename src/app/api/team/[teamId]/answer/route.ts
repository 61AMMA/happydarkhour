import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { areAnswersEquivalent, isStructuredAnswerType, validateStructuredAnswer } from '@/lib/validation';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const body = await request.json();
    const { answer, stepId } = body;

    if (!answer || !stepId) {
      return NextResponse.json(
        { error: 'Answer e stepId sono obbligatori' },
        { status: 400 }
      );
    }

    // Verifica che il team esista e sia attivo
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
                  include: {
                    answers: true,
                  },
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

    // Verifica che lo step sia quello corrente del team
    const currentStepNumber = team.progress?.currentStep || 1;
    const currentStep = team.session.story.steps.find(
      (s: any) => s.stepNumber === currentStepNumber
    );

    if (!currentStep || currentStep.id !== stepId) {
      return NextResponse.json(
        { error: 'Step non valido o non corrente' },
        { status: 400 }
      );
    }

    // Risposta salvata trimmata a 1000 chars
    const savedAnswer = answer.trim().substring(0, 1000);

    // Validazione automatica
    let correctAnswer: any = null;
    let isCorrect = false;
    let points = 0;

    const answerType: string = (currentStep as any).answerType ?? 'text_single';

    if (isStructuredAnswerType(answerType)) {
      // Tipi strutturati: passa JSON al dispatcher
      isCorrect = validateStructuredAnswer(answer, answerType, currentStep.answers);
      if (isCorrect) {
        // Usa il points massimo tra tutti gli answers
        points = Math.max(...currentStep.answers.map((a: any) => a.points || 0), 0);
        correctAnswer = currentStep.answers.reduce(
          (max: any, a: any) => (a.points >= (max?.points ?? 0) ? a : max),
          null
        );
      }
    } else {
      // text_single / number_single con supporto varianti pipe
      for (const stepAnswer of currentStep.answers) {
        const variants = stepAnswer.answer.split('|').map((v: string) => v.trim());
        for (const variant of variants) {
          if (areAnswersEquivalent(answer, variant)) {
            correctAnswer = stepAnswer;
            isCorrect = true;
            break;
          }
        }
        if (isCorrect) break;
      }
      points = isCorrect ? (correctAnswer?.points || 10) : 0;
    }

    // Crea il tentativo
    const attempt = await prisma.answerAttempt.create({
      data: {
        teamId,
        stepId,
        answer: savedAnswer,
        isCorrect,
        points,
        hintUsed: false,
      },
    });

    // Se la risposta è corretta, aggiorna il progresso
    if (isCorrect) {
      const nextStepNumber = currentStepNumber + 1;
      const totalSteps = team.session.story.steps.length;
      const isCompleted = nextStepNumber > totalSteps;

      // KAN-19: Registra prima clear dello step nella sessione (trigger hint)
      await prisma.stepFirstClear.upsert({
        where: { sessionId_stepId: { sessionId: team.sessionId, stepId } },
        create: { sessionId: team.sessionId, stepId, clearedAt: new Date() },
        update: {}, // già esiste — non sovrascrivere clearedAt
      });

      await prisma.teamProgress.update({
        where: { teamId },
        data: {
          currentStep: isCompleted ? currentStepNumber : nextStepNumber,
          totalScore: {
            increment: points,
          },
          isCompleted: isCompleted ? true : undefined,
          completedAt: isCompleted ? new Date() : undefined,
        },
      });

      await prisma.sessionTeam.update({
        where: { id: teamId },
        data: {
          score: {
            increment: points,
          },
        },
      });

      await prisma.sessionEvent.create({
        data: {
          sessionId: team.sessionId,
          teamId,
          eventType: 'step_completed',
          message: `Step ${currentStepNumber} completato correttamente`,
          metadata: `Risposta: "${savedAnswer}" | Punti: ${points}`,
        },
      });

      return NextResponse.json({
        success: true,
        isCorrect: true,
        points,
        nextStep: isCompleted ? null : nextStepNumber,
        isCompleted,
        attempt,
      });
    } else {
      await prisma.sessionEvent.create({
        data: {
          sessionId: team.sessionId,
          teamId,
          eventType: 'answer_submitted',
          message: `Risposta errata per Step ${currentStepNumber}`,
          metadata: `Risposta: "${savedAnswer}"`,
        },
      });

      return NextResponse.json({
        success: false,
        isCorrect: false,
        points: 0,
        nextStep: currentStepNumber,
        isCompleted: false,
        attempt,
      });
    }
  } catch (error) {
    console.error('Errore nell\'inviare risposta:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
