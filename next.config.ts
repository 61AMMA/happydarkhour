import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permette connessioni da rete locale in sviluppo
  // Risolve problemi di accesso da smartphone via IP
  // NOTA: Questo richiede avvio con: npm run dev -- -H 0.0.0.0
  
  // Configurazione per Turbopack (Next.js 16)
  turbopack: {
    // Configurazione vuota per compatibilità
  },
  
  // Permette accessi cross-origin da IP locale per HMR
  // Risolve warning "Blocked cross-origin request to Next.js dev resource"
  allowedDevOrigins: ['192.168.1.232'],
  
  // Disabilita HMR problematico su rete locale
  // Previne loading infinito quando si accede via IP
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 300,
      };
    }
    return config;
  }
};

export default nextConfig;
