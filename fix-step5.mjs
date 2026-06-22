// Script temporaneo — aggiorna step 5 risposte a A,A,A,A
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Lista tutte le storie per debug
  const stories = await prisma.story.findMany({ select: { id: true, title: true } });
  console.log('Storie trovate:', stories.map(s => `"${s.title}" (${s.id})`).join(', '));

  // Prendi la prima storia (o quella con "test" nel titolo)
  const story = stories.find(s => s.title.toLowerCase().includes('test')) ?? stories[0];
  if (!story) { console.log('Nessuna storia'); return; }
  console.log('Usando storia:', story.title);

  // Trova step 5
  const step = await prisma.storyStep.findFirst({
    where: { storyId: story.id, stepNumber: 5 },
    select: { id: true, answerType: true, inputCount: true },
  });
  if (!step) { console.log('Step 5 non trovato'); return; }
  console.log('Step 5:', step.id, '| tipo:', step.answerType, '| inputCount:', step.inputCount);

  // Mostra risposte attuali
  const current = await prisma.stepAnswer.findMany({ where: { stepId: step.id } });
  console.log('Risposte attuali:', current.map(a => `pos${a.position}="${a.answer}"`).join(', '));

  // Sostituisci con A,A,A,A
  await prisma.stepAnswer.deleteMany({ where: { stepId: step.id } });
  const created = await prisma.stepAnswer.createMany({
    data: [1, 2, 3, 4].map(pos => ({
      stepId: step.id,
      answer: 'A',
      points: 10,
      position: pos,
    })),
  });
  console.log('Nuove risposte create:', created.count);

  await prisma.storyStep.update({ where: { id: step.id }, data: { inputCount: 4 } });
  console.log('inputCount impostato a 4. Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
