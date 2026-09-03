import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/stories — lista storie
// KAN-21: ?all=true restituisce anche quelle disattive (per il Creator)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const all = searchParams.get('all') === 'true';

    const stories = await prisma.story.findMany({
      where: all ? undefined : { isActive: true },
      include: {
        steps: {
          where: { isActive: true },
          orderBy: { stepNumber: 'asc' },
          select: {
            id: true,
            stepNumber: true,
            title: true,
            answerType: true,
            isActive: true,
          },
        },
      },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json(stories);
  } catch (error) {
    console.error('Errore nel leggere stories:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// KAN-21: POST /api/stories — crea nuova storia
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const { title, description, introduzione, difficulty, durationMin, realStatus, digitalStatus } = body as {
    title?: string;
    description?: string;
    introduzione?: string;
    difficulty?: string;
    durationMin?: number;
    realStatus?: string;
    digitalStatus?: string;
  };

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Il titolo e obbligatorio' }, { status: 400 });
  }

  const validDifficulties = ['easy', 'medium', 'hard'];
  const resolvedDifficulty =
    difficulty && validDifficulties.includes(difficulty) ? difficulty : 'medium';

  // KAN — semafori stato storia: verde, giallo, rosso (String, non enum — vincolo SQLite)
  const validSemaforo = ['verde', 'giallo', 'rosso'];
  const resolvedRealStatus =
    realStatus && validSemaforo.includes(realStatus) ? realStatus : 'rosso';
  const resolvedDigitalStatus =
    digitalStatus && validSemaforo.includes(digitalStatus) ? digitalStatus : 'rosso';

  try {
    const story = await prisma.story.create({
      data: {
        title: title.trim(),
        description: description?.trim() ?? null,
        introduzione: introduzione?.trim() ?? null,
        difficulty: resolvedDifficulty,
        durationMin: typeof durationMin === 'number' && durationMin > 0 ? durationMin : 60,
        isActive: true,
        realStatus: resolvedRealStatus,
        digitalStatus: resolvedDigitalStatus,
      },
    });
    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione della storia:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
