<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Happy Dark Hour — Guida Setup Ambiente (KAN-18)

> Per nuovi collaboratori e agenti AI. Tempo stimato: < 10 minuti.

---

## Prerequisiti

- Node.js >= 20 (verifica: `node -v`)
- npm >= 10 (verifica: `npm -v`)
- Git

---

## Setup da zero (nuova macchina)

```bash
# 1. Clona il repository
git clone <url-repo> happydarkhour
cd happydarkhour

# 2. Installa dipendenze
npm install

# 3. Crea il file di configurazione locale
cp .env.example .env.local
# Modifica .env.local con l'IP LAN del PC (vedi sezione "Accesso LAN" sotto)

# 4. Inizializza il database SQLite e applica lo schema
npx prisma db push

# 5. Popola il database con la storia "La Garduña" (storia di produzione)
npm run seed:garduna

# 6. Avvia il server LAN (accessibile da dispositivi sulla stessa rete WiFi)
npm run dev:lan
```

Il server è pronto quando vedi: `Ready on http://0.0.0.0:3000`

Apri `http://localhost:3000` dal PC o `http://<IP-LAN>:3000` da uno smartphone connesso alla stessa WiFi.

---

## File .env.local — Configurazione obbligatoria

```env
# URL base del nodo LAN — usato per QR code e link giocatori
# Sostituisci con l'IP effettivo del PC (trova con `ipconfig` su Windows, `ip addr` su Linux/Mac)
NEXT_PUBLIC_BASE_URL=http://192.168.1.xxx:3000

# Password operatore per accesso al pannello /operator
OPERATOR_PASSWORD=cambia-questa-password

# Percorso al database SQLite
DATABASE_URL="file:./prisma/dev.db"
```

**Trovare l'IP LAN:**
- Windows: `ipconfig` → "Indirizzo IPv4" sotto la scheda WiFi
- Mac/Linux: `ip addr` o `ifconfig` → inet dell'interfaccia WiFi

---

## Aggiornare lo schema Prisma senza perdita dati

Il database è SQLite (`prisma/dev.db`). Prisma usa due comandi distinti:

### In sviluppo (metodo standard — ricrea il DB)

```bash
# Modifica prisma/schema.prisma, poi:
npx prisma db push
# Attenzione: azzera il DB se lo schema cambia in modo incompatibile
# Ripopola con:
npm run seed:garduna
```

### Con migration esplicita (preserva i dati)

```bash
# Crea e applica una migration con nome descrittivo
npx prisma migrate dev --name nome-descrittivo
# Esempio: npx prisma migrate dev --name add-step-hint

# In produzione (senza modificare lo schema):
npx prisma migrate deploy
```

### Regole schema SQLite — vincoli locked

Il file `prisma/schema.prisma` ha questo commento in cima:
```
// Compatible with SQLite - No enums, no Json fields
```

- **No enum Prisma** → usare `String` con valori validati a livello applicativo
- **No Json fields** → serializzare come stringa con separatori (es. pipe `|`)
- **Non aggiornare Prisma oltre 5.22.0** — versione locked per stabilità

### Backup prima di modifiche schema

```bash
cp prisma/dev.db prisma/dev.db.bak
# Ripristino se qualcosa va storto:
cp prisma/dev.db.bak prisma/dev.db
```

---

## Accesso LAN stabile (IP statico o mDNS)

### Opzione A — IP statico via DHCP (raccomandato per produzione)

Sul router WiFi del locale: assegna sempre lo stesso IP al MAC address del PC.
- Accedi al pannello router → DHCP → "IP statico" o "DHCP reservation"
- Lega il MAC del PC all'IP desiderato (es. `192.168.1.100`)
- Aggiorna `.env.local` con quell'IP

### Opzione B — Hostname mDNS (sviluppo su rete locale casalinga)

Su Windows con Bonjour (installato con iTunes/Apple devices):
```bash
# Il PC risponde a: nomemacchina.local
# Verifica: ping nomemacchina.local
# Usa in .env.local:
NEXT_PUBLIC_BASE_URL=http://nomemacchina.local:3000
```

Funziona solo se i dispositivi giocatori sono su rete che supporta mDNS (la maggior parte dei router moderni).

### Opzione C — Rilevamento IP automatico a runtime

Il server espone `GET /api/server-info` che restituisce l'IP LAN corrente rilevato con `os.networkInterfaces()`. Il componente QR code usa questa API invece di leggere la variabile d'ambiente. Soluzione migliore per reti con IP variabile.

### Firewall Windows — porta 3000

```
Pannello di controllo → Windows Defender Firewall → Regole in ingresso
→ Nuova regola → Porta → TCP → 3000 → Consenti → Profilo Privato
```

---

## Comandi utili

```bash
npm run dev           # Server sviluppo (solo localhost)
npm run dev:lan       # Server LAN (0.0.0.0:3000, accessibile da WiFi)
npm run build         # Build produzione
npm run start         # Avvio produzione (0.0.0.0:3000)
npm run seed          # Seed demo generico
npm run seed:garduna  # Seed storia "La Garduña" (storia di produzione)
npx prisma studio     # GUI database nel browser
npx tsc --noEmit      # Verifica TypeScript — DEVE restituire zero errori
```

---

## Verifica TypeScript (obbligatoria dopo ogni modifica)

```bash
npx tsc --noEmit
```

Zero errori in `src/` sono obbligatori prima di ogni commit o PR.

### Strip null bytes (Windows — encoding issue)

Dopo modifiche automatiche a file `.ts`/`.tsx`, verificare assenza di null bytes:

```bash
python3 -c "
import sys, os
for root, dirs, files in os.walk('src'):
    dirs[:] = [d for d in dirs if d != 'node_modules']
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            path = os.path.join(root, f)
            data = open(path, 'rb').read()
            if b'\\x00' in data:
                print('NULL BYTES in:', path)
                open(path, 'wb').write(data.replace(b'\\x00', b''))
                print('  → Rimossi')
"
```

---

## Struttura progetto

```
src/
  app/
    api/          # Route API Next.js (backend)
    operator/     # Dashboard operatore (richiede auth cookie)
    play/         # Pagina giocatore (pubblica, accesso via QR)
  lib/
    validation.ts # Engine validazione 8 tipi di risposta
    config.ts     # URL base e funzioni helper LAN
prisma/
  schema.prisma   # Schema SQLite — LOCKED Prisma 5.22.0
  seed.ts         # Seed demo generico
  seed-garduna.ts # Seed storia La Garduña (usare questo in produzione)
  dev.db          # Database SQLite (non committare)
```

---

## Dipendenze locked — NON aggiornare

| Package | Versione | Motivo |
|---------|----------|--------|
| `prisma` / `@prisma/client` | 5.22.0 | Schema SQLite stabile |
| `next` | 16.2.3 | App Router in produzione |
| `tailwindcss` | 4.x | Classi utility usate ovunque |

---

*Aggiornato: 2026-06-17 — KAN-18*
