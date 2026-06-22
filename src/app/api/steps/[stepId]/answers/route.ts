// KAN-21 — POST /api/steps/[stepId]/answers
// Replace-all: sostituisce tutte le risposte dello step con il payload inviato.
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const { stepId } = await params;

  const step = await prisma.storyStep.findUnique({
    where: { id: stepId },
    select: { id: true, storyId: true, answerType: true },
  });
  if (!step) {
    return NextResponse.json({ error: 'Step non trovato' }, { status: 404 });
  }

  const activeSession = await prisma.gameSession.findFirst({
    where: { storyId: step.storyId, status: { in: ['active', 'paused'] } },
    select: { id: true },
  });
  if (activeSession) {
    return NextResponse.json(
      { error: 'Storia in uso da una sessione attiva.' },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  if (!Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Il body deve essere un array di risposte' },
      { status: 400 }
    );
  }

  interface AnswerPayload {
    answer?: string;
    points?: number;
    position?: number | null;
    groupLabel?: string | null;
    fieldLabel?: string | null;
    emptyAllowed?: boolean;
    motivationKeywords?: string | null;
  }

  const answers = body as AnswerPayload[];

  // Valida che ogni risposta abbia almeno il campo answer
  // Eccezione: campo "motivazione" (structured_choice_with_reason) usa motivationKeywords invece di answer
  for (const a of answers) {
    const hasMotivazioneKeywords = a.fieldLabel === 'motivazione' && a.motivationKeywords && a.motivationKeywords.trim();
    if (!a.emptyAllowed && !hasMotivazioneKeywords && (!a.answer || typeof a.answer !== 'string' || !a.answer.trim())) {
      return NextResponse.json(
        { error: 'Ogni risposta deve avere un valore non vuoto (o emptyAllowed=true)' },
        { status: 400 }
      );
    }
  }

  try {
    // Delete + recreate (SQLite non supporta upsert complesso)
    await prisma.stepAnswer.deleteMany({ where: { stepId } });

    // Per tipi multi-campo, aggiorna inputCount sullo step in base al numero di risposte
    const MULTI_INPUT_TYPES = ['multi_text_ordered', 'ordered_sequence_letters', 'multi_number_unordered', 'multi_group_ordered_numbers'];
    if (step.answerType && MULTI_INPUT_TYPES.includes(step.answerType)) {
      await prisma.storyStep.update({
        where: { id: stepId },
        data: { inputCount: answers.length },
      });
    }

    const created = await prisma.stepAnswer.createMany({
      data: answers.map((a) => ({
        stepId,
        answer: a.answer?.trim() ?? '',
        points: typeof a.points === 'number' ? a.points : 10,
        position: typeof a.position === 'number' ? a.position : null,
        groupLabel: a.groupLabel?.trim() ?? null,
        fieldLabel: a.fieldLabel?.trim() ?? null,
        emptyAllowed: a.emptyAllowed === true,
        motivationKeywords: a.motivationKeywords?.trim() ?? null,
      })),
    });

    const result = await prisma.stepAnswer.findMany({
      where: { stepId },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ count: created.count, answers: result });
  } catch (error) {
    console.error('Errore nel salvataggio delle risposte:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
