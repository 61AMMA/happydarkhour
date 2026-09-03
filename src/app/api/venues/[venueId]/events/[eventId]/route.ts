// KAN-clienti — PUT + DELETE /api/venues/[venueId]/events/[eventId]
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/venues/[venueId]/events/[eventId] — modifica storia/data/note della serata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ venueId: string; eventId: string }> }
) {
  const { venueId, eventId } = await params;

  const event = await prisma.venueEvent.findUnique({ where: { id: eventId } });
  if (!event || event.venueId !== venueId) {
    return NextResponse.json({ error: 'Serata non trovata' }, { status: 404 });
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

  if (storyId !== undefined) {
    const story = await prisma.story.findUnique({ where: { id: storyId }, select: { id: true } });
    if (!story) {
      return NextResponse.json({ error: 'Storia non trovata' }, { status: 404 });
    }
  }

  if (eventDate !== undefined && Number.isNaN(Date.parse(eventDate))) {
    return NextResponse.json({ error: 'La data della serata non è valida' }, { status: 400 });
  }

  try {
    const updated = await prisma.venueEvent.update({
      where: { id: eventId },
      data: {
        ...(storyId !== undefined && { storyId }),
        ...(eventDate !== undefined && { eventDate: new Date(eventDate) }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
      },
      include: { story: { select: { id: true, title: true } } },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Errore nell\'aggiornamento della serata:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// DELETE /api/venues/[venueId]/events/[eventId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ venueId: string; eventId: string }> }
) {
  const { venueId, eventId } = await params;

  const event = await prisma.venueEvent.findUnique({ where: { id: eventId } });
  if (!event || event.venueId !== venueId) {
    return NextResponse.json({ error: 'Serata non trovata' }, { status: 404 });
  }

  try {
    await prisma.venueEvent.delete({ where: { id: eventId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore nell\'eliminazione della serata:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
