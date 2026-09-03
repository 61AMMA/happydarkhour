// KAN-clienti — GET + POST /api/venues
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/venues — lista locali (sezione Clienti del Creator)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const all = searchParams.get('all') === 'true';

    const venues = await prisma.venue.findMany({
      where: all ? undefined : { isActive: true },
      include: {
        _count: { select: { contacts: true, events: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(venues);
  } catch (error) {
    console.error('Errore nel leggere venues:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

// KAN-clienti — POST /api/venues — crea nuovo locale
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const { name, description, phone, street, streetNumber, postalCode, city, province, openingHours } =
    body as {
      name?: string;
      description?: string | null;
      phone?: string | null;
      street?: string | null;
      streetNumber?: string | null;
      postalCode?: string | null;
      city?: string | null;
      province?: string | null;
      openingHours?: string | null;
    };

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Il nome del locale è obbligatorio' }, { status: 400 });
  }

  try {
    const venue = await prisma.venue.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        phone: phone?.trim() || null,
        street: street?.trim() || null,
        streetNumber: streetNumber?.trim() || null,
        postalCode: postalCode?.trim() || null,
        city: city?.trim() || null,
        province: province?.trim() || null,
        openingHours: openingHours?.trim() || null,
        isActive: true,
      },
    });
    return NextResponse.json(venue, { status: 201 });
  } catch (error) {
    console.error('Errore nella creazione del locale:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
