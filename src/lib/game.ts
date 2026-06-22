// Logica per connettere la pagina giocatore alle API reali

export interface TeamData {
  id: string;
  name: string;
  members: number;
  score: number;
  isActive: boolean;
}

export interface ProgressData {
  currentStep: number;
  totalSteps: number;
  hintsUsed: number;
  totalScore: number;
  isCompleted: boolean;
}

export interface StepData {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  question: string;
  answerType: string;
  inputCount: number | null;
  inputConfig: string | null;
  answers: Array<{ id: string; answer: string; points: number; groupLabel?: string | null; position?: number | null; fieldLabel?: string | null; emptyAllowed?: boolean }>;
  hints: Array<{ id: string; text: string; cost: number }>;
  media?: Array<{ id: string; url: string; mediaType: string; mimeType: string; originalName: string; position: number }>;
}

export interface GameSession {
  id: string;
  status: string;
  startedAt?: string;
  maxDuration?: number;
  story: {
    id: string;
    title: string;
    durationMin: number;
  };
}

// Carica la sessione di gioco attiva
export async function getGameSession(): Promise<GameSession | null> {
  try {
    const response = await fetch('/api/session');
    if (!response.ok) return null;
    const session = await response.json();
    if (!session) return null;
    if (session.status !== 'active') return null;
    return session;
  } catch (error) {
    console.error('Errore nel caricare sessione:', error);
    return null;
  }
}

// Carica i team disponibili per una sessione
export async function getSessionTeams(sessionId: string): Promise<TeamData[]> {
  try {
    const response = await fetch(`/api/session/${sessionId}`);
    if (!response.ok) return [];
    const session = await response.json();
    return session.teams || [];
  } catch (error) {
    console.error('Errore nel caricare team:', error);
    return [];
  }
}

// Carica stato completo del team
export async function getTeamState(teamId: string): Promise<{
  team: TeamData | null;
  progress: ProgressData | null;
  currentStep: StepData | null;
  session: GameSession | null;
}> {
  try {
    const response = await fetch(`/api/team/${teamId}`);
    if (!response.ok) {
      return { team: null, progress: null, currentStep: null, session: null };
    }
    const data = await response.json();
    return {
      team: data.team,
      progress: data.progress,
      currentStep: data.currentStep,
      session: data.session,
    };
  } catch (error) {
    console.error('Errore nel caricare stato team:', error);
    return { team: null, progress: null, currentStep: null, session: null };
  }
}

// Invia una risposta
export async function submitAnswer(
  teamId: string,
  stepId: string,
  answer: string
): Promise<{
  success: boolean;
  isCorrect: boolean;
  points: number;
  nextStep: number | null;
  isCompleted: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/team/${teamId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer, stepId }),
    });
    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        isCorrect: false,
        points: 0,
        nextStep: null,
        isCompleted: false,
        error: data.error || 'Errore sconosciuto',
      };
    }
    return {
      success: data.success,
      isCorrect: data.isCorrect,
      points: data.points,
      nextStep: data.nextStep,
      isCompleted: data.isCompleted,
    };
  } catch (error) {
    console.error("Errore nell'inviare risposta:", error);
    return {
      success: false,
      isCorrect: false,
      points: 0,
      nextStep: null,
      isCompleted: false,
      error: 'Errore di connessione',
    };
  }
}

// Ottiene ranking della sessione
export async function getSessionRanking(sessionId: string): Promise<{
  success: boolean;
  sessionId?: string;
  sessionStatus?: string;
  totalTeams?: number;
  teams?: Array<{
    position: number;
    teamId: string;
    teamName: string;
    totalScore: number;
    hintsUsed: number;
    currentStep: number;
    totalSteps: number;
    isCompleted: boolean;
    completedAt?: string;
  }>;
  error?: string;
}> {
  try {
    const response = await fetch(`/api/session/${sessionId}/ranking`);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Errore sconosciuto' };
    }
    return {
      success: data.success !== false,
      sessionId: data.sessionId,
      sessionStatus: data.sessionStatus,
      totalTeams: data.totalTeams,
      teams: data.teams,
    };
  } catch (error) {
    console.error('Errore nel caricare ranking:', error);
    return { success: false, error: 'Errore di connessione' };
  }
}
