import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Inizio seed La Garduña...');

  // Upsert User
  const user = await prisma.user.upsert({
    where: { email: 'admin@happydarkhour.local' },
    update: {},
    create: {
      email: 'admin@happydarkhour.local',
      name: 'Admin HappyDarkHour',
      role: 'admin',
    },
  });
  console.log('User:', user.email);

  // Upsert Venue
  const venue = await prisma.venue.upsert({
    where: { id: 'venue-garduna' },
    update: {},
    create: {
      id: 'venue-garduna',
      name: 'La Garduña Venue',
      address: 'Via Enigmi 1',
      description: 'Venue per La Garduña',
      isActive: true,
    },
  });
  console.log('Venue:', venue.name);

  // Rimuovi story esistente (idempotente)
  const existing = await prisma.story.findFirst({ where: { title: 'La Garduña' } });
  if (existing) {
    await prisma.story.delete({ where: { id: existing.id } });
    console.log('Story precedente rimossa.');
  }

  // Crea Story
  const story = await prisma.story.create({
    data: {
      title: 'La Garduña',
      description: 'Una società criminale sorta in Spagna nel 1412 con struttura piramidale. Seguite la loro storia attraverso enigmi e codici.',
      difficulty: 'hard',
      durationMin: 90,
      isActive: true,
      steps: {
        create: [
          // ----------------------------------------------------------------
          // STEP 1 — Enigma 1.1: Piramide di Parole
          // ----------------------------------------------------------------
          {
            stepNumber: 1,
            title: 'La Piramide di Parole',
            description: 'La Garduña era una società criminale sorta in Spagna nel 1412 con struttura piramidale. Seguite la stessa logica nelle parole.',
            question: 'Costruite una sequenza di 8 parole dove ogni parola si ottiene aggiungendo una sola lettera alla precedente. ESEMPIO: E / RE / TRE / OTRE / OLTRE / COLTRE / COLTURE / COLATURE',
            answerType: 'multi_text_ordered',
            inputCount: 8,
            inputConfig: JSON.stringify({
              fields: [
                { position: 1, placeholder: 'Parola 1' },
                { position: 2, placeholder: 'Parola 2' },
                { position: 3, placeholder: 'Parola 3' },
                { position: 4, placeholder: 'Parola 4' },
                { position: 5, placeholder: 'Parola 5' },
                { position: 6, placeholder: 'Parola 6' },
                { position: 7, placeholder: 'Parola 7' },
                { position: 8, placeholder: 'Parola 8' },
              ],
            }),
            isActive: true,
            answers: {
              create: [
                { position: 1, answer: 'I',        points: 0 },
                { position: 2, answer: 'AI',       points: 0 },
                { position: 3, answer: 'ALI',      points: 0 },
                { position: 4, answer: 'ALTI',     points: 0 },
                { position: 5, answer: 'SALTI',    points: 0 },
                { position: 6, answer: 'SALATI',   points: 0 },
                { position: 7, answer: 'SALDATI',  points: 0 },
                { position: 8, answer: 'SCALDATI', points: 100 },
              ],
            },
            hints: {
              create: [
                { order: 1, type: 'TEXT', contentText: 'Ogni parola deve contenere tutte le lettere della precedente più una nuova', pointsCost: 10, triggerMinutesAfterFirstClear: 5 },
                { order: 2, type: 'TEXT', contentText: 'La sequenza parte da una parola di una sola lettera', pointsCost: 10, triggerMinutesAfterFirstClear: 5 },
                { order: 3, type: 'TEXT', contentText: "L'ultima parola è SCALDATI", pointsCost: 20, triggerMinutesAfterFirstClear: 5 },
              ],
            },
          },

          // ----------------------------------------------------------------
          // STEP 2 — Enigma 2.1: Sequenza del Giuramento
          // ----------------------------------------------------------------
          {
            stepNumber: 2,
            title: 'La Sequenza del Giuramento',
            description: 'Avete ricevuto 4 fogli (A, B, C, D) con le frasi del giuramento della Garduña scomposte e mescolate.',
            question: 'Per ogni gruppo (A, B, C, D) inserite la sequenza numerica corretta delle frasi.',
            answerType: 'multi_group_ordered_numbers',
            inputCount: 19,
            inputConfig: JSON.stringify({
              groups: [
                { label: 'A', fieldCount: 6 },
                { label: 'B', fieldCount: 4 },
                { label: 'C', fieldCount: 5 },
                { label: 'D', fieldCount: 4 },
              ],
            }),
            isActive: true,
            answers: {
              create: [
                // Gruppo A
                { groupLabel: 'A', position: 1, answer: '3', points: 0 },
                { groupLabel: 'A', position: 2, answer: '5', points: 0 },
                { groupLabel: 'A', position: 3, answer: '2', points: 0 },
                { groupLabel: 'A', position: 4, answer: '1', points: 0 },
                { groupLabel: 'A', position: 5, answer: '4', points: 0 },
                { groupLabel: 'A', position: 6, answer: '6', points: 0 },
                // Gruppo B
                { groupLabel: 'B', position: 1, answer: '4', points: 0 },
                { groupLabel: 'B', position: 2, answer: '1', points: 0 },
                { groupLabel: 'B', position: 3, answer: '3', points: 0 },
                { groupLabel: 'B', position: 4, answer: '2', points: 0 },
                // Gruppo C
                { groupLabel: 'C', position: 1, answer: '4', points: 0 },
                { groupLabel: 'C', position: 2, answer: '3', points: 0 },
                { groupLabel: 'C', position: 3, answer: '5', points: 0 },
                { groupLabel: 'C', position: 4, answer: '2', points: 0 },
                { groupLabel: 'C', position: 5, answer: '1', points: 0 },
                // Gruppo D
                { groupLabel: 'D', position: 1, answer: '2', points: 0 },
                { groupLabel: 'D', position: 2, answer: '4', points: 0 },
                { groupLabel: 'D', position: 3, answer: '1', points: 0 },
                { groupLabel: 'D', position: 4, answer: '3', points: 150 },
              ],
            },
            hints: {
              create: [
                { order: 1, type: 'TEXT', contentText: 'Ogni gruppo va letto come un piccolo racconto coerente', pointsCost: 10, triggerMinutesAfterFirstClear: 5 },
                { order: 2, type: 'TEXT', contentText: "Cerca prima il soggetto o l'azione iniziale di ogni blocco", pointsCost: 15, triggerMinutesAfterFirstClear: 5 },
                { order: 3, type: 'TEXT', contentText: 'Il gruppo A comincia con VIDI UNA BARCA...', pointsCost: 20, triggerMinutesAfterFirstClear: 5 },
              ],
            },
          },

          // ----------------------------------------------------------------
          // STEP 3 — Enigma 2.2: Ordine del Giuramento
          // ----------------------------------------------------------------
          {
            stepNumber: 3,
            title: "L'Ordine del Giuramento",
            description: 'Avete ricostruito le sequenze interne. Ora trovate l\'ordine corretto dei 4 fogli.',
            question: 'In quale ordine vanno letti i fogli A, B, C, D per ricostruire il giuramento completo?',
            answerType: 'ordered_sequence_letters',
            inputCount: 4,
            inputConfig: JSON.stringify({ elements: ['A', 'B', 'C', 'D'], fieldCount: 4 }),
            isActive: true,
            answers: {
              create: [
                { position: 1, answer: 'A', points: 0 },
                { position: 2, answer: 'C', points: 0 },
                { position: 3, answer: 'D', points: 0 },
                { position: 4, answer: 'B', points: 100 },
              ],
            },
            hints: {
              create: [
                { order: 1, type: 'TEXT', contentText: 'Segui la logica narrativa degli eventi', pointsCost: 10, triggerMinutesAfterFirstClear: 5 },
                { order: 2, type: 'TEXT', contentText: 'Prima il viaggio, poi il luogo', pointsCost: 15, triggerMinutesAfterFirstClear: 5 },
                { order: 3, type: 'TEXT', contentText: "Il giuramento è l'ultima azione", pointsCost: 20, triggerMinutesAfterFirstClear: 5 },
              ],
            },
          },

          // ----------------------------------------------------------------
          // STEP 4 — Enigma 3.1: Codice della Garduña
          // ----------------------------------------------------------------
          {
            stepNumber: 4,
            title: 'Il Codice della Garduña',
            description: "Usando l'ordine corretto dei fogli (A C D B) e la legenda simbolica, decodificate il messaggio nascosto leggendo i simboli a destra di ogni frase nell'ordine corretto.",
            question: 'Decodificate il messaggio. La risposta è composta da 3 parole.',
            answerType: 'text_single',
            inputCount: 1,
            isActive: true,
            answers: {
              create: [
                { answer: 'ALBERO SANTO TATUAGGI', points: 120 },
              ],
            },
            hints: {
              create: [
                { order: 1, type: 'TEXT', contentText: 'Ogni simbolo corrisponde a una lettera — usate la legenda', pointsCost: 10, triggerMinutesAfterFirstClear: 5 },
                { order: 2, type: 'TEXT', contentText: 'Dovete usare il corretto ordine dei fogli già trovato (A C D B)', pointsCost: 15, triggerMinutesAfterFirstClear: 5 },
                { order: 3, type: 'TEXT', contentText: 'Il messaggio finale è composto da 3 parole', pointsCost: 20, triggerMinutesAfterFirstClear: 5 },
              ],
            },
          },

          // ----------------------------------------------------------------
          // STEP 5 — Enigma 4.1: L'Albero della Scienza
          // ----------------------------------------------------------------
          {
            stepNumber: 5,
            title: "L'Albero della Scienza",
            description: "Nella Garduña, l'albero della scienza porta i frutti del tradimento: le foglie rappresentano i traditori e le carogne. Osservate bene l'immagine.",
            question: 'Contate solo le FOGLIE dell\'albero (non rami, non frutti, non radici). Quante sono?',
            answerType: 'number_single',
            inputCount: 1,
            isActive: true,
            answers: {
              create: [
                { answer: '33', points: 80 },
              ],
            },
            hints: {
              create: [
                { order: 1, type: 'TEXT', contentText: 'Osserva bene la legenda sotto l\'immagine', pointsCost: 10, triggerMinutesAfterFirstClear: 5 },
                { order: 2, type: 'TEXT', contentText: "Non tutti gli elementi dell'albero sono foglie", pointsCost: 15, triggerMinutesAfterFirstClear: 5 },
                { order: 3, type: 'TEXT', contentText: 'Conta solo ciò che rappresenta carogne e traditori', pointsCost: 20, triggerMinutesAfterFirstClear: 5 },
                { order: 4, type: 'TEXT', contentText: 'Attenzione ai gruppi di foglie vicine o sovrapposte', pointsCost: 25, triggerMinutesAfterFirstClear: 5 },
              ],
            },
          },

          // ----------------------------------------------------------------
          // STEP 6 — Enigma 4.2: La Parola del Giuramento
          // ----------------------------------------------------------------
          {
            stepNumber: 6,
            title: 'La Parola del Giuramento',
            description: 'Utilizzate il numero trovato poco fa come indice nel testo del giuramento (ordine A C D B).',
            question: "Quale è la 33ª parola del giuramento ricostruito?",
            answerType: 'text_single',
            inputCount: 1,
            isActive: true,
            answers: {
              create: [
                { answer: 'FAVIGNANA', points: 80 },
              ],
            },
            hints: {
              create: [
                { order: 1, type: 'TEXT', contentText: 'Il numero trovato prima non è la risposta finale — è una posizione', pointsCost: 10, triggerMinutesAfterFirstClear: 5 },
                { order: 2, type: 'TEXT', contentText: 'Dovete applicare il numero al giuramento nell\'ordine corretto (A C D B)', pointsCost: 15, triggerMinutesAfterFirstClear: 5 },
                { order: 3, type: 'TEXT', contentText: 'La risposta finale è una sola parola', pointsCost: 20, triggerMinutesAfterFirstClear: 5 },
                { order: 4, type: 'TEXT', contentText: 'È il nome di un\'isola siciliana delle Egadi', pointsCost: 25, triggerMinutesAfterFirstClear: 5 },
              ],
            },
          },

          // ----------------------------------------------------------------
          // STEP 7 — Enigma 5.1: I Punti di Favignana
          // ----------------------------------------------------------------
          {
            stepNumber: 7,
            title: 'I Punti di Favignana',
            description: "Il tatuaggio dei tre punti indicava l'appartenenza alla Garduña. Per ogni luogo trovate una parola che formi un'espressione comune con PUNTO (es: PUNTO VENDITA). Tre luoghi non hanno nessuna associazione: lasciateli vuoti.",
            question: "Per ogni luogo inserite la parola da abbinare a PUNTO. Lasciate vuoti i luoghi per cui non esiste un'associazione.",
            answerType: 'list_text_with_empty_allowed',
            inputCount: 13,
            inputConfig: JSON.stringify({
              items: [
                { position: 1,  label: 'PUNTA FARAGLIONE',           emptyAllowed: false },
                { position: 2,  label: 'PUNTA FERRO',                emptyAllowed: false },
                { position: 3,  label: 'PUNTA SOTTILE',              emptyAllowed: false },
                { position: 4,  label: 'SCALO CAVALLO',              emptyAllowed: false },
                { position: 5,  label: 'PUNTA SAN NICOLA',           emptyAllowed: false },
                { position: 6,  label: 'PUNTA GALERA',               emptyAllowed: false },
                { position: 7,  label: 'CASTELLO DI SANTA CATERINA', emptyAllowed: true  },
                { position: 8,  label: 'LIDO BURRONE',               emptyAllowed: false },
                { position: 9,  label: 'PALAZZO FLORIO',             emptyAllowed: false },
                { position: 10, label: 'CALA AZZURRA',               emptyAllowed: true  },
                { position: 11, label: 'CALA ROSSA',                 emptyAllowed: false },
                { position: 12, label: 'BUE MARINO',                 emptyAllowed: false },
                { position: 13, label: 'TONNARA',                    emptyAllowed: true  },
              ],
            }),
            isActive: true,
            answers: {
              create: [
                { fieldLabel: 'PUNTA FARAGLIONE',           emptyAllowed: false, answer: 'ritrovo|di ritrovo|incontro|di incontro|approdo',           points: 0 },
                { fieldLabel: 'PUNTA FERRO',                emptyAllowed: false, answer: 'fisso|di riferimento|fermo|di riparo|d\'ancoraggio',         points: 0 },
                { fieldLabel: 'PUNTA SOTTILE',              emptyAllowed: false, answer: 'panoramico|di vista|di osservazione|balneare',               points: 0 },
                { fieldLabel: 'SCALO CAVALLO',              emptyAllowed: false, answer: 'di approdo|approdo|di partenza|d\'imbarco|di sbarco',        points: 0 },
                { fieldLabel: 'PUNTA SAN NICOLA',           emptyAllowed: false, answer: 'di riferimento|riferimento|storico|d\'interesse|esclamativo', points: 0 },
                { fieldLabel: 'PUNTA GALERA',               emptyAllowed: false, answer: 'di confine|confine|di incontro|d\'accesso|di passaggio',     points: 0 },
                { fieldLabel: 'CASTELLO DI SANTA CATERINA', emptyAllowed: true,  answer: '',                                                            points: 0 },
                { fieldLabel: 'LIDO BURRONE',               emptyAllowed: false, answer: 'di ritrovo|ritrovo|di partenza|di balneazione|balneare',     points: 0 },
                { fieldLabel: 'PALAZZO FLORIO',             emptyAllowed: false, answer: 'd\'interesse|di interesse|culturale|storico|di riferimento',  points: 0 },
                { fieldLabel: 'CALA AZZURRA',               emptyAllowed: true,  answer: '',                                                            points: 0 },
                { fieldLabel: 'CALA ROSSA',                 emptyAllowed: false, answer: 'di immersione|immersione|di tuffo|di vista|panoramico',      points: 0 },
                { fieldLabel: 'BUE MARINO',                 emptyAllowed: false, answer: 'di immersione|immersione|di tuffo|balneare|cardinale',       points: 0 },
                { fieldLabel: 'TONNARA',                    emptyAllowed: true,  answer: '',                                                            points: 200 },
              ],
            },
            hints: {
              create: [
                { order: 1, type: 'TEXT', contentText: 'Cercate espressioni comuni con PUNTO — es: PUNTO VENDITA, PUNTO FISSO, PUNTO DI VISTA', pointsCost: 10, triggerMinutesAfterFirstClear: 5 },
                { order: 2, type: 'TEXT', contentText: 'Non tutti i luoghi hanno una risposta: tre vanno lasciati vuoti', pointsCost: 15, triggerMinutesAfterFirstClear: 5 },
                { order: 3, type: 'TEXT', contentText: 'I tre luoghi vuoti non si prestano ad alcuna espressione idiomatica con PUNTO', pointsCost: 20, triggerMinutesAfterFirstClear: 5 },
                { order: 4, type: 'TEXT', contentText: 'Pensate: per quali luoghi è impossibile formare una frase sensata con PUNTO?', pointsCost: 30, triggerMinutesAfterFirstClear: 5 },
              ],
            },
          },

          // ----------------------------------------------------------------
          // STEP 8 — Enigma 6.1: Il Giudizio di San Michele
          // ----------------------------------------------------------------
          {
            stepNumber: 8,
            title: 'Il Giudizio di San Michele',
            description: 'San Michele Arcangelo regge una bilancia (equilibrio), una spada (discernimento) e sconfigge il drago (il male). Solo uno dei luoghi trovati porta al tesoro.',
            question: 'Quale luogo di Favignana porta al tesoro?',
            answerType: 'text_single',
            inputCount: 1,
            isActive: true,
            answers: {
              create: [
                { answer: 'TONNARA DI FAVIGNANA|TONNARA', points: 100 },
              ],
            },
            hints: {
              create: [
                { order: 1, type: 'TEXT', contentText: 'Osserva i simboli di San Michele Arcangelo', pointsCost: 10, triggerMinutesAfterFirstClear: 5 },
                { order: 2, type: 'TEXT', contentText: 'Bilancia e spada non sono casuali', pointsCost: 15, triggerMinutesAfterFirstClear: 5 },
                { order: 3, type: 'TEXT', contentText: 'Cerca il luogo che richiama equilibrio tra lavoro e sacrificio, vita e morte', pointsCost: 20, triggerMinutesAfterFirstClear: 5 },
              ],
            },
          },

          // ----------------------------------------------------------------
          // STEP 9 — Enigma 7.1: La Scacchiera di Polibio
          // ----------------------------------------------------------------
          {
            stepNumber: 9,
            title: 'La Scacchiera di Polibio',
            description: 'Polibio inventò una scacchiera 5x5 per codificare le lettere in coppie numeriche. Nel testo ricompaiono parole già incontrate nel gioco. Convertitele con la scacchiera e trovate i numeri delle caldaie.',
            question: 'Usando la scacchiera di Polibio, trovate i due numeri delle caldaie. Le parole chiave sono ALI e SALTI. I numeri cercati compaiono in entrambe le parole.',
            answerType: 'multi_number_unordered',
            inputCount: 2,
            inputConfig: JSON.stringify({ fieldCount: 2 }),
            isActive: true,
            answers: {
              create: [
                { position: 1, answer: '11', points: 0 },
                { position: 2, answer: '24', points: 120 },
              ],
            },
            hints: {
              create: [
                { order: 1, type: 'TEXT', contentText: 'Nel testo ci sono parole che avete già trovato prima nel gioco', pointsCost: 10, triggerMinutesAfterFirstClear: 5 },
                { order: 2, type: 'TEXT', contentText: 'Ogni lettera corrisponde a due cifre: riga e colonna nella scacchiera', pointsCost: 15, triggerMinutesAfterFirstClear: 5 },
                { order: 3, type: 'TEXT', contentText: 'Le parole utili sono ALI e SALTI', pointsCost: 20, triggerMinutesAfterFirstClear: 5 },
                { order: 4, type: 'TEXT', contentText: 'Tra i numeri ottenuti, contano solo quelli che compaiono in entrambe le parole', pointsCost: 25, triggerMinutesAfterFirstClear: 5 },
              ],
            },
          },

          // ----------------------------------------------------------------
          // STEP 10 — Enigma 8.1: La Frase Diversa
          // ----------------------------------------------------------------
          {
            stepNumber: 10,
            title: 'La Frase Diversa',
            description: 'Due caldaie, 24 frasi in totale. Una sola frase si distingue per una proprietà oggettiva e verificabile. Trovatela, indicate caldaia e numero, e motivate la scelta.',
            question: 'Quale frase è oggettivamente diversa dalle altre? Indicate: caldaia (11 o 24), numero frase (1-12), motivazione.',
            answerType: 'structured_choice_with_reason',
            inputCount: 3,
            inputConfig: JSON.stringify({
              fields: [
                { key: 'caldaia',     type: 'select', options: ['11', '24'] },
                { key: 'frase',       type: 'number', min: 1, max: 12 },
                { key: 'motivazione', type: 'text' },
              ],
            }),
            isActive: true,
            answers: {
              create: [
                { fieldLabel: 'caldaia',     answer: '24',         points: 0 },
                { fieldLabel: 'frase',       answer: '2',          points: 0 },
                { fieldLabel: 'motivazione', answer: 'palindromo', points: 200, motivationKeywords: 'palindrom|letto al contrario|uguale al contrario|simmetric|stessa al contrario' },
              ],
            },
            hints: {
              create: [
                { order: 1, type: 'TEXT', contentText: 'La proprietà cercata è oggettiva e matematicamente verificabile', pointsCost: 10, triggerMinutesAfterFirstClear: 5 },
                { order: 2, type: 'TEXT', contentText: 'Non cercate il significato, cercate la forma', pointsCost: 20, triggerMinutesAfterFirstClear: 5 },
                { order: 3, type: 'TEXT', contentText: 'Provate a leggere la frase al contrario, ignorando spazi e punteggiatura', pointsCost: 30, triggerMinutesAfterFirstClear: 5 },
                { order: 4, type: 'TEXT', contentText: 'La frase corretta è identica sia da sinistra che da destra (palindromo)', pointsCost: 40, triggerMinutesAfterFirstClear: 5 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('Story creata:', story.title, 'con', 10, 'step');
  console.log('\n=== SEED LA GARDUÑA COMPLETATO ===');
  console.log('Story ID:', story.id);
}

main()
  .catch((e) => {
    console.error('ERRORE seed-garduna:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
