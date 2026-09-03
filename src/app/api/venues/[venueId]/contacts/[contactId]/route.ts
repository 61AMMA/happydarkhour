// KAN-clienti — PUT + DELETE /api/venues/[venueId]/contacts/[contactId]
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/venues/[venueId]/contacts/[contactId] — modifica una riga di contatto personale
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ venueId: string; contactId: string }> }
) {
  const { venueId, contactId } = await params;

  const contact = await prisma.venueContact.findUnique({ where: { id: contactId } });
  if (!contact || contact.venueId !== venueId) {
    return NextResponse.json({ error: 'Contatto non trovato' }, { status: 404 });
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

  if (firstName !== undefined && (typeof firstName !== 'string' || !firstName.trim())) {
    return NextResponse.json({ error: 'Il nome è obbligatorio' }, { status: 400 });
  }
  if (lastName !== undefined && (typeof lastName !== 'string' || !lastName.trim())) {
    return NextResponse.json({ error: 'Il cognome è obbligatorio' }, { status: 400 });
  }

  try {
    const updated = await prisma.venueContact.update({
      where: { id: contactId },
      data: {
        ...(firstName !== undefined && { firstName: firstName.trim() }),
        ...(lastName !== undefined && { lastName: lastName.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(role !== undefined && { role: role?.trim() || null }),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Errore nell\'aggiornamento del contatto:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}

// DELETE /api/venues/[venueId]/contacts/[contactId] — rimuove una riga di contatto personale
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ venueId: string; contactId: string }> }
) {
  const { venueId, contactId } = await params;

  const contact = await prisma.venueContact.findUnique({ where: { id: contactId } });
  if (!contact || contact.venueId !== venueId) {
    return NextResponse.json({ error: 'Contatto non trovato' }, { status: 404 });
  }

  try {
    await prisma.venueContact.delete({ where: { id: contactId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore nell\'eliminazione del contatto:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
