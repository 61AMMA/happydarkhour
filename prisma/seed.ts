import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Inizio seed database Happy Dark Hour...');

  try {
    // 1. Creare venue
    const venue = await prisma.venue.create({
      data: {
        name: 'The Dark Pub',
        address: 'Via Mistero 123, Milano',
        description: 'Locale perfetto per escape game notturni',
        isActive: true,
      },
    });
    console.log('Venue creato:', venue.name);

    // 2. Creare utente operatore
    const operator = await prisma.user.create({
      data: {
        email: 'operator@darkpub.com',
        name: 'Mario Operator',
        role: 'operator',
      },
    });
    console.log('Operatore creato:', operator.name);

    // 3. Creare storia demo
    const story = await prisma.story.create({
      data: {
        title: 'Il Mistero della Birra Scomparsa',
        description: 'Una serata normale al pub si trasforma in un enigma quando la birra speciale scompare. Trovate indizi e risolvete gli enigmi prima che chiuda!',
        difficulty: 'medium',
        durationMin: 60,
        isActive: true,
      },
    });
    console.log('Storia creata:', story.title);

    // 4. Creare 4 step lineari
    const steps = [];
    for (let i = 1; i <= 4; i++) {
      const step = await prisma.storyStep.create({
        data: {
          storyId: story.id,
          stepNumber: i,
          title: `Step ${i}: ${getStepTitle(i)}`,
          description: getStepDescription(i),
          question: getStepQuestion(i),
          answerType: 'text',
          isActive: true,
        },
      });
      steps.push(step);
      console.log(`Step ${i} creato:`, step.title);
    }

    // 5. Creare risposte valide per ogni step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const answer = await prisma.stepAnswer.create({
        data: {
          stepId: step.id,
          answer: getCorrectAnswer(i + 1),
          points: 10,
        },
      });
      console.log(`Risposta creata per Step ${i + 1}:`, answer.answer);
    }

    // 6. Creare hint per ogni step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const hint = await prisma.stepHint.create({
        data: {
          stepId: step.id,
          order: 1,
          type: 'TEXT',
          contentText: getStepHint(i + 1),
          pointsCost: 5,
          triggerMinutesAfterFirstClear: 5,
        },
      });
      console.log(`Hint creato per Step ${i + 1}:`, hint.contentText);
    }

    // 7. Creare sessione demo
    const session = await prisma.gameSession.create({
      data: {
        venueId: venue.id,
        storyId: story.id,
        operatorId: operator.id,
        status: 'active',
        startedAt: new Date(),
        maxDuration: 60,
      },
    });
    console.log('Sessione creata:', session.id);

    // 8. Creare team demo
    const team = await prisma.sessionTeam.create({
      data: {
        sessionId: session.id,
        teamName: 'Team Alpha',
        members: 3,
        score: 0,
        isActive: true,
      },
    });
    console.log('Team creato:', team.teamName);

    // 9. Inizializzare TeamProgress (coerente con primo step)
    const progress = await prisma.teamProgress.create({
      data: {
        teamId: team.id,
        currentStep: 1, // Primo step attivo
        hintsUsed: 0,
        totalScore: 0,
      },
    });
    console.log('TeamProgress inizializzato - Step corrente:', progress.currentStep);

    // 10. Creare evento di inizio sessione
    const event = await prisma.sessionEvent.create({
      data: {
        sessionId: session.id,
        teamId: team.id,
        eventType: 'session_start',
        message: 'Sessione iniziata con Team Alpha',
        metadata: 'Seed database iniziale',
      },
    });
    console.log('Evento sessione creato:', event.eventType);

    console.log('\n=== SEED COMPLETATO CON SUCCESSO ===');
    console.log('Dati creati:');
    console.log('- Venue:', venue.name);
    console.log('- Operatore:', operator.name);
    console.log('- Storia:', story.title);
    console.log('- Steps:', steps.length);
    console.log('- Sessione:', session.id);
    console.log('- Team:', team.teamName);
    console.log('- Progress:', `Step ${progress.currentStep}/${steps.length}`);

  } catch (error) {
    console.error('ERRORE durante il seed:', error);
    throw error;
  }
}

// Funzioni helper per i dati demo
function getStepTitle(stepNumber: number): string {
  const titles = [
    'L\'Inizio del Mistero',
    'Le Tracce del Barista',
    'Il Codice Frigorifero',
    'La Rivelazione Finale'
  ];
  return titles[stepNumber - 1];
}

function getStepDescription(stepNumber: number): string {
  const descriptions = [
    'La birra speciale è scomparsa dal bancone. Indagate nell\'area del bar per trovare il primo indizio.',
    'Il barista ha lasciato delle strane note. Trovate il significato di questi simboli enigmatici.',
    'Il frigorifero è bloccato con un codice numerico. Usate gli indizi trovati per aprirlo.',
    'Avete trovato la birra! Ma c\'è un ultimo enigma da risolvere per completare la missione.'
  ];
  return descriptions[stepNumber - 1];
}

function getStepQuestion(stepNumber: number): string {
  const questions = [
    'Quale ingrediente segreto viene menzionato nel biglietto trovato sotto il bancone?',
    'Qual è la somma dei numeri scritti sul tovagliolo del barista?',
    'Qual è il codice a 4 cifre che apre il frigorifero?',
    'Chi è il vero responsabile della scomparsa della birra speciale?'
  ];
  return questions[stepNumber - 1];
}

function getCorrectAnswer(stepNumber: number): string {
  const answers = [
    'zenzero',
    '42',
    '1984',
    'il barista'
  ];
  return answers[stepNumber - 1];
}

function getStepHint(stepNumber: number): string {
  const hints = [
    'Cercate qualcosa di verde e aromatico... non è il lime!',
    'Contate i segni sul tovagliolo, non le parole.',
    'Pensate a un famoso libro distopico...',
    'A volte il colpevole è più vicino di quanto pensiate...'
  ];
  return hints[stepNumber - 1];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
