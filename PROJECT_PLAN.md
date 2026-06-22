# Happy Dark Hour - Project Plan

---

## 🧭 REGOLA DI GESTIONE

Ogni decisione rinviata ma rilevante deve essere registrata nelle sezioni:
- BACKLOG POST-MVP
- QUESTIONI APERTE
- NOTE ARCHITETTURALI FUTURE

---

## 🎯 OBIETTIVO

Costruire una web app locale per gestire escape game competitivi nei pub/bar.

Target immediato:
👉 MVP funzionante entro pochi giorni
👉 test reale su smartphone in rete locale

---

## ⚙️ STACK TECNICO (BLOCCATO)

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM 5.22.0
- SQLite (database locale)

⚠️ REGOLE:
- NON cambiare stack
- NON aggiornare Prisma a 7.x durante il MVP
- NON introdurre cloud
- NON usare PostgreSQL ora
- NON introdurre sync
- NON creare installer
- NON fare overengineering

---

## 🧱 ARCHITETTURA MVP

Una sola web app:

- /operator → gestione partita
- /play → giocatori (smartphone)

Un solo database:
- SQLite locale

Accesso:
- PC locale → operatore
- smartphone → giocatori via WiFi

---

## 🗺️ ROADMAP

### 1. MVP LOCALE
- [ ] Setup progetto
- [ ] Schema database Prisma
- [ ] Seed storia demo
- [ ] API base (sessioni, risposte, hint)
- [ ] Login operatore
- [ ] Dashboard operatore
- [ ] Pagina giocatore
- [ ] Timer
- [ ] Ranking finale

---

### 2. STORIA REALE
- [ ] Parsing storia reale
- [ ] Conversione in step
- [ ] Inserimento nel DB
- [ ] Test logica enigmi
- [ ] Test logica enigmi
- [ ] Validazione flusso reale su tavolo

---

### 2.5 NORMALIZZAZIONE STORIA
- [ ] Definizione struttura step definitiva
- [ ] Mapping enigmi → sistema attuale
- [ ] Gestione risposte multiple
- [ ] Gestione hint
- [ ] Gestione scoring reale

---

### 3. TEST END-TO-END
- [ ] Test operatore
- [ ] Test tavolo da smartphone
- [ ] Test risposte
- [ ] Test hint
- [ ] Test timer
- [ ] Test ranking

---

### 4. STABILIZZAZIONE
- [ ] Fix bug
- [ ] Miglioramento UX
- [ ] Miglioramento messaggi
- [ ] Stabilità server

---

### 5. STORY EDITOR (POST-MVP)
- [ ] Definizione formato storia definitivo ← schema ora supporta 8 answer types, base pronta
- [ ] GUI creazione storia (Story Creator Dashboard)
- [ ] Inserimento step con selezione answer type
- [ ] Inserimento risposte e varianti
- [ ] Inserimento hint con costi configurabili
- [ ] Modifica storie esistenti

---

### 6. MULTI-STORIA
- [ ] Lista storie
- [ ] Selezione storia in sessione
- [ ] Attiva/disattiva

---

### 7. SISTEMA CREATOR (FUTURO)
- [ ] Dashboard creatore
- [ ] Gestione varianti
- [ ] Analytics
- [ ] Sync dati

---

### 8. DEPLOY REALE
- [ ] Installazione su PC locale
- [ ] Setup rete WiFi
- [ ] Test con dispositivi reali
- [ ] Backup dati

---

## 📌 NOTE OPERATIVE POST-MVP

### 🔎 SUBITO DOPO MVP
- [ ] Validare UX reale operatore durante una serata completa
- [ ] Validare UX giocatore su smartphone (leggibilità, input, velocità)
- [ ] Verificare tempi reali degli enigmi vs timer impostato
- [ ] Analizzare comportamento gruppi (1 player + view-only)
- [ ] Verificare stabilità rete Wi-Fi locale durante utilizzo simultaneo
- [ ] Raccolta feedback reale da utenti (operatori + giocatori)
- [ ] Identificare punti di frizione nel flusso di gioco

