# Cowork — Guida alle chat di progetto

Ogni file in questa cartella corrisponde a una chat Cowork dedicata.
Ogni chat ha un ruolo preciso, un prompt di apertura da incollare, e le istruzioni di setup.

---

## Setup comune a tutte le chat

| Passo | Azione |
|-------|--------|
| 1 | Apri una nuova chat Cowork |
| 2 | Condividi la cartella `C:\Users\Utente\Documents\workspace\happydarkhour` |
| 3 | Assicurati che il connettore Jira sia attivo (account gianmarioemili.atlassian.net) |
| 4 | Incolla il prompt di apertura dal file corrispondente |

---

## Chat disponibili

| File | Ruolo | Quando usarla |
|------|-------|---------------|
| `00-PM-generale.md` | General PM | Sempre aperta — decisioni, Jira, brief alle dev |
| `M1-lan-completo.md` | Dev LAN | Ora — completa il Nodo LAN |
| `M2-story-builder.md` | Dev Creator UI | Dopo M1 completata |
| `M3-monorepo.md` | Dev Infra | Dopo M2 — richiede decisione sulla timing |
| `M4-cloud-mvp.md` | Dev Cloud | Dopo M3 |
| `M5-integrazione.md` | Dev Integration | Dopo M4 |

---

## Struttura ruoli

```
Direzione (Gianmario)
    │
    ▼
Chat PM Generale  ←→  Jira KAN
    │
    ├──► Chat M1 Dev LAN
    ├──► Chat M2 Dev Creator
    ├──► Chat M3 Dev Infra
    ├──► Chat M4 Dev Cloud
    └──► Chat M5 Dev Integration
```

Il PM:
- Riceve decisioni dalla direzione
- Aggiorna ARCHITECTURE.md e WORKFLOW.md
- Crea e aggiorna ticket Jira
- Brieffa le chat dev con le istruzioni precise
- Non scrive codice

Le chat dev:
- Leggono ARCHITECTURE.md + WORKFLOW.md all'apertura
- Aggiornano i ticket Jira (In corso → In revisione)
- Scrivono codice, eseguono tsc, strip null bytes
- Segnalano blocchi al PM

---

## Memoria persistente del progetto

Questi file sono la "memoria" condivisa tra tutte le chat:

| File | Contenuto |
|------|-----------|
| `CLAUDE.md` | Istruzioni base + riferimento a AGENTS.md |
| `AGENTS.md` | Regole specifiche per agenti AI |
| `ARCHITECTURE.md` | Architettura di sistema, decisioni fissate, modelli dati |
| `WORKFLOW.md` | Processo Jira, regole encoding, dipendenze locked |
| `cowork/` | Prompt e setup per ogni chat |

Quando una chat esaurisce il contesto: aprila di nuovo con lo stesso prompt.
I file di progetto garantiscono la continuità.

---

## Riferimenti tecnici rapidi

- **cloudId Jira:** `14fef55b-5da2-49f1-925a-caf0774e91cb`
- **Progetto Jira:** `KAN`
- **Stack LAN locked:** Next.js 16.2.3 · Prisma 5.22.0 · SQLite · Tailwind 4
- **Stack Cloud:** Next.js 16 · Supabase PostgreSQL EU · NextAuth · Stripe · next-intl
- **Brand:** `#0D0D0D` bg · `#CC0000` accento · `#F5F5F5` testo
