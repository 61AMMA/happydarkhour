# Configurazione Accesso Locale

Per usare il sistema in rete locale da smartphone, segui questi passaggi:

## 1. Configura l'IP locale

### File .env.local (creare nella root del progetto)

```
# Sostituisci con l'IP del tuo PC locale
NEXT_PUBLIC_BASE_URL=http://192.168.1.100:3000

# Esempi di configurazioni:
# NEXT_PUBLIC_BASE_URL=http://192.168.0.15:3000
# NEXT_PUBLIC_BASE_URL=http://10.0.0.5:3000
```

## 2. Avvia il server per accesso LAN

```bash
# Per accesso da smartphone in rete locale
npm run dev:lan

# Per sviluppo normale (solo localhost)
npm run dev
```

## 3. Come trovare l'IP del tuo PC

### Windows:
1. Apri Command Prompt
2. Esegui: `ipconfig`
3. Cerca "Indirizzo IPv4" sotto la tua scheda di rete (es: 192.168.1.100)

### Mac/Linux:
1. Apri terminale
2. Esegui: `ifconfig` o `ip addr`
3. Cerca l'indirizzo inet della tua interfaccia di rete

## 4. Verifica connessione

1. **Configura .env.local** con il tuo IP
2. **Avvia server LAN**: `npm run dev:lan`
3. **Dal PC**: apri `http://localhost:3000`
4. **Da smartphone**: apri `http://[TUO_IP]:3000`
5. **Test QR**: Genera QR dalla console e scansiona con smartphone

## 5. Troubleshooting

### Se smartphone non si connette:

1. **Verifica rete**:
   - PC e smartphone sulla stessa WiFi
   - IP corretto in .env.local

2. **Firewall Windows**:
   - Apri "Windows Defender Firewall con sicurezza avanzata"
   - "Regole in ingresso" > "Nuova regola"
   - "Porta" > TCP > Porta 3000 > "Consenti la connessione"
   - Seleziona "Profilo: Privato"

3. **Server non raggiungibile**:
   - Riavvia con `npm run dev:lan`
   - Controlla output: "Ready on http://0.0.0.0:3000"

### Procedura installazione locale:

1. Trova IP con `ipconfig`
2. Crea `.env.local` con `NEXT_PUBLIC_BASE_URL=http://[IP]:3000`
3. Configura firewall per porta 3000
4. Avvia con `npm run dev:lan`
5. Test accesso da smartphone