### 🔎 SUBITO DOPO MVP
- [ ] Validare UX reale operatore durante una serata completa
- [ ] Validare UX giocatore su smartphone (leggibilità, input, velocità)
- [ ] Verificare tempi reali degli enigmi vs timer impostato
- [ ] Analizzare comportamento gruppi (1 player + view-only)
- [ ] Verificare stabilità rete Wi-Fi locale durante utilizzo simultaneo
- [ ] Raccolta feedback reale da utenti (operatori + giocatori)
- [ ] Identificare punti di frizione nel flusso di gioco

### ⚙️ MVP DA RIFINIRE
- [ ] Migliorare gestione errori lato UI (messaggi chiari)
- [ ] Gestione stati loading più pulita (no blocchi percepiti)
- [ ] Migliorare feedback visivo per azioni (risposta corretta/errata)
- [ ] Uniformare completamente stati sessione (created/active/completed)
- [ ] Pulizia console log e debug temporanei
- [ ] Migliorare leggibilità su mobile (font, spazi, bottoni)
- [ ] Verifica edge case:
  - [ ] refresh pagina player
  - [ ] perdita connessione
  - [ ] doppio invio risposta
- [ ] Stabilità polling dati (ranking, stato sessione)
- [ ] Migliorare coerenza tra operator/play (sincronizzazione)

## 📊 STATO ATTUALE

Fase: Storia Reale (La Garduña) + Architettura Answer Types

Completato:
- bootstrap progetto Next.js
- installazione TypeScript, Tailwind, Prisma, SQLite
- creazione struttura base cartelle
- homepage e pagine placeholder iniziali
- configurazione porta fissa 3000
- verifica struttura progetto
- conferma presenza e integrità di PROJECT_PLAN.md
- definizione schema database reale del MVP
- correzione relazioni critiche dello schema
- prisma generate e db push funzionanti con schema stabile
- downgrade tecnico da Prisma 7 a Prisma 5.22.0 per compatibilità stabile con SQLite
- seed iniziale funzionante con dati demo reali minimi
- database popolato correttamente
- API minime del gioco create e testate
- flusso base verificato (lettura sessione, lettura stato team, risposta corretta/errata, hint, avanzamento step)
- correzione mismatch formato risposta API / parsing frontend in src/lib/game.ts
- pagina giocatore collegata alle API
- flusso completo giocatore funzionante (end-to-end)
- hardening pagina giocatore (fix hint multipli, protezione doppio submit, stato finale)
- timer di sessione implementato (countdown, timeout, blocco input)
- ranking finale MVP (API, ordinamento, riepilogo lato giocatore)
- area operatore reale (reset, creazione sessione, chiusura manuale)
- QR code generati lato operatore e lato player con IP LAN corretto
- consolidamento accesso LAN: .env.local riscritto in UTF-8 (era UTF-16 da Windows Notepad)
- fix bug DELETE sessione: cascade corretto su AnswerAttempt → TeamProgress → SessionEvent → SessionTeam → GameSession
- fix bug isCompleted: aggiunto isCompleted: true al teamProgress.update in answer/route.ts
- fix bug multi-team: rimossa chiusura automatica sessione al completamento del primo team
- rimozione console.log di debug da operator/page.tsx, play/page.tsx, lib/game.ts
- estrazione contenuti reali dal PDF scansionato (29 pagine) della storia La Garduña
- analisi e mappatura dei 10 enigmi su 8 answer types strutturati
- estensione schema Prisma: StoryStep (inputCount, inputConfig), StepAnswer (position, groupLabel, fieldLabel, emptyAllowed)
- validation engine esteso: 6 nuove funzioni per i tipi strutturati + dispatcher validateStructuredAnswer()
- answer/route.ts aggiornato: gestisce tipi strutturati + varianti con pipe separator
- play/page.tsx aggiornato: componente DynamicAnswerInput con render dinamico per ciascun tipo
- seed La Garduña creato (prisma/seed-garduna.ts): 10 step completi con risposte, varianti, hint

