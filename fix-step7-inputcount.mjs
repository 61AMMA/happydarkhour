// Fix temporaneo: imposta inputCount=5 per step 7 di "Storia Test"
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const story = await prisma.story.findFirst({
    where: {},
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  });

  // Trova "Storia Test"
  const stories = await prisma.story.findMany({ select: { id: true, title: true } });
  const target = stories.find(s => s.title.toLowerCase().includes('test'));
  if (!target) { console.log('Storia Test non trovata. Storie:', stories.map(s => s.title)); return; }
  console.log('Storia:', target.title);

  const step = await prisma.storyStep.findFirst({
    where: { storyId: target.id, stepNumber: 7 },
    select: { id: true, answerType: true, inputCount: true },
  });
  if (!step) { console.log('Step 7 non trovato'); return; }
  console.log('Step 7:', step.id, '| tipo:', step.answerType, '| inputCount attuale:', step.inputCount);

  const answers = await prisma.stepAnswer.findMany({ where: { stepId: step.id } });
  console.log('Risposte:', answers.map(a => a.answer).join(', '));

  await prisma.storyStep.update({
    where: { id: step.id },
    data: { inputCount: answers.length },
  });
  console.log('inputCount aggiornato a', answers.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
