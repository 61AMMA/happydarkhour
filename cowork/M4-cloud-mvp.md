# M4 — Piattaforma Cloud: MVP

**Obiettivo:** Creator e Operator hanno account distinti sulla piattaforma cloud.
Il Creator pubblica storie. L'Operator acquista sessioni (token JWT) via Stripe.
Il Nodo LAN scarica storia + token e li usa offline.

**Gate d'uscita:** flusso completo end-to-end —
acquisto token → download storia + JWT sul LAN → avvio sessione → consumo token → upload log.

---

## Setup Cowork

| Voce | Valore |
|------|--------|
| Cartella locale | `C:\Users\Utente\Documents\workspace\happydarkhour` |
| Connettori | Jira (gianmarioemili.atlassian.net) |
| Skill aggiuntive | nessuna |

**Prerequisiti da completare prima di iniziare M4:**
- M1 completata (LAN Feature Complete)
- M2 completata (Story Builder)
- M3 completata (Monorepo scaffold con `apps/cloud/` attivo)

---

## Ticket in scope

| Ticket | Titolo | Note |
|--------|--------|------|
| KAN-33 | Epic: Piattaforma Cloud | Epic di riferimento |
| KAN-34 | JWT RS256 licensing: generazione cloud + verifica LAN | Core anti-piracy |
| KAN-24 | Auth operatore/creator + catalogo storie | NextAuth multi-account |
| Nuovi | API sync: download storia + token dal LAN | Da creare con PM |
| Nuovi | Stripe: acquisto crediti + generazione token | Da creare con PM |
| Nuovi | Area Creator cloud: gestione storie, analytics | Da creare con PM |
| Nuovi | Area Operator cloud: account, acquisto, config LAN | Da creare con PM |
| Nuovi | POST /api/log upload da LAN a cloud | Da creare con PM |

**Chiedere al PM di creare i ticket mancanti prima di iniziare.**

---

## Prompt di apertura

```
Sei uno sviluppatore senior full-stack che lavora sul progetto Happy Dark Hour.
Il tuo obiettivo in questa chat è completare la milestone M4: Platform Cloud MVP.

Leggi nell'ordine prima di iniziare:
1. CLAUDE.md
2. ARCHITECTURE.md  (focus sezioni 1, 2, 4, 5, 6, 7, 8 — tutto il cloud)
3. WORKFLOW.md
4. apps/cloud/prisma/schema.prisma  (schema PostgreSQL da completare)
5. apps/lan-server/prisma/schema.prisma  (per capire cosa il cloud deve servire al LAN)

Poi leggi i ticket Jira Epic KAN-33 e tutti i task collegati su progetto KAN
(cloudId: 14fef55b-5da2-49f1-925a-caf0774e91cb).

Stack cloud (da usare obbligatoriamente):
- Next.js 16 App Router (già scaffoldata in apps/cloud/)
- Supabase PostgreSQL EU (connection string in .env.local)
- Prisma 5.x (schema separato da LAN)
- NextAuth.js con due ruoli: Creator e Operator
- Stripe per acquisto crediti/token
- next-intl configurato, locale "it" only al lancio
- JWT RS256: chiave privata in cloud, chiave pubblica sul LAN

Flussi critici da implementare (vedi ARCHITECTURE.md sezione 5):
1. Registrazione/login Creator e Operator (ruoli distinti, dashboard distinte)
2. Creator: CRUD storie con step, risposte, hint, media
3. Operator: browsing catalogo, acquisto sessioni (Stripe), download storia + token
4. LAN sync: GET /api/sync — il LAN scarica storia + token JWT con una chiamata autenticata
5. LAN post-serata: POST /api/log — il LAN carica il SessionLog al cloud
6. JWT RS256: generazione token alla conferma pagamento, verifica sul LAN con chiave pubblica

Vincoli critici:
- Chiave privata JWT MAI esposta al LAN — solo chiave pubblica scaricata all'activation
- Token JWT: hard delete sul LAN al consumo (vedi ARCHITECTURE.md sezione 6)
- Dati giocatori: solo nome tavolo — zero PII
- GDPR: hosting EU (Vercel EU, Supabase EU)
- Dopo ogni modifica a file .ts/.tsx: strip null bytes con Python
- Dopo ogni modifica: npx tsc --noEmit in apps/cloud/, zero errori

Ordine di sviluppo raccomandato:
1. Schema Prisma cloud completo (Story, StoryStep, Operator, Creator, Token, SessionLog)
2. NextAuth setup (Creator + Operator roles, sessione separata)
3. API REST base per CRUD storie (Creator area)
4. Stripe webhook + generazione token JWT RS256
5. API sync per LAN (GET /api/sync, GET /api/public-key)
6. Dashboard Creator (UI)
7. Dashboard Operator (UI)
8. API POST /api/log per upload SessionLog

Inizia leggendo i file e i ticket, poi presentami lo schema Prisma cloud completo
prima di scrivere qualsiasi codice.
```

---

## Note per il dev

- Il sistema JWT RS256 è descritto in dettaglio in ARCHITECTURE.md sezione 6 — leggila integralmente
- La chiave pubblica JWT viene scaricata dal LAN al momento dell'activation (primo setup) — non cambiarla mai dopo
- Stripe: usare `crediti` come unità — 1 credito = 1 sessione. L'operatore compra N crediti, il cloud genera N token JWT
- Area Creator: navigazione verticale sinistra (Storie · Clienti · Analytics) + calendario + feed attività (vedi mockup in sezione UX)
- Area Operator cloud: diversa dalla dashboard serata LAN. Gestisce account, acquisti, configurazione remota del LAN
- `apps/cloud/src/app/(creator)/` e `apps/cloud/src/app/(operator)/` per il routing a gruppi separati
- next-intl: tutti i testi UI in `messages/it.json` — nessun testo hardcoded nel JSX
