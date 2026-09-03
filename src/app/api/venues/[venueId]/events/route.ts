// KAN-clienti — GET + POST /api/venues/[venueId]/events (Storico serate del locale)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/venues/[venueId]/events — storico serate, più recenti prima
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;

  const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { id: true } });
  if (!venue) {
    return NextResponse.json({ error: 'Locale non trovato' }, { status: 404 });
  }

  try {
    const events = await prisma.venueEvent.findMany({
      where: { venueId },
      include: { story: { select: { id: true, title: true } } },
      orderBy: { eventDate: 'desc' },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error('Errore nel leggere lo storico serate:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// POST /api/venues/[venueId]/events — registra una nuova serata (locale + storia + data + note)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;

  const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { id: true } });
  if (!venue) {
    return NextResponse.json({ error: 'Locale non trovato' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const { storyId, eventDate, notes } = body as {
    storyId?: string;
    eventDate?: string;
    notes?: string | null;
  };

  if (!storyId || typeof storyId !== 'string') {
    return NextResponse.json({ error: 'La storia è obbligatoria' }, { status: 400 });
  }
  if (!eventDate || typeof eventDate !== 'string' || Number.isNaN(Date.parse(eventDate))) {
    return NextResponse.json({ error: 'La data della serata non è valida' }, { status: 400 });
  }

  const story = await prisma.story.findUnique({ where: { id: storyId }, select: { id: true } });
  if (!story) {
    return NextResponse.json({ error: 'Storia non trovata' }, { status: 404 });
  }

  try {
    const event = await prisma.venueEvent.create({
      data: {
        venueId,
        storyId,
        eventDate: new Date(eventDate),
        notes: notes?.trim() || null,
      },
      include: { story: { select: { id: true, title: true } } },
    });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione della serata:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
