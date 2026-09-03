// KAN-clienti — GET + POST /api/venues/[venueId]/contacts (Contatti personale del locale)
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/venues/[venueId]/contacts — lista personale del locale
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
    const contacts = await prisma.venueContact.findMany({
      where: { venueId },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Errore nel leggere i contatti del locale:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// POST /api/venues/[venueId]/contacts — aggiungi una nuova riga di contatto personale
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

  const { firstName, lastName, phone, role } = body as {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    role?: string | null;
  };

  if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
    return NextResponse.json({ error: 'Il nome è obbligatorio' }, { status: 400 });
  }
  if (!lastName || typeof lastName !== 'string' || !lastName.trim()) {
    return NextResponse.json({ error: 'Il cognome è obbligatorio' }, { status: 400 });
  }

  try {
    const contact = await prisma.venueContact.create({
      data: {
        venueId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        role: role?.trim() || null,
      },
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione del contatto:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
