# M5 — Integrazione & Go-Live

**Obiettivo:** il prodotto è pronto per il primo locale reale.
Tutti i flussi operativi end-to-end funzionano senza intervento tecnico.

**Gate d'uscita:** un operatore sconosciuto (non il team) riesce a:
1. Creare un account Operator sul cloud
2. Installare il Nodo LAN sul proprio PC
3. Acquistare una storia e avviare una serata
4. Caricare il log post-serata

senza assistenza, leggendo solo la documentazione.

---

## Setup Cowork

| Voce | Valore |
|------|--------|
| Cartella locale | `C:\Users\Utente\Documents\workspace\happydarkhour` |
| Connettori | Jira (gianmarioemili.atlassian.net) |
| Skill aggiuntive | nessuna |

**Prerequisiti:** M1, M2, M3, M4 completate.

---

## Scope

### 5.1 Install flow
- Installer Windows/Mac per il Nodo LAN (script di setup automatico)
- Procedura Activation Code: generazione su cloud, inserimento sul LAN, download config + chiave pubblica
- Documentazione operatore: guida PDF/web passo-passo

### 5.2 Test end-to-end
- Flusso completo: registrazione → acquisto → sync → serata → upload log
- Test con almeno 2 ruoli reali (Creator + Operator diversi)
- Verifica audit trail: token generati vs consumati vs log ricevuti

### 5.3 Hardening
- Rate limiting API cloud
- Gestione errori graceful (LAN offline, token esauriti, sync fallita)
- Logging strutturato per debug remoto

### 5.4 Landing page (coordinare con PM)
- Pagina pubblica Happy Dark Hour
- Sezione per Operator (cosa ottieni, pricing)
- Sezione per Creator (futuro — marketplace aperto)
- CTA: "Diventa operatore" → registrazione Operator

---

## Prompt di apertura

```
Sei uno sviluppatore senior full-stack che lavora sul progetto Happy Dark Hour.
Il tuo obiettivo in questa chat è completare la milestone M5: Integrazione & Go-Live.

Leggi nell'ordine prima di iniziare:
1. CLAUDE.md
2. ARCHITECTURE.md  (sezione 5 — flussi operativi — è il tuo riferimento principale)
3. WORKFLOW.md

Poi leggi i ticket Jira milestone M5 su progetto KAN
(cloudId: 14fef55b-5da2-49f1-925a-caf0774e91cb) — il PM li avrà già creati.

Il tuo focus in questa chat:
1. Install flow Nodo LAN (script + Activation Code)
2. Test end-to-end di tutti i flussi operativi (ARCHITECTURE.md sezione 5)
3. Hardening e gestione errori
4. Landing page (se inclusa nel scope dal PM)

Approccio:
- Inizia dal flusso più critico: installazione + activation del Nodo LAN
- Testa ogni flusso con dati reali, non mock
- Documenta ogni step non ovvio in SETUP.md o in un documento operatore separato

Vincoli:
- L'installer deve funzionare su Windows senza privilegi amministrativi se possibile
- La landing page segue il brand: sfondo #0D0D0D, accento #CC0000, testo #F5F5F5
- Zero PII dei giocatori in qualsiasi log o comunicazione cloud
- Dopo ogni modifica: npx tsc --noEmit in tutte le app, zero errori

Inizia leggendo i file e i ticket, poi presentami la lista dei flussi da testare
con il loro stato attuale (funziona / da implementare / da testare).
```

---

## Note per il dev

- L'Activation Code è un codice monouso generato dalla piattaforma cloud — il LAN lo inserisce una sola volta
- Dopo l'activation, il LAN ha: chiave pubblica JWT + config operatore + lista storie acquistate
- La landing page può essere `apps/cloud/src/app/(public)/` separata dalle aree autenticate
- Il brand per la landing: @_happydarkhour su Instagram come riferimento visivo
