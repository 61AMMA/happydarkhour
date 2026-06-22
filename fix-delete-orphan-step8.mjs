// Elimina lo step 8 orfano di "Storia Test" (creato senza risposte)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const stories = await prisma.story.findMany({ select: { id: true, title: true } });
  const target = stories.find(s => s.title.toLowerCase().includes('test'));
  if (!target) { console.log('Storia Test non trovata'); return; }

  const step = await prisma.storyStep.findFirst({
    where: { storyId: target.id, stepNumber: 8 },
    include: { _count: { select: { answers: true } } },
  });

  if (!step) { console.log('Step 8 non esiste — nessun problema.'); return; }
  console.log(`Step 8 trovato: "${step.title}" | risposte: ${step._count.answers}`);

  // Elimina hint e risposte prima dello step (foreign key)
  await prisma.stepHint.deleteMany({ where: { stepId: step.id } });
  await prisma.stepAnswer.deleteMany({ where: { stepId: step.id } });
  await prisma.storyStep.delete({ where: { id: step.id } });
  console.log('Step 8 eliminato. Ora puoi ricrearlo dal creator.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
