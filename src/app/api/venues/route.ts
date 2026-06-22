import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const venues = await prisma.venue.findMany({
      orderBy: { name: 'asc' }
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
