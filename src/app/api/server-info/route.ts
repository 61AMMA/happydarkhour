import { NextResponse } from 'next/server';
import os from 'os';

function getLanIp(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const entry of iface) {
      // Filtra: solo IPv4, non loopback (127.x.x.x), non link-local (169.254.x.x)
      if (
        entry.family === 'IPv4' &&
        !entry.internal &&
        !entry.address.startsWith('127.') &&
        !entry.address.startsWith('169.254.')
      ) {
        return entry.address;
      }
    }
  }
  return null;
}

export async function GET() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const lanIp = getLanIp();
  const baseUrl = lanIp ? `http://${lanIp}:${port}` : `http://localhost:${port}`;

  return NextResponse.json({ lanIp, port, baseUrl });
}
