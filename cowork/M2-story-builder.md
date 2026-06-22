# M2 — Story Builder: Creator UI sul LAN

**Obiettivo:** il creator può costruire e modificare storie complete via interfaccia web,
senza toccare seed o database manualmente.

**Rationale:** costruiamo il creator UI prima della piattaforma cloud perché:
1. Permette di testare storie reali immediatamente, senza cloud
2. Il lavoro fatto qui si migra nell'area creator cloud (M4) con modifiche minime
3. Consente al creator di essere autonomo già dopo M2

**Gate d'uscita:** "La Garduña" ricostruita interamente via UI (eliminato il seed manuale),
con step, risposte, varianti, media e hint configurati dall'interfaccia.

---

## Setup Cowork

| Voce | Valore |
|------|--------|
| Cartella locale | `C:\Users\Utente\Documents\workspace\happydarkhour` |
| Connettori | Jira (gianmarioemili.atlassian.net) |
| Skill aggiuntive | nessuna |

---

## Ticket in scope (ordine di esecuzione)

| Ticket | Titolo | SP | Note |
|--------|--------|----|------|
| KAN-21 | Architettura UI Creator dashboard (wireframe + routing + struttura dati) | 3 | Prima — definisce il routing |
| KAN-25 | Editor step con selector tipo risposta, form dinamico, anteprima live | 5 | Dipende da KAN-21 |
| KAN-26 | UI varianti risposta + configurazione hint completa per step | 5 | Dipende da KAN-25 e KAN-35 |

**Prerequisiti da M1:** KAN-35 (StepHint in Prisma) e KAN-29 (StepMedia + upload) devono essere completati.

---

## Prompt di apertura

```
Sei uno sviluppatore senior full-stack che lavora sul progetto Happy Dark Hour.
Il tuo obiettivo in questa chat è completare la milestone M2: Story Builder Creator UI.

Leggi nell'ordine prima di iniziare:
1. CLAUDE.md
2. ARCHITECTURE.md  (focus sezioni 2, 3, 11, 12)
3. WORKFLOW.md
4. prisma/schema.prisma  (per comprendere le relazioni Story → StoryStep → StepAnswer / StepHint / StepMedia)
5. src/app/api/  (per capire le API LAN già esistenti)

Poi leggi i ticket Jira in scope su progetto KAN
(cloudId: 14fef55b-5da2-49f1-925a-caf0774e91cb):
KAN-21, KAN-25, KAN-26

Verifica prima che i prerequisiti da M1 siano completati:
- KAN-35 (StepHint in Prisma) → se non completato, non iniziare KAN-26
- KAN-29 (StepMedia upload) → se non completato, coordina con il PM

Ordine di esecuzione:
1. KAN-21 — definisci routing /creator, layout, struttura dati API
2. KAN-25 — editor step con form dinamico per 8 tipi di risposta
3. KAN-26 — pannello varianti risposta + configurazione hint (tutti i campi)

Vincoli critici:
- NON aggiornare Prisma oltre 5.22.0, Next.js oltre 16.2.3, Tailwind 4.x
- Dopo ogni modifica a file .ts/.tsx: strip null bytes con Python
- Dopo ogni modifica: npx tsc --noEmit, zero errori in src/
- L'area creator nel LAN è protetta dalla stessa auth operatore (password env)
- Upload media: naming UUID obbligatorio → /public/uploads/[UUID].[ext]
- Aggiorna il ticket Jira a "In corso" quando inizi, "In revisione" quando finisci

Contesto UX importante:
- Il testo degli step NON contiene mai domande dirette — solo narrativa/indizi
- Gli hint sono configurati per step: tipo (TEXT/PHOTO/VIDEO/AUDIO), contenuto,
  costo punti, trigger (minuti dopo prima clear del primo tavolo)
- Terminologia: "Tavolo" (non squadra), "Step" (non domanda), "Hint" (non suggerimento UI)

Inizia leggendo i file e i ticket, poi presentami il piano per KAN-21:
routing proposto, componenti principali, API necessarie.
```

---

## Note per il dev

- Il creator UI nel LAN è un'area separata: `/creator` con layout distinto dall'operatore
- Gli 8 tipi di risposta sono in `src/lib/validation.ts` — il form deve adattarsi dinamicamente al tipo selezionato
- Per KAN-26: ogni hint è una card espandibile; drag & drop per l'ordine è opzionale (numeri manuali vanno bene per M2)
- Il seed "La Garduña" (`prisma/seed.ts`) serve come riferimento dei dati da replicare via UI
