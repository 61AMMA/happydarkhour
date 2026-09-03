# Creator Area — Architettura (KAN-21)

> Documento tecnico approvato. Aggiornato: 2026-06-17

## Routing

| URL | Componente | Descrizione |
|-----|-----------|-------------|
| `/creator` | `app/creator/page.tsx` | Dashboard: lista storie |
| `/creator/stories/new` | `app/creator/stories/new/page.tsx` | Form crea nuova storia |
| `/creator/stories/[storyId]` | `app/creator/stories/[storyId]/page.tsx` | Lista step + azioni storia |
| `/creator/stories/[storyId]/steps/[stepId]` | `app/creator/stories/[storyId]/steps/[stepId]/page.tsx` | Editor step (KAN-25 + KAN-26) |

## Autenticazione

Stessa cookie `hdh-operator-session` dell'area `/operator`. Il Creator nel Nodo LAN è lo stesso operatore. Il proxy (`src/proxy.ts`) protegge entrambe le aree. Login page condivisa: `/operator/login`.

## Flusso Creator

```
/creator
  → crea storia (POST /api/stories)
  → /creator/stories/[storyId]
      → aggiungi step (POST /api/stories/[storyId]/steps)
      → /creator/stories/[storyId]/steps/[stepId]
          → configura tipo risposta (PUT /api/steps/[stepId])
          → inserisci risposte + varianti (POST /api/steps/[stepId]/answers)
          → inserisci hint (POST /api/steps/[stepId]/hints)
          → configura hint (PUT /api/hints/[hintId])
```

## API Endpoints Creator

| Endpoint | Metodi | Implementato in |
|----------|--------|----------------|
| `/api/stories` | GET, POST | `src/app/api/stories/route.ts` |
| `/api/stories/[storyId]` | GET, PUT, DELETE | `src/app/api/stories/[storyId]/route.ts` |
| `/api/stories/[storyId]/steps` | GET, POST | `src/app/api/stories/[storyId]/steps/route.ts` |
| `/api/steps/[stepId]` | GET, PUT, DELETE | `src/app/api/steps/[stepId]/route.ts` |
| `/api/steps/[stepId]/answers` | POST (replace-all) | `src/app/api/steps/[stepId]/answers/route.ts` |
| `/api/steps/[stepId]/hints` | GET, POST | `src/app/api/steps/[stepId]/hints/route.ts` |
| `/api/hints/[hintId]` | PUT, DELETE | `src/app/api/hints/[hintId]/route.ts` |
| `/api/upload` | POST | `src/app/api/upload/route.ts` (pre-esistente, UUID naming) |

## Tipi condivisi

`src/lib/creator-types.ts` — tipi TypeScript usati da tutte le pagine e API:
- `AnswerType` (union string 8 valori)
- `HintType` (TEXT | PHOTO | VIDEO | AUDIO)
- `StepFormData`, `AnswerFormEntry`, `HintFormEntry`
- `StoryWithSteps`, `StepSummary`, `StepDetail`

## Componenti (implementati in KAN-25 / KAN-26)

```
src/components/creator/
  StepEditor.tsx         ← editor step principale (KAN-25)
  AnswerTypeSelector.tsx ← selector 8 tipi con labels
  DynamicAnswerForm.tsx  ← form dinamico per tipo selezionato
  StepPreview.tsx        ← anteprima live /play
  AnswerVariantsPanel.tsx ← varianti risposta (KAN-26)
  HintPanel.tsx          ← configurazione hint (KAN-26)
  HintCard.tsx           ← card singolo hint espandibile
```

## Semafori stato storia e Introduzione (Pagina Storie)

Aggiunti al modello `Story`: `introduzione` (testo libero, pitch/presentazione della storia),
`realStatus` e `digitalStatus` (String, valori `verde` | `giallo` | `rosso`, default `rosso`).

- **Semaforo reale**: verde = Pronta, giallo = In arrivo, rosso = In preparazione.
- **Semaforo digitale**: verde = Pronta all'uso, giallo = Da validare, rosso = Da creare.

Modificabili dal Creator direttamente dalla lista `/creator` e dal dettaglio storia
(`/creator/stories/[storyId]`) tramite `SemaforoSelector` (`src/components/creator/SemaforoSelector.tsx`).
Salvati via `PUT /api/stories/[storyId]`. Seed iniziale: `npm run seed:serate`
(`prisma/seed-stories-serate.ts`, idempotente per titolo).

## Vincoli rispettati

- Prisma 5.22.0, Next.js 16.2.3, Tailwind 4.x — NON aggiornati
- No enum Prisma → `AnswerType` e `HintType` come `String` nel DB
- No Json fields → `inputConfig` serializzato come JSON string
- Upload media: UUID obbligatorio via `/api/upload` pre-esistente
- Brand: `#0D0D0D` background, `#CC0000` accento, `#F5F5F5` testo
