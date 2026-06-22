import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const operators = await prisma.user.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(operators);
  } catch (error) {
    console.error('Errore nel leggere operators:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
