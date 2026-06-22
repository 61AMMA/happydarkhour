import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const body = await request.json();
    const { teamName, members } = body;

    // Aggiorna team
    const team = await prisma.sessionTeam.update({
      where: { id: teamId },
      data: {
        ...(teamName && { teamName }),
        ...(members && { members })
      }
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error('Errore nel aggiornare team:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    // Elimina team (cascade eliminerà progress e attempts)
    await prisma.sessionTeam.delete({
      where: { id: teamId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore nel eliminare team:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
