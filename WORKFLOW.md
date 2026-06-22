# HDH-TeamIT — Workflow di Sviluppo

> Questo documento descrive il ciclo di vita di ogni ticket nel progetto **Happy Dark Hour** (Jira KAN).
> Chiunque lavori sul progetto (sviluppatori, PM, agenti AI) deve seguire queste regole.

---

## Colonne Jira e loro significato

| Colonna | Jira Status | Chi la usa | Significato |
|---------|-------------|------------|-------------|
| **Idea** | Da completare | PM / Dev | Ticket creato, non ancora schedulato per lo sprint corrente |
| **In Progress** | In corso | Dev | Lavoro attivo. Un solo assegnatario alla volta per ticket. |
| **In Review** | In revisione | Dev → PM | Codice scritto, PR aperta o patch pronta per revisione |
| **Done** | Fatto | PM | Criterio di accettazione verificato, merge in main effettuato |

---

## Regole per i Developer e gli Agenti AI

### Iniziare un task
1. Assegnarsi il ticket su Jira e spostarlo **In Progress**.
2. Creare un branch con naming: `kan-<numero>/<tipo>/<slug-breve>`
   - Esempi: `kan-19/feat/hint-logic`, `kan-22/feat/operator-polling`, `kan-18/docs/setup-guide`
3. Fare riferimento al numero Jira in ogni commit: `KAN-19: aggiungi logica hint con conferma costo`

### Completare un task
1. Verificare ogni punto "Done when" nella descrizione del ticket.
2. Eseguire `npx tsc --noEmit` — zero errori in `src/` sono obbligatori.
3. Testare manualmente la funzionalità sul server locale LAN (`npm run dev:lan`).
4. Spostare il ticket **In Review** e notificare il PM.

### Regole per gli agenti AI
- Leggere sempre `CLAUDE.md` e `AGENTS.md` prima di iniziare.
- Non modificare `prisma/schema.prisma` senza approvazione PM — lo schema è locked.
- Dopo ogni modifica di file TypeScript: strip null bytes con Python, poi eseguire `npx tsc --noEmit`.
- Non aggiungere dipendenze npm senza motivo esplicito nel ticket.
- Ogni modifica al DB (nuovi seed, migration) deve essere reversibile o documentata.

---

## Regole per il PM

- **Step 4 review cadence**: controllare lo stato del backlog ogni sessione di lavoro.
- Un ticket passa a **Done** solo dopo verifica manuale dell'acceptance criteria, non solo su dichiarazione del dev.
- Le **Epic** non vanno mai spostate a Done — rimangono aperte fino a chiusura del progetto.
- I ticket con label `infra` bloccano i ticket con label `frontend`/`backend` che dipendono da quel setup: risolvere prima l'infra.

---

## Priorita' di lavoro raccomandata (Giugno 2026)

```
Blocchi urgenti (Highest/High — fare adesso)
  KAN-18  Setup docs LAN + Prisma
  KAN-19  Hint logic con conferma costo
  KAN-20  QR code pannello operatore
  KAN-22  Auto-refresh pannello operatore

Da pianificare nel prossimo sprint (Medium)
  KAN-21  Architettura Story Creator
  KAN-23  Force end / reset con conferma

Backlog futuro (Low — dopo stabilizzazione)
  KAN-24  Creator auth + catalogo
  KAN-25  Editor step con 8 tipi
  KAN-26  Varianti risposta + hint config UI
```

---

## Convention di Encoding e File

Il progetto gira su Windows con editor misti. Regole obbligatorie:
- Tutti i file `.ts` / `.tsx` devono essere **UTF-8 senza BOM, LF line endings**.
- Dopo ogni modifica via strumenti automatici, verificare l'assenza di null bytes (`^@`) con: `python3 -c "open('file.ts','rb').read().find(b'\\x00')"` (deve restituire `-1`).
- I file `.env.local` devono essere UTF-8 — mai UTF-16.

---

## Dipendenze locked (non aggiornare senza PM approval)

| Package | Versione | Motivo |
|---------|----------|--------|
| prisma / @prisma/client | 5.22.0 | Schema SQLite stabile, migration history |
| next | 16.2.3 | App Router in produzione |
| tailwindcss | 4.x | Classe utility usata ovunque |

---

*Ultimo aggiornamento: 2026-06-17 — PM: Gianmario*
