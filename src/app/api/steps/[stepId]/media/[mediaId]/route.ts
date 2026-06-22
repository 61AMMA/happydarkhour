// KAN-28 — DELETE /api/steps/[stepId]/media/[mediaId]
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ stepId: string; mediaId: string }> }
) {
  const { stepId, mediaId } = await params;

  const media = await prisma.stepMedia.findFirst({
    where: { id: mediaId, stepId },
  });
  if (!media) {
    return NextResponse.json({ error: 'Media non trovato' }, { status: 404 });
  }

  // Elimina file fisico se è in /uploads/
  if (media.url.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', media.url);
    await unlink(filePath).catch(() => {}); // ignora se già eliminato
  }

  await prisma.stepMedia.delete({ where: { id: mediaId } });
  return NextResponse.json({ success: true });
}
