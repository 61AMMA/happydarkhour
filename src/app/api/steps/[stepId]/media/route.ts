// KAN-28/29 — GET + POST /api/steps/[stepId]/media
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const { stepId } = await params;
  const media = await prisma.stepMedia.findMany({
    where: { stepId },
    orderBy: { position: 'asc' },
  });
  return NextResponse.json(media);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const { stepId } = await params;

  const step = await prisma.storyStep.findUnique({
    where: { id: stepId },
    select: { id: true },
  });
  if (!step) {
    return NextResponse.json({ error: 'Step non trovato' }, { status: 404 });
  }

  let body: { url: string; mediaType: string; mimeType: string; fileSize: number; originalName: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const { url, mediaType, mimeType, fileSize, originalName } = body;
  if (!url || !mediaType) {
    return NextResponse.json({ error: 'url e mediaType sono obbligatori' }, { status: 400 });
  }

  // Posizione = ultimo + 1
  const last = await prisma.stepMedia.findFirst({
    where: { stepId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  const media = await prisma.stepMedia.create({
    data: {
      stepId,
      url,
      mediaType,
      mimeType: mimeType ?? '',
      fileSize: fileSize ?? 0,
      originalName: originalName ?? '',
      position: (last?.position ?? 0) + 1,
    },
  });

  return NextResponse.json(media, { status: 201 });
}
