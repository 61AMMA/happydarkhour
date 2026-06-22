import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    let session = await prisma.gameSession.findFirst({
      where: { status: 'active' },
      include: {
        venue: true,
        story: {
          include: {
            steps: {
              where: { isActive: true },
              orderBy: { stepNumber: 'asc' },
              include: { answers: true, hints: true },
            },
          },
        },
        operator: true,
        teams: {
          where: { isActive: true },
          include: {
            progress: true,
            attempts: { orderBy: { createdAt: 'desc' }, take: 5 },
          },
        },
        events: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!session) {
      session = await prisma.gameSession.findFirst({
        where: { status: 'created' },
        orderBy: { createdAt: 'desc' },
        include: {
          venue: true,
          story: {
            include: {
              steps: {
                where: { isActive: true },
                orderBy: { stepNumber: 'asc' },
                include: { answers: true, hints: true },
              },
            },
          },
          operator: true,
          teams: {
            where: { isActive: true },
            include: {
              progress: true,
              attempts: { orderBy: { createdAt: 'desc' }, take: 5 },
            },
          },
          events: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      });
    }

    if (!session) {
      return NextResponse.json({ error: 'Nessuna sessione trovata' }, { status: 404 });
    }

    const now = new Date();
    const startedAt = session.startedAt ? new Date(session.startedAt) : new Date();
    const maxDurationMs = session.maxDuration * 60 * 1000;
    const elapsedMs = now.getTime() - startedAt.getTime();
    const remainingMs = Math.max(0, maxDurationMs - elapsedMs);
    const isExpired = remainingMs <= 0;

    if (isExpired && session.status === 'active') {
      await prisma.gameSession.update({
        where: { id: session.id },
        data: { status: 'expired', completedAt: now },
      });
    }

    return NextResponse.json({ ...session, timeRemaining: remainingMs, isExpired });
  } catch (error) {
    console.error('Errore nel leggere sessioni:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { venueId, storyId, operatorId, maxDuration } = body;

    if (!venueId || !storyId || !operatorId) {
      return NextResponse.json(
        { error: 'venueId, storyId e operatorId sono obbligatori' },
        { status: 400 }
      );
    }

    await prisma.gameSession.updateMany({
      where: { status: 'active' },
      data: { status: 'completed', completedAt: new Date() },
    });

    const session = await prisma.gameSession.create({
      data: {
        venueId,
        storyId,
        operatorId,
        maxDuration: maxDuration || 60,
        status: 'created',
      },
      include: { venue: true, story: true, operator: true },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Errore nel creare sessione:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await prisma.gameSession.findFirst({
      where: { status: { in: ['active', 'created', 'expired'] } },
      include: { teams: true },
    });

    if (session) {
      const teamIds = session.teams.map((t: any) => t.id);
      await prisma.answerAttempt.deleteMany({ where: { teamId: { in: teamIds } } });
      await prisma.teamProgress.deleteMany({ where: { teamId: { in: teamIds } } });
      await prisma.sessionEvent.deleteMany({ where: { sessionId: session.id } });
      await prisma.sessionTeam.deleteMany({ where: { sessionId: session.id } });
      await prisma.gameSession.delete({ where: { id: session.id } });
    }

    return NextResponse.json({ success: true, message: 'Sessione eliminata' });
  } catch (error) {
    console.error('Errore nel cancellare sessione:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
