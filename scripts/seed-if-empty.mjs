// Imports prod-seed.sql into the DB only if it's empty (no stories)
import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.story.count();
  if (count > 0) {
    console.log(`[seed-if-empty] DB already has ${count} stories, skipping.`);
    return;
  }

  const sqlFile = './prisma/prod-seed.sql';
  if (!existsSync(sqlFile)) {
    console.log('[seed-if-empty] No prod-seed.sql found, skipping.');
    return;
  }

  console.log('[seed-if-empty] DB is empty, importing prod-seed.sql...');
  const sql = readFileSync(sqlFile, 'utf8');

  // Split on semicolons but keep statements intact
  const statements = sql
    .split('\n')
    .filter(l => !l.startsWith('--'))
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.match(/^(BEGIN TRANSACTION|COMMIT|PRAGMA)/i));

  let ok = 0, skip = 0;
  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      ok++;
    } catch (e) {
      skip++;
    }
  }

  console.log(`[seed-if-empty] Done. ${ok} statements OK, ${skip} skipped.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