In corso:
- verifica funzionamento post-deploy (prisma db push + npm run seed:garduna)

Bloccato:

---

## 🎯 TASK CORRENTE

Obiettivo:
Validare il funzionamento end-to-end della storia La Garduña con i nuovi answer types strutturati.

Include:
- eseguire `npx prisma db push` per applicare le modifiche allo schema
- eseguire `npm run seed:garduna` per popolare il DB
- avviare `npm run dev:lan` e verificare che i 10 step siano navigabili
- verificare che ogni UI (piramide, tabella 13 righe, box gruppi, form misto) si renderizzi correttamente
- verificare che le risposte corrette vengano validate e le scorrette rifiutate

Output atteso:
- storia La Garduña giocabile end-to-end su LAN da smartphone

---

## 🔒 DECISIONI BLOCCATE

- Una sola web app per MVP
- Database SQLite locale
- Progressione lineare step
- Validazione automatica + ibrida minima
- Nessun cloud
- Nessuna sync

---

## ⚠️ COSE DA DEFINIRE (DOPO MVP)

👉 NON implementare ora

- Architettura sistema creator
- Sync locale → centrale
- Database centrale (PC creatore vs server vs NAS)
- Versionamento storie
- Gestione varianti avanzata
- Distribuzione aggiornamenti ai locali
- Packaging installer
- Sicurezza accesso remoto
- Multi-locale reale

---

## 📌 NOTE TECNICHE

- su Windows Prisma può generare errori EPERM sul file query_engine-windows.dll.node se processi Node/Next/Prisma sono ancora attivi
- prima di eseguire generate/db push/seed conviene fermare il server dev
- il seed deve creare almeno una sessione con status "active" per permettere il test della pagina /play

- i file JSON temporanei di test API non devono restare sparsi nella root del progetto
- dopo i test devono essere:
  - eliminati
  - oppure spostati in una cartella dedicata, ad esempio `tests/manual/`

- Prisma 7.x è stato escluso dal MVP per incompatibilità pratica con il setup SQLite locale e complessità non necessaria
- Prisma 5.22.0 è la versione stabile scelta per il MVP

- Il sistema deve funzionare offline durante la serata
- I dispositivi devono essere sulla stessa rete WiFi
- Il PC locale è il server di gioco
- Il browser è l’unico client

---

## 🖥️ GESTIONE SERVER LOCALE (NEXT.JS)

Regole obbligatorie per lo sviluppo:

### Porta fissa
Il server deve sempre utilizzare la porta 3000.

Configurazione richiesta:

package.json
"scripts": {
  "dev": "next dev -p 3000"
}

Non utilizzare porte dinamiche (3001, 3002, ecc).

---

### Avvio server

Comando standard:

npm run dev

Output atteso:
http://localhost:3000

---

### Chiusura corretta server

Prima di riavviare il server:

CTRL + C

Confermare con:
Y

---

### Gestione errore porta occupata

Se la porta 3000 risulta occupata:

1. Identificare processo:

netstat -ano | findstr :3000

2. Terminare processo:

taskkill /PID NUMERO /F

Esempio:

taskkill /PID 12345 /F

---

### Regole operative

- Non avviare più server contemporaneamente
- Usare un solo terminale per il server
- Chiudere sempre il server prima di riavviarlo
- Non lasciare processi attivi in background

---

### Obiettivo

Garantire:
- ambiente stabile
- test ripetibili
- nessun conflitto di porte

---

## 🧪 TEST API LOCALE (POWERHELL)

⚠️ ATTENZIONE: PowerShell NON è bash

Problemi comuni:
- `curl` è alias di Invoke-WebRequest
- `head` NON esiste

---

### Regole obbligatorie

NON usare:
- head
- curl (senza .exe)

---

### Comandi corretti

Test API JSON:

Invoke-RestMethod "http://localhost:3000/api/endpoint"

Oppure:

