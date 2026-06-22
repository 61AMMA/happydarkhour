// Configurazione per accesso locale da dispositivi esterni
// In produzione, questo valore dovrà essere configurato con l'IP statico del PC locale

export const LOCAL_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Funzione per ottenere l'URL base corretto
export function getBaseUrl(): string {
  // Per sviluppo su rete locale, sostituisci localhost con l'IP del PC
  if (typeof window !== 'undefined') {
    // In browser, usa l'host corrente se non è localhost
    const currentHost = window.location.host;
    if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
      // Se siamo in localhost, usa la configurazione ambientale
      return LOCAL_BASE_URL;
    }
    // Altrimenti usa l'host corrente (utile per test reali)
    return `${window.location.protocol}//${currentHost}`;
  }
  
  // In server-side rendering, usa la configurazione
  return LOCAL_BASE_URL;
}

// Funzione per generare link completi
export function generatePlayerLink(teamId: string): string {
  return `${getBaseUrl()}/play?team=${teamId}`;
}

export function generateViewOnlyLink(teamId: string): string {
  return `${getBaseUrl()}/play?team=${teamId}&viewOnly=true`;
}
