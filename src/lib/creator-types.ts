// KAN-21 — Tipi condivisi per l'area Creator
// Usati da: API routes, StepEditor (KAN-25), HintPanel (KAN-26)

// ----------------------------------------------------------------
// Tipi di risposta supportati dall'engine di validazione (8 tipi)
// Stringa, non enum — vincolo SQLite (no enum Prisma)
// ----------------------------------------------------------------
export type AnswerType =
  | 'text_single'
  | 'number_single'
  | 'multi_text_ordered'
  | 'multi_group_ordered_numbers'
  | 'ordered_sequence_letters'
  | 'list_text_with_empty_allowed'
  | 'multi_number_unordered'
  | 'structured_choice_with_reason';

export const ANSWER_TYPE_LABELS: Record<AnswerType, string> = {
  text_single: 'Testo libero (singolo)',
  number_single: 'Numero singolo',
  multi_text_ordered: 'Più testi in ordine',
  multi_group_ordered_numbers: 'Gruppi di numeri in ordine',
  ordered_sequence_letters: 'Sequenza lettere in ordine',
  list_text_with_empty_allowed: 'Lista testi (campo vuoto ammesso)',
  multi_number_unordered: 'Più numeri (ordine libero)',
  structured_choice_with_reason: 'Scelta con motivazione',
};

// ----------------------------------------------------------------
// Tipi di hint
// ----------------------------------------------------------------
export type HintType = 'TEXT' | 'PHOTO' | 'VIDEO' | 'AUDIO';

export const HINT_TYPE_LABELS: Record<HintType, string> = {
  TEXT: 'Testo',
  PHOTO: 'Foto',
  VIDEO: 'Video',
  AUDIO: 'Audio',
};

// ----------------------------------------------------------------
// Form data per la creazione/modifica di una storia
// ----------------------------------------------------------------
export interface StoryFormData {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  durationMin: number;
}

// ----------------------------------------------------------------
// Form data per una risposta valida (StepAnswer in DB)
// ----------------------------------------------------------------
export interface AnswerFormEntry {
  id?: string;                    // presente se già salvata in DB
  answer: string;                 // valore esatto (varianti separate da | nel DB)
  points: number;
  position: number | null;        // per tipi ordinati
  groupLabel: string | null;      // per multi_group_ordered_numbers
  fieldLabel: string | null;      // label del campo specifico
  emptyAllowed: boolean;          // per list_text_with_empty_allowed
  motivationKeywords: string | null; // pipe-separated per structured_choice_with_reason
}

// ----------------------------------------------------------------
// Form data per un hint (StepHint in DB)
// ----------------------------------------------------------------
export interface HintFormEntry {
  id?: string;
  order: number;
  type: HintType;
  contentText: string | null;     // se type === 'TEXT'
  contentUrl: string | null;      // UUID-named URL se type !== 'TEXT'
  pointsCost: number;
  triggerMinutesAfterFirstClear: number;
}

// ----------------------------------------------------------------
// Form data completa per uno step (usata da StepEditor KAN-25)
// ----------------------------------------------------------------
export interface StepFormData {
  id?: string;
  stepNumber: number;
  title: string;
  description: string;            // narrativa/atmosfera (mai domanda diretta)
  question: string;               // campo di appoggio interno (non mostrato in chiaro)
  answerType: AnswerType;
  inputCount: number | null;
  inputConfig: string | null;     // JSON serializzato come stringa (vincolo SQLite)
  answers: AnswerFormEntry[];
  hints: HintFormEntry[];
}

// ----------------------------------------------------------------
// Risposta API GET /api/stories/[storyId]
// ----------------------------------------------------------------
export interface StoryWithSteps {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  durationMin: number;
  isActive: boolean;
  isInUse: boolean;
  createdAt: string;
  updatedAt: string;
  steps: StepSummary[];
}

export interface StepSummary {
  id: string;
  stepNumber: number;
  title: string;
  answerType: string;
  isActive: boolean;
  _count?: { answers: number; hints: number };
}

// ----------------------------------------------------------------
// Risposta API GET /api/steps/[stepId]
// ----------------------------------------------------------------
export interface StepDetail {
  id: string;
  storyId: string;
  stepNumber: number;
  title: string;
  description: string;
  question: string;
  answerType: string;
  inputCount: number | null;
  inputConfig: string | null;
  isActive: boolean;
  answers: Array<{
    id: string;
    answer: string;
    points: number;
    position: number | null;
    groupLabel: string | null;
    fieldLabel: string | null;
    emptyAllowed: boolean;
    motivationKeywords: string | null;
  }>;
  hints: Array<{
    id: string;
    order: number;
    type: string;
    contentText: string | null;
    contentUrl: string | null;
    pointsCost: number;
    triggerMinutesAfterFirstClear: number;
  }>;
  media?: Array<{
    id: string;
    url: string;
    mediaType: string;
    mimeType: string;
    originalName: string;
    fileSize: number;
    position: number;
  }>;
}