curl.exe "http://localhost:3000/api/endpoint"

---

### Se terminale si blocca

Sintomo:
- richiesta di input "Uri:"

Soluzione:
1. CTRL + C
2. tornare al prompt
3. rieseguire comando corretto

---

### Obiettivo

- test API veloce
- nessun blocco terminale
- output JSON immediato
## 🚀 ISTRUZIONE PER WINDSURF

Quando lavori su questo progetto:

- Segui questo file come riferimento principale
- Lavora SOLO sul TASK CORRENTE
- Non anticipare fasi future
- Non modificare lo stack
- Non introdurre complessità inutile
- Produci codice funzionante, non teoria

---

## 📦 BACKLOG POST-MVP

### 🐛 Bug / Debito tecnico noti

- **3 errori TypeScript pre-esistenti** in `src/app/api/session/[sessionId]/route.ts` e `src/app/api/session/[sessionId]/ranking/route.ts`
  - Erano presenti prima delle modifiche agli answer types
  - Non bloccano il funzionamento runtime
  - Da correggere nella prossima sessione di cleanup

- **Seed demo originale** (prisma/seed.ts) non è idempotente e non è allineato ai nuovi tipi
  - Valutare: eliminare o aggiornare dopo validazione La Garduña

- **Polling fisso operatore ogni 10 secondi**
  - Funziona per MVP ma non ottimale
  - Valutare refresh condizionale o strategia più efficiente

- **GET /api/session ambiguo semanticamente**
  - Attualmente: sessione attiva → sessione created → fallback
  - Da documentare e stabilizzare

### 🏗️ Feature future (Story Creator Dashboard)

- Story Creator Dashboard: interfaccia per storyteller
  - inserimento step con testo, foto, documenti
  - selezione answer type da UI
  - inserimento risposte attese e varianti
  - inserimento hint con costi
  - gestione scoring per step
  - anteprima flusso giocatore
- gestione multi-storia (lista, selezione, attiva/disattiva)
- editor visuale step/risposte/hint
- sistema di analytics sessioni
- storico partite
- gestione utenti avanzata
- autenticazione completa
- sistema di sincronizzazione locale → centrale
- deploy multi-locale
- aggiornamenti automatici
- backup automatici
- export/import storie in formato pacchetto

### 🧠 Validazione risposte — roadmap AI

- per ora: validazione deterministica + whitelist varianti manuali con separatore `|`
- futuro: AI come livello secondario non bloccante per:
  - risposte semanticamente equivalenti non in whitelist (es. enigma 5.1 punti di Favignana)
  - classificazione risposte dubbie
- vincolo: AI NON deve essere richiesta durante la partita (offline-first)

---

## ❓ QUESTIONI APERTE

Decisioni architetturali da definire dopo MVP:

- dove risiede il database centrale?
  - PC creatore
  - NAS
  - server remoto

- NAS:
  - backup?
  - hosting?
  - sync?

- source of truth:
  - locale vs centrale

- gestione versioni storie

- distribuzione contenuti ai locali

- modello di aggiornamento software

---

## 🏗️ NOTE ARCHITETTURALI FUTURE

###

- per utilizzo reale nel locale, il PC server deve usare un indirizzo IPv4 statico
- i link generati per player, view-only e QR code non devono usare `localhost`
- devono usare una base URL locale configurabile, coerente con l’indirizzo IP statico del PC del locale
- la fase di installazione sul pc del locale dovrà includere:
  - configurazione IP statico locale
  - verifica raggiungibilità in LAN
  - generazione link con base URL corretta
- i test reali da smartphone non devono dipendere dalla sola modalità sviluppo del server
- il PC del locale fungerà da server di gioco
- gli smartphone dei tavoli accederanno tramite Wi-Fi locale
- tutti i dispositivi dovranno essere sulla stessa rete locale del locale
- i link e i QR code dovranno usare l’indirizzo IP locale statico del PC server



### REFRESH AREA OPERATORE

