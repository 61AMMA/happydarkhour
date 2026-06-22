import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Whitelist MIME type → mediaType + estensione
const ALLOWED_MIME: Record<string, { mediaType: string; ext: string }> = {
  'image/jpeg':       { mediaType: 'IMAGE', ext: 'jpg' },
  'image/png':        { mediaType: 'IMAGE', ext: 'png' },
  'image/webp':       { mediaType: 'IMAGE', ext: 'webp' },
  'audio/mpeg':       { mediaType: 'AUDIO', ext: 'mp3' },
  'audio/wav':        { mediaType: 'AUDIO', ext: 'wav' },
  'audio/ogg':        { mediaType: 'AUDIO', ext: 'ogg' },
  'video/mp4':        { mediaType: 'VIDEO', ext: 'mp4' },
  'video/webm':       { mediaType: 'VIDEO', ext: 'webm' },
  'application/pdf':  { mediaType: 'PDF',   ext: 'pdf' },
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida: atteso multipart/form-data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'Campo "file" mancante nel form' }, { status: 400 });
  }

  // Validazione MIME
  const mimeType = file.type;
  const allowed = ALLOWED_MIME[mimeType];
  if (!allowed) {
    return NextResponse.json(
      { error: `Tipo file non consentito: ${mimeType}. Tipi accettati: ${Object.keys(ALLOWED_MIME).join(', ')}` },
      { status: 415 }
    );
  }

  // Validazione dimensione
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File troppo grande (max 50 MB, ricevuto ${(file.size / 1024 / 1024).toFixed(1)} MB)` },
      { status: 413 }
    );
  }

  // UUID v4 per naming anti-piracy
  const uuid = crypto.randomUUID();
  const filename = `${uuid}.${allowed.ext}`;
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const filePath = path.join(uploadsDir, filename);

  // Crea la directory se non esiste
  await mkdir(uploadsDir, { recursive: true });

  // Salva il file
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const url = `/uploads/${filename}`;

  return NextResponse.json({
    url,
    mediaType: allowed.mediaType,
    mimeType,
    fileSize: file.size,
    originalName: file.name,
  });
}
