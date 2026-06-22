# M1 — LAN Node: Feature Complete

**Obiettivo:** il Nodo LAN gestisce una serata di gioco completa al 100% —
autenticazione operatore, hint, media, QR, real-time, force-stop.

**Gate d'uscita:** test manuale di una serata dall'avvio al ranking finale,
con almeno 2 tavoli, 1 hint usato, 1 media allegato.

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
| KAN-18 | Setup docs LAN + Prisma | 2 | Prima — nessun prerequisito |
| KAN-30 | Operator auth (password env + cookie httpOnly 8h) | 3 | Prima di QR e sessioni |
| KAN-31 | Story lock 409 + GET /api/server-info IP LAN | 2 | — |
| KAN-32 | Generalizza motivationKeywords in DB | 1 | Semplice refactor |
| KAN-35 | Modello StepHint in Prisma (schema + migration + seed) | 2 | **Prerequisito di KAN-19** |
| KAN-29 | Modello StepMedia + API upload UUID + validazione MIME | 3 | **Prerequisito di KAN-27** |
| KAN-19 | Hint logic: trigger time-based, locked/available, erogazione per tipo | 5 | Dipende da KAN-35 |
| KAN-20 | QR code generazione URL tavolo nel pannello operatore | 2 | — |
| KAN-22 | Auto-refresh polling pannello operatore (real-time squadre) | 2 | — |
| KAN-23 | Force end / reset sessione con conferma password | 2 | — |

---

## Prompt di apertura

```
Sei uno sviluppatore senior full-stack che lavora sul progetto Happy Dark Hour.
Il tuo obiettivo in questa chat è completare la milestone M1: LAN Node Feature Complete.

Leggi nell'ordine prima di iniziare:
1. CLAUDE.md
2. ARCHITECTURE.md  (focus sezioni 4, 5, 6, 11, 12)
3. WORKFLOW.md
4. src/lib/validation.ts
5. prisma/schema.prisma

Poi leggi i ticket Jira in scope su progetto KAN
(cloudId: 14fef55b-5da2-49f1-925a-caf0774e91cb):
KAN-18, KAN-30, KAN-31, KAN-32, KAN-35, KAN-29, KAN-19, KAN-20, KAN-22, KAN-23

Ordine di esecuzione consigliato (rispetta le dipendenze):
1. KAN-18 — scrivi SETUP.md con procedura completa
2. KAN-30 — operator auth password env + cookie httpOnly 8h
3. KAN-31 — story lock 409 + GET /api/server-info
4. KAN-32 — generalizza motivationKeywords
5. KAN-35 — StepHint in Prisma (prerequisito per KAN-19)
6. KAN-29 — StepMedia upload API
7. KAN-19 — hint logic completa (trigger, lock, erogazione)
8. KAN-20 — QR code pannello operatore
9. KAN-22 — auto-refresh polling
10. KAN-23 — force end/reset

Vincoli critici da rispettare sempre:
- NON aggiornare Prisma oltre 5.22.0
- NON aggiornare Next.js oltre 16.2.3
- NON aggiornare Tailwind CSS 4.x
- Dopo ogni modifica a file .ts/.tsx: strip null bytes con Python
- Dopo ogni modifica: npx tsc --noEmit, zero errori in src/
- Aggiorna il ticket Jira a "In corso" quando inizi, "In revisione" quando finisci

Inizia leggendo i file, poi dimmi cosa hai capito del contesto e proponi
il piano di attacco per il primo ticket (KAN-18).
```

---

## Note per il dev

- Il server LAN gira su Windows — attenzione ai path e ai null bytes
- `GET /api/server-info` usa `os.networkInterfaces()` — non hardcoded IP
- Il pulsante hint parte **grigio/disabilitato** — si attiva solo al trigger time-based
- Il trigger hint è basato sul momento in cui il **primo tavolo** supera quello step
- File media salvati come `/public/uploads/[UUID].[ext]` (anti-piracy, naming UUID)
- Per il QR code: leggere l'IP da `/api/server-info` al momento della generazione, non da env
- Operator auth: singola password da `.env.local` (OPERATOR_PASSWORD), cookie httpOnly 8h
