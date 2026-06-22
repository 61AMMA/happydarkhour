# Happy Dark Hour — Architettura di Sistema

> Documento ufficiale di architettura. Aggiornato: 2026-06-17
> Approvato da: Direzione

---

## 1. Visione generale

Happy Dark Hour è una piattaforma per escape game digitali in locali pubblici (bar, pub, ristoranti).
Il sistema è composto da **due sottosistemi distinti** che si sincronizzano in momenti precisi.

```
┌─────────────────────────────────────────────────────┐
│              PIATTAFORMA CLOUD                      │
│         (Vercel EU + Supabase PostgreSQL)           │
│                                                     │
│  ┌──────────────────┐    ┌──────────────────────┐  │
│  │  Creator Area    │    │  Operator Cloud Area │  │
│  │  (backend-style) │    │  (account, billing,  │  │
│  │  - Storie        │    │   acquisto storie,   │  │
│  │  - Pubblicazione │    │   config LAN remota) │  │
│  │  - Analytics     │    └──────────────────────┘  │
│  │  - Operatori     │                               │
│  └──────────────────┘                               │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS (sync pre/post serata)
                    │
┌───────────────────▼─────────────────────────────────┐
│              NODO LAN                               │
│     (PC operatore — installato localmente)          │
│                                                     │
│  Next.js server · SQLite · Router WiFi dedicato     │
│                                                     │
│  - Game engine (8 tipi di risposta)                 │
│  - Pagina giocatore (/play)                         │
│  - Dashboard operatore serata                       │
│  - 100% offline durante il gioco                    │
└───────────────────┬─────────────────────────────────┘
                    │ WiFi LAN isolata
                    │
┌───────────────────▼─────────────────────────────────┐
│              DISPOSITIVI GIOCATORI                  │
│         (smartphone personali dei giocatori)        │
│  Si connettono al WiFi del router di gioco,         │
│  non alla rete del locale                           │
└─────────────────────────────────────────────────────┘
```

---

## 2. Ruoli utente

### Creator / Storyteller
- Lavora da remoto (casa, ufficio)
- Accede SOLO alla Piattaforma Cloud (area Creator)
- Crea e modifica storie, imposta prezzi, pubblica
- Analizza log sessioni e performance per storia
- Gestisce operatori/clienti (visibilità sui loro acquisti e serate)
- **Non installa nulla sul proprio PC**

### Operatore Serata
- Gestisce uno o più locali
- Accede alla Piattaforma Cloud (area Operator) per: account, acquisto storie, config
- Ha installato il **Nodo LAN** sul PC dedicato al locale
- Durante la serata usa la dashboard gioco sul Nodo LAN
- Può operare su più locali contemporaneamente (ciascuno con il proprio Nodo LAN)

### Giocatore
- Si trova fisicamente nel locale
- Connette il proprio smartphone al WiFi del router di gioco
- Accede a `/play?team=ID` sul Nodo LAN
- **Nessun account, nessun dato personale**: solo nome squadra

---

## 3. Struttura repository — Monorepo con Turborepo

```
happydarkhour/                    ← root del monorepo
├── apps/
│   ├── cloud/                    ← Piattaforma Cloud (Vercel)
│   │   ├── src/app/(creator)/    # Area Creator
│   │   ├── src/app/(operator)/   # Area Operator cloud
│   │   └── prisma/               # Schema PostgreSQL (Supabase)
│   └── lan-server/               ← Nodo LAN (installabile)
│       ├── src/                  # Codebase attuale
│       └── prisma/               # Schema SQLite (esistente)
├── packages/
│   ├── validation/               ← Engine 8 tipi di risposta (condiviso)
│   ├── types/                    ← TypeScript shared types
│   └── ui/                       ← Componenti UI condivisi (futuro)
├── turbo.json
├── ARCHITECTURE.md               ← questo file
├── WORKFLOW.md
├── CLAUDE.md
└── AGENTS.md
```

**Perché monorepo**: il motore di validazione degli 8 tipi di risposta è usato sia dal Nodo LAN (validazione in tempo reale) sia dalla Piattaforma Cloud (preview Creator, verifica publish). Condividerlo come `packages/validation` elimina duplicazioni e garantisce coerenza.

---

## 4. Stack tecnologico

### Piattaforma Cloud
| Layer | Tecnologia | Note |
|-------|------------|------|
| Framework | Next.js 16 App Router | Stesso del LAN server |
| Hosting | Vercel (EU region) | Zero-ops, deploy da Git |
| Database | Supabase PostgreSQL (EU) | GDPR-compliant, managed |
| ORM | Prisma 5.x | Schema separato dal LAN |
| Auth | NextAuth.js | Multi-account, ruoli Creator/Operator |
| Pagamenti | Stripe | Crediti operatore, marketplace |
| i18n | next-intl | Struttura multilingua, solo `it` al lancio |

