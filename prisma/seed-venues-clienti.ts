// KAN-clienti — Seed idempotente per i locali attivi (sezione Clienti)
// Esegui con: npx tsx prisma/seed-venues-clienti.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VenueSeed {
  name: string;
  phone?: string;
  street?: string;
  streetNumber?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  openingHours?: string;
}

// Dati reperiti tramite ricerca web (Google) il 2026-09-03.
// Alcuni locali (Rustico, Ravenna, Mokita) non sono stati identificati con
// certezza tra piu' omonimi/candidati: lasciati senza contatti, da
// completare manualmente dalla sezione Clienti > Visualizza contatti.
const venues: VenueSeed[] = [
  {
    name: 'Jack Rabbit',
    phone: '+39 0731 086664',
    street: 'Via Federico Conti',
    streetNumber: '3/B',
    postalCode: '60035',
    city: 'Jesi',
    province: 'AN',
    openingHours: 'Lunedì: chiuso\nMartedì-Domenica: 18:00-01:30',
  },
  {
    name: "Pacio's",
    phone: '+39 071 280 4967',
    street: 'Corso Carlo Alberto',
    streetNumber: '105',
    postalCode: '60127',
    city: 'Ancona',
    province: 'AN',
    openingHours: 'Lunedì-Sabato: 11:00-02:00\nDomenica: 15:00-02:00',
  },
  {
    name: "Fricchio'",
    phone: '+39 371 421 3754',
    street: 'Via Madre Teresa di Calcutta',
    streetNumber: '1',
    postalCode: '60131',
    city: 'Ancona (Posatora)',
    province: 'AN',
  },
  { name: 'Rustico' }, // dati non trovati con certezza — completare manualmente
  { name: 'Ravenna' }, // dati non trovati — completare manualmente
  {
    name: 'Mociga',
    phone: '+39 071 742700',
    street: 'Via Flaminia',
    streetNumber: '280',
    postalCode: '60126',
    city: 'Ancona (Torrette)',
    province: 'AN',
    openingHours:
      'Domenica: chiuso\nLunedì-Martedì-Mercoledì: 12:00-15:00\nGiovedì-Venerdì: 12:00-15:00, 18:00-23:00\nSabato: 17:00-23:00',
  },
  { name: 'Mokita' }, // dati non trovati — completare manualmente
  {
    name: 'Bar Pertini',
    phone: '+39 331 181 4913',
    street: 'Piazza Sandro Pertini',
    postalCode: '60129',
    city: 'Ancona',
    province: 'AN',
    openingHours: 'Lunedì-Giovedì: 18:00-02:00\nVenerdì-Sabato: 17:30-02:00\nDomenica: 18:00-02:00',
  },
];

async function main() {
  console.log('Seed locali (sezione Clienti)...');
  for (const v of venues) {
    const existing = await prisma.venue.findFirst({ where: { name: v.name } });
    if (existing) {
      console.log(`  già presente: ${v.name}`);
      continue;
    }
    const created = await prisma.venue.create({
      data: {
        name: v.name,
        phone: v.phone ?? null,
        street: v.street ?? null,
        streetNumber: v.streetNumber ?? null,
        postalCode: v.postalCode ?? null,
        city: v.city ?? null,
        province: v.province ?? null,
        openingHours: v.openingHours ?? null,
        isActive: true,
      },
    });
    console.log(`  creato: ${created.name} (${created.id})`);
  }
  console.log('Fatto.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
