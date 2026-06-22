# M3 — Infrastruttura: Monorepo + Cloud Scaffold

**Obiettivo:** ristrutturare il repository come monorepo Turborepo, migrare il codebase LAN
in `apps/lan-server/`, creare i package condivisi e scaffoldare `apps/cloud/`.

**Gate d'uscita:** `turbo build` verde, `apps/lan-server` funziona identicamente a prima,
`apps/cloud` ha una pagina Next.js raggiungibile in locale.

---

## Setup Cowork

| Voce | Valore |
|------|--------|
| Cartella locale | `C:\Users\Utente\Documents\workspace\happydarkhour` |
| Connettori | Jira (gianmarioemili.atlassian.net) |
| Skill aggiuntive | nessuna |

---

## Ticket in scope

Questa milestone non ha ancora ticket Jira dedicati — il PM li crea prima dell'avvio.
Chiedere al PM (chat 00-PM-generale) di creare i ticket con label `infra` prima di iniziare.

Scope atteso:
- Configurazione Turborepo root (`turbo.json`, `package.json` root, `pnpm-workspace.yaml`)
- Migrazione codebase esistente in `apps/lan-server/`
- Creazione `packages/validation/` con contenuto di `src/lib/validation.ts`
- Creazione `packages/types/` con tipi condivisi
- Scaffold `apps/cloud/` (Next.js 16 App Router, Tailwind 4, struttura cartelle)
- Verifica CI: `turbo build` verde, zero regressioni TypeScript

---

## Prompt di apertura

```
Sei uno sviluppatore senior full-stack che lavora sul progetto Happy Dark Hour.
Il tuo obiettivo in questa chat è completare la milestone M3: Monorepo + Cloud Scaffold.

Leggi nell'ordine prima di iniziare:
1. CLAUDE.md
2. ARCHITECTURE.md  (focus sezione 3 — struttura monorepo)
3. WORKFLOW.md
4. package.json  (dipendenze attuali del LAN server)
5. tsconfig.json

Poi leggi i ticket Jira con label "infra" su progetto KAN
(cloudId: 14fef55b-5da2-49f1-925a-caf0774e91cb) per la milestone M3.

Struttura target (da ARCHITECTURE.md sezione 3):
  happydarkhour/
  ├── apps/
  │   ├── cloud/           ← nuovo (scaffold Next.js 16)
  │   └── lan-server/      ← migrazione codebase attuale
  ├── packages/
  │   ├── validation/      ← estrai da src/lib/validation.ts
  │   ├── types/           ← tipi condivisi
  │   └── ui/              ← futuro, non implementare ora
  ├── turbo.json
  └── package.json (root)

Vincoli critici:
- Il codebase LAN NON deve avere regressioni — tutti i path relativi vanno aggiornati
- NON aggiornare Prisma oltre 5.22.0, Next.js oltre 16.2.3
- Il package manager da usare è pnpm (workspaces)
- packages/validation deve esportare le stesse funzioni di src/lib/validation.ts
- apps/cloud usa Next.js 16 App Router, Tailwind 4, next-intl configurato con locale "it" only
- Dopo ogni modifica: npx tsc --noEmit in ogni app/package, zero errori

Piano di attacco raccomandato:
1. Setup root package.json + pnpm-workspace.yaml + turbo.json
2. Sposta codebase attuale in apps/lan-server/ (preserva git history con git mv)
3. Aggiorna tutti i path import interni
4. Crea packages/validation con export delle funzioni
5. Aggiorna apps/lan-server per importare da @happydarkhour/validation
6. Scaffold apps/cloud con struttura base
7. Verifica turbo build verde

Inizia leggendo i file, poi presentami il piano step-by-step prima di toccare qualsiasi file.
Questa è un'operazione di refactoring critica — procedi con cautela e conferma ogni step.
```

---

## Note per il dev

- Usare `git mv` per preservare la history del codebase LAN durante la migrazione
- `packages/validation` deve esportare: `validateStructuredAnswer`, `isStructuredAnswerType`, tutti i validator individuali, `areAnswersEquivalent`, `normalizeAnswer`
- `apps/cloud` al termine di M3 deve avere solo: layout root, pagina index placeholder, middleware per next-intl con locale "it"
- Prisma dello schema LAN resta in `apps/lan-server/prisma/` — non spostare
- Prisma dello schema Cloud sarà in `apps/cloud/prisma/` — scaffold vuoto con PostgreSQL provider