### Nodo LAN
| Layer | Tecnologia | Note |
|-------|------------|------|
| Framework | Next.js 16 App Router | Esistente |
| Database | SQLite via Prisma 5.22 | LOCKED — non aggiornare |
| Styling | Tailwind CSS 4 | Esistente |
| Distribuzione | Installer Windows/Mac | Script di setup automatico |

---

## 5. Flussi operativi

### 5.1 Prima installazione Nodo LAN (una tantum)
```
1. Operatore scarica installer da piattaforma cloud
2. Installa sul PC del locale
3. Al primo avvio: inserisce Activation Code
   (generato dalla piattaforma cloud dopo login operatore)
4. Nodo LAN scarica config, chiave pubblica JWT, storie acquistate
5. Setup completato — il server si avvia automaticamente ad ogni boot
```

### 5.2 Acquisto storia
```
1. Operatore accede alla Piattaforma Cloud (da qualsiasi browser)
2. Sfoglia catalogo, sceglie storia + numero di sessioni (es. 3 sessioni = X€)
3. Pagamento tramite Stripe
4. Cloud genera N token JWT firmati (1 per sessione acquistata)
5. Token disponibili per il download dal Nodo LAN
```

### 5.3 Pre-serata (sync storia + token)
```
1. Operatore avvia il Nodo LAN con internet disponibile
2. Nodo LAN contatta cloud: "ho nuove storie o token da scaricare?"
3. Se sì: scarica contenuto storia + token JWT in SQLite locale
4. Disconnette — da questo momento tutto è offline
```

### 5.4 Serata di gioco (100% offline)
```
1. Operatore avvia sessione → Nodo LAN verifica token JWT valido
2. Token consumato (hard delete da SQLite) → sessione creata
3. Giocatori si connettono al WiFi del router di gioco
4. Gioco si svolge completamente offline
5. Fine partita → SessionLog generato (dati gioco + note operatore + feedback giocatori)
```

### 5.5 Post-serata (upload log)
```
1. Operatore rientra in zona con internet
2. Nodo LAN carica SessionLog su Piattaforma Cloud
3. Cloud registra: sessioni eseguite vs token consumati (audit trail)
4. Creator notificato del nuovo log disponibile
5. Operatore vede aggiornamento crediti e storico nella propria area cloud
```

---

## 6. Sistema di licensing a token (anti-piracy)

### Principio
- Ogni sessione acquistata = 1 token JWT unico
- I token sono firmati con **chiave privata RSA del cloud** (RS256)
- Il Nodo LAN possiede solo la **chiave pubblica** — può verificare ma non creare token
- **Impossibile forgiare token** senza la chiave privata

### Struttura token
```json
{
  "storyId": "uuid-storia",
  "operatorId": "uuid-operatore",
  "tokenId": "uuid-unico-per-token",
  "purchasedAt": 1718000000,
  "exp": 1749536000
}
```
Firmato → stringa opaca non modificabile.

### Consumo (irreversibile)
Al click "Avvia partita":
1. Nodo LAN cerca token valido per quella storia in SQLite
2. Verifica firma con chiave pubblica
3. **Hard delete del token** (non "marcato come usato", eliminato)
4. Sessione creata

La storia rimane nel catalogo locale (visibile). Il bottone "Avvia" è disabilitato lato server — non solo nell'HTML — senza token validi.

### Audit trail
Al sync post-serata, il cloud confronta: sessioni nel log vs token generati e non rientrati. Discrepanze → flag account per revisione manuale.

---

## 7. Privacy e GDPR

- **Giocatori**: solo nome squadra (inventato). Nessun dato personale. Zero GDPR.
- **Operatori**: dati account necessari per billing (nome, email, P.IVA). Trattamento conforme GDPR EU.
- **Creator**: dati account. Potenzialmente dati bancari per pagamenti (gestiti da Stripe, non da noi).
- **Log sessioni**: nome squadra, punteggi, tempi, step completati. Nessun dato personale identificabile.
- **Instagram sharing**: condivisione volontaria post-serata. Nessuna automazione.
- **Hosting EU**: Vercel EU + Supabase EU garantiscono data residency europea.

---

## 8. Internazionalizzazione (i18n)

Struttura `next-intl` attiva dal giorno uno sulla Piattaforma Cloud, con solo locale `it`.
Aggiungere `es`, `fr`, `en`, `el` = aggiungere file di traduzione, zero riscrittura codice.

Roadmap linguistica stimata:
- Lancio: italiano
- Anno 2-3: spagnolo, francese
- Anno 4-5: inglese, greco, tedesco (Svizzera)

Il Nodo LAN rimane in italiano — le storie sono contenuto localizzato, non UI di sistema.

---

## 9. Scalabilità