- l’area operatore usa attualmente refresh automatico ogni 10 secondi per aggiornare ranking e stato sessione
- per il MVP questa soluzione è accettabile
- in futuro sarà opportuno valutare un meccanismo più efficiente:

  - polling ottimizzato
  - refresh condizionale
  - eventuale aggiornamento realtime
- obiettivo futuro:

  - ridurre chiamate inutili
  - mantenere UI aggiornata senza carico superfluo


### RIDONDANZA STATO TEAMSESSION COMPLETATO

- il campo `isCompleted` in TeamProgress è attualmente ridondante rispetto a `completedAt`
- rischio:

  - doppia fonte di verità sul completamento del team
- in futuro sarà preferibile:

  - derivare lo stato completato da `completedAt`
  - oppure formalizzare una sola fonte di verità nel modello dati


### FRONTEND STABILITÀ

- durante lo sviluppo è stato necessario ricreare completamente il file page.tsx della pagina /play a causa di corruzione o incoerenze

- il risultato attuale è funzionante, ma questo evidenzia un rischio:

  - mancanza di controllo incrementale sulle modifiche UI
  - possibile fragilità del frontend durante refactor

- in futuro sarà necessario:

  - evitare riscritture complete non controllate
  - mantenere modifiche più atomiche e verificabili
  - introdurre maggiore stabilità nella struttura della pagina giocatore

- è stato introdotto implicitamente lo stato sessione "expired"

- questo stato non era previsto inizialmente ma è ora parte del comportamento reale del sistema

- gli stati sessione diventano quindi:

  - created
  - active
  - completed
  - expired

- in futuro sarà necessario:

  - formalizzare gli stati nel modello dati
  - documentare chiaramente le transizioni di stato
  - distinguere tra:

    - completamento naturale
    - scadenza tempo
    - eventuale chiusura manuale operatore

### ⚠️ NOTE DI STABILITÀ IMPLEMENTATIVA

- il badge browser "Not secure" su HTTP locale non è di per sé il problema bloccante per l’MVP
- il problema critico reale è la stabilità del caricamento dell’app quando si accede tramite IP locale invece che tramite localhost
- prima di considerare chiuso l’accesso Wi-Fi locale, va verificato il caricamento completo via IP su PC server e su smartphone


- la ricostruzione completa di page.tsx indica possibile instabilità del codice UI durante sviluppo rapido

- verificare che:

  - la logica di stato sia centralizzata
  - i componenti non crescano troppo in dimensione

- evitare file monolitici difficili da mantenere

- lo stato "expired" è attualmente gestito lato logica ma non ancora formalizzato a livello architetturale completo

- rischio:

  - incoerenza tra backend e frontend in futuro

- soluzione futura:

  - enum centralizzato per gli stati sessione
  - validazione lato API


### SESSIONE COMPLETAMENTO

- attualmente la sessione viene marcata come "completed" quando il team demo completa il gioco
- in futuro multi-team reale sarà necessario distinguere:
  - completamento del singolo team
  - chiusura complessiva della sessione
- la sessione del locale non dovrà chiudersi automaticamente al completamento del primo team, salvo scelta esplicita di design

### API & FRONTEND

- attenzione alla coerenza tra formato API e parsing lato frontend
- rischio mismatch tra:
  - struttura JSON restituita dalle API
  - struttura attesa dalla UI
- necessario standardizzare formato risposta API:
  - definire chiaramente: oggetto singolo vs array
  - evitare logiche ambigue lato client

- definire comportamento chiaro degli endpoint:
  - `/api/session` → lista, prima sessione o sessione attiva?
  - evitare ambiguità semantica negli endpoint

---

### SESSIONI & FLUSSO DI GIOCO

- la pagina `/play` dipende da una sessione con status `"active"`
- il seed deve creare almeno una sessione attiva per permettere test UI

- in futuro sarà necessario:
  - meccanismo esplicito di avvio sessione lato operatore
  - distinzione tra:
    - sessione creata
    - sessione attiva
    - sessione completata

