// Imports prod-seed.json into the DB only if it's empty (no stories)
import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.story.count();
  if (count > 0) {
    console.log(`[seed-if-empty] DB already has ${count} stories, skipping.`);
    return;
  }

  const jsonFile = './prisma/prod-seed.json';
  if (!existsSync(jsonFile)) {
    console.log('[seed-if-empty] No prod-seed.json found, skipping.');
    return;
  }

  console.log('[seed-if-empty] DB is empty, importing prod-seed.json...');
  const data = JSON.parse(readFileSync(jsonFile, 'utf8'));

  // Insert in dependency order using upsert to avoid duplicates
  const tables = [
    ['users', 'user'],
    ['venues', 'venue'],
    ['stories', 'story'],
    ['story_steps', 'storyStep'],
    ['step_answers', 'stepAnswer'],
    ['step_hints', 'stepHint'],
    ['step_media', 'stepMedia'],
    ['game_sessions', 'gameSession'],
    ['session_teams', 'sessionTeam'],
    ['session_events', 'sessionEvent'],
    ['team_progress', 'teamProgress'],
    ['answer_attempts', 'answerAttempt'],
    ['team_hint_used', 'teamHintUsed'],
    ['step_first_clear', 'stepFirstClear'],
    ['validation_reviews', 'validationReview'],
  ];

  for (const [jsonKey, model] of tables) {
    const rows = data[jsonKey] || [];
    if (rows.length === 0) continue;
    let ok = 0;
    for (const row of rows) {
      try {
        await prisma[model].upsert({
          where: { id: row.id },
          update: {},
          create: row,
        });
        ok++;
      } catch (e) {
        console.warn(`[seed-if-empty] Skipped ${model} ${row.id}: ${e.message}`);
      }
    }
    console.log(`[seed-if-empty] ${model}: ${ok}/${rows.length} inserted`);
  }

  console.log('[seed-if-empty] Import complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
