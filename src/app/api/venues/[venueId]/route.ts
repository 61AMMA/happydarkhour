// KAN-clienti — GET + PUT + DELETE /api/venues/[venueId]
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/venues/[venueId] — dettaglio locale + contatti personale
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;

  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    include: {
      contacts: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!venue) {
    return NextResponse.json({ error: 'Locale non trovato' }, { status: 404 });
  }

  return NextResponse.json(venue);
}

// PUT /api/venues/[venueId] — aggiorna dati locale + contatti (sezione Contatti del locale)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;

  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) {
    return NextResponse.json({ error: 'Locale non trovato' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const {
    name,
    description,
    isActive,
    phone,
    street,
    streetNumber,
    postalCode,
    city,
    province,
    openingHours,
  } = body as {
    name?: string;
    description?: string | null;
    isActive?: boolean;
    phone?: string | null;
    street?: string | null;
    streetNumber?: string | null;
    postalCode?: string | null;
    city?: string | null;
    province?: string | null;
    openingHours?: string | null;
  };

  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    return NextResponse.json({ error: 'Il nome del locale è obbligatorio' }, { status: 400 });
  }

  try {
    const updated = await prisma.venue.update({
      where: { id: venueId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(street !== undefined && { street: street?.trim() || null }),
        ...(streetNumber !== undefined && { streetNumber: streetNumber?.trim() || null }),
        ...(postalCode !== undefined && { postalCode: postalCode?.trim() || null }),
        ...(city !== undefined && { city: city?.trim() || null }),
        ...(province !== undefined && { province: province?.trim() || null }),
        ...(openingHours !== undefined && { openingHours: openingHours?.trim() || null }),
      },
      include: { contacts: { orderBy: { createdAt: 'asc' } } },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Errore nell\'aggiornamento del locale:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// DELETE /api/venues/[venueId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;

  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) {
    return NextResponse.json({ error: 'Locale non trovato' }, { status: 404 });
  }

  const existingSession = await prisma.gameSession.findFirst({
    where: { venueId },
    select: { id: true },
  });
  if (existingSession) {
    return NextResponse.json(
      { error: 'Impossibile eliminare: il locale ha sessioni di gioco collegate.' },
      { status: 409 }
    );
  }

  try {
    // contacts ed events cascadano da Venue (onDelete: Cascade)
    await prisma.venue.delete({ where: { id: venueId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore nell\'eliminazione del locale:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
