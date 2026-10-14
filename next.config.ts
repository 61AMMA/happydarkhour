import type { NextConfig } from "next";

// Durante `npm run dev`, NODE_ENV = 'development'
// Durante `npx next build`, NODE_ENV = 'production'
// output: 'standalone' e outputFileTracingRoot sono necessari solo per la build installer
// In dev mode causano un conflitto con Turbopack che rompe la risoluzione di tailwindcss
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Standalone solo in produzione/build - non in dev
  ...(isProduction && {
    output: 'standalone',
    // Forza la root del progetto per il file tracing standalone.
    // Senza questo, Next.js segue package-lock.json in C:\Users\Utente\
    // e crea una struttura di cartelle sbagliata
    outputFileTracingRoot: process.cwd(),
  }),

  // Turbopack per next dev (build.ps1 usa --webpack esplicitamente)
  turbopack: {},

  // Permette accessi cross-origin da IP locale per HMR
  allowedDevOrigins: ['192.168.1.232', '100.78.179.31'],

  // Disabilita HMR problematico su rete locale
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