| Metrica | Lancio | 12 mesi | 5 anni |
|---------|--------|---------|--------|
| Locali attivi simultanei | < 10 | 10-50 | 50-200 |
| Storie nel catalogo | 1-5 | 10-30 | 50+ |
| Creator attivi | 1 (interno) | 1-3 | Marketplace aperto |
| Costo infrastruttura/mese | €0-25 | €25-100 | €100-500 |

L'architettura non cambia fino a 200 locali simultanei. Oltre quella soglia si valuta separazione microservizi o caching layer.

---

## 10. Decisioni architetturali fissate

| Decisione | Scelta | Motivazione |
|-----------|--------|-------------|
| Monorepo vs multi-repo | Monorepo (Turborepo) | Validation engine condiviso, AI-friendly |
| DB cloud | PostgreSQL (Supabase) | Multi-tenant, managed, EU, GDPR |
| DB LAN | SQLite (Prisma 5.22) | LOCKED — funziona offline, zero deps |
| Auth cloud | NextAuth.js multi-account | Creator e Operator sono ruoli distinti |
| Auth LAN | Password env + cookie httpOnly | Sufficiente per single-operator LAN |
| Licensing | Token JWT RS256 pre-scaricati | Offline-first + anti-forgery |
| Consumo token | Hard delete | Irreversibile, no rollback possibile |
| Internet durante gioco | Non richiesta | Router dedicato, rete isolata |
| Internet avvio sessione | Non richiesta | Token già in SQLite locale |
| Internet sync | Pre e post serata | Download storia + upload log |
| Dati giocatori | Solo nome squadra | Zero GDPR |
| i18n | next-intl, it-only al lancio | Struttura multilingua, costo +15% ora vs riscrittura dopo |

---

## 11. Sistema Hint

### Responsabilita'

Il sistema hint e' **interamente controllato dal Creator** per ogni step della storia.
L'Operatore non configura nulla relativo agli hint.

### Configurazione per step (Creator)

Per ogni step il creator definisce N hint sequenziali. Ogni hint ha:

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `order` | int | Ordine di sblocco (1, 2, 3…) |
| `type` | enum | `TEXT`, `PHOTO`, `VIDEO`, `AUDIO` |
| `content` | string | Testo oppure URL media (UUID-named, anti-piracy) |
| `pointsCost` | int | Punti persi dal team che lo usa |
| `triggerMinutesAfterFirstClear` | int | Minuti dopo che il **primo tavolo** ha superato questo step |

### Logica di attivazione (LAN Node)

1. Il primo tavolo che supera lo step N avvia un timer per ogni hint di quello step
2. Allo scadere del timer, il pulsante hint corrispondente si **sblocca** per tutti i tavoli ancora a quello step
3. Il giocatore vede il pulsante diventare attivo — decide se usarlo accettando la penalita' punti
4. Hint sequenziali: il timer dell'hint 2 parte da quando si sblocca l'hint 1 (non dall'inizio)
5. Ogni hint e' erogato una sola volta per team (non ripetibile)

### UX giocatore

- Pulsante hint: **grigio/disabilitato** di default
- Quando trigger scatta: pulsante si **attiva** visivamente
- Al tap: modale di conferma con costo punti
- Dopo conferma: contenuto hint mostrato inline (testo, immagine, player audio/video)
- Hint 2 visibile come locked finche' non scatta il suo trigger

### Modello dati Prisma (LAN — SQLite)

```prisma
model StepHint {
  id                            String    @id @default(uuid())
  stepId                        String
  step                          StoryStep @relation(fields: [stepId], references: [id])
  order                         Int
  type                          HintType
  contentText                   String?
  contentUrl                    String?
  pointsCost                    Int       @default(50)
  triggerMinutesAfterFirstClear Int       @default(5)
  createdAt                     DateTime  @default(now())
}

enum HintType {
  TEXT
  PHOTO
  VIDEO
  AUDIO
}
```

---

## 12. UX — Principi narrativi

### Step del gioco

- Il testo dello step non contiene mai una **domanda diretta** al giocatore
- Il testo e' narrativo/atmosferico: un indizio, una descrizione, un elemento da osservare
- Il giocatore deduce autonomamente cosa cercare e cosa inserire nel campo risposta
- Esempio corretto: *"Una lettera sigillata. L'inchiostro ha quasi sbiadito il nome di chi la scrisse. Solo l'impronta di un sigillo resta — un'aquila con le ali spiegate."*
- Esempio sbagliato: *"Qual e' il cognome del pittore?"*

### Terminologia fissa

| Termine | Uso |
|---------|-----|
| Tavolo | Gruppo di giocatori (non squadra, non gruppo) |
| Sessione | Una serata di gioco |
| Step | Un enigma/fase della storia |
| Hint | Suggerimento a pagamento |

---

*Versione: 1.1 — 2026-06-17*
*Aggiornamento: sistema hint (sezione 11) + principi UX narrativi (sezione 12)*