- evitare logiche implicite basate su “prima sessione disponibile”

---

### SEED & DATI

- attualmente alcuni test dipendono da dati seed hardcoded
- nelle fasi successive:
  - UI e flow dovranno dipendere da selezione reale (sessione/team)
  - non da ID o dati fissi

- attuale seed NON garantisce idempotenza
- esecuzione multipla può generare duplicati (es. email unique)

- da verificare e risolvere:
  - se il seed deve:
    - resettare il DB
    - oppure aggiornare dati esistenti
  - strategia:
    - `upsert` vs `reset`

---

### VALIDAZIONE RISPOSTE (CRITICO UX)

- attuale validazione troppo rigida (match stringa esatta)

- necessario introdurre normalizzazione:
  - trim spazi
  - lowercase
  - rimozione punteggiatura

- gestione numeri:
  - equivalenza tra:
    - interi (42)
    - float (42.0, 42,00)

- gestione codici:
  - rimozione separatori:
    - spazi
    - trattini
    - formati tipo "1 9 8 4" o "1-9-8-4"

- gestione varianti:
  - articoli (es. "il barista")
  - sinonimi controllati (es. "barman")

- evitare per ora:
  - fuzzy matching complesso
  - AI o NLP avanzato

---

### GESTIONE HINT

- attualmente:
  - stesso hint può essere richiesto più volte
  - penalità applicata ogni volta → comportamento scorretto

- necessario:
  - bloccare riutilizzo dello stesso hint per step
  - oppure:
    - introdurre più hint progressivi

- tracciare:
  - hint già utilizzati per team/step

---

### UI / UX GIOCATORE

- stato finale attualmente incoerente:
  - UI mostra “completato”
  - ma input e azioni ancora attivi

- necessario:
  - disabilitare o nascondere input e bottoni a fine gioco

- migliorare feedback:
  - mostrare risposta inserita
  - mostrare esito chiaro (corretto/errato)

- progress bar:
  - ridondante a fine gioco
  - valutare sostituzione con:
    - riepilogo finale
    - punteggio
    - tempo

---

### TEST & DEBUG

- test API in PowerShell:
  - `curl` ≠ curl Linux
  - usare:
    - `Invoke-RestMethod`
    - oppure `curl.exe`

- evitare:
  - uso di `head`
  - pipe non compatibili

- file di test JSON:
  - NON lasciare nella root
  - usare:
    - `/tests/manual/`
    - oppure eliminarli dopo uso

---

### INFRASTRUTTURA MVP

- MVP = sistema completamente locale
- durante la serata:
  - il DB locale è la fonte dati principale
  - nessuna dipendenza esterna

- vincoli:
  - rete WiFi locale
  - PC locale = server
  - browser = client

---

### ARCHITETTURA FUTURA

- separazione sistemi:
  - sistema locale (gioco)
  - sistema creatore (contenuti)

- sincronizzazione:
  - asincrona
  - non real-time

- evitare accoppiamento tra:
  - sistema locale
  - sistema centrale

- possibile introduzione futura di AI per la validazione delle risposte:
  - NON sostituire la validazione deterministica core
  - usare AI solo come livello secondario
-possibili utilizzi AI:
  - classificazione risposte dubbie (corretta / errata / incerta)
  - suggerimento varianti accettabili
  - supporto alla review manuale
  - analisi delle risposte reali per migliorare gli enigmi
- vincoli per AI:
  - evitare dipendenza da servizi esterni durante la partita
  - preferire utilizzo lato creatore o in fase di analisi post-sessione
  - mantenere il sistema di gioco sempre deterministico e prevedibile

---

### SIMULAZIONE AMBIENTE

- PC fisso → creatore contenuti
- portatile → locale/pub (server di gioco)
- smartphone → giocatori

---

### PRINCIPI GUIDA

- evitare overengineering
- mantenere logica semplice e leggibile
- privilegiare robustezza UX rispetto a complessità tecnica
- costruire basi solide prima di scalare funzionalità