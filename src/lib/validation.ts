// Funzioni di normalizzazione e validazione per il gioco

/**
 * Normalizza una risposta per il confronto
 * - trim spazi
 * - lowercase
 * - rimozione punteggiatura base
 * - gestione varianti numeriche
 * - gestione codici separati
 */
export function normalizeAnswer(answer: string): string {
  if (!answer) return '';

  return answer
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizza risposte numeriche con variazioni
 * Supporta: "42", "42.0", "42,00", "42 0", etc.
 */
export function normalizeNumericAnswer(answer: string): string {
  const normalized = normalizeAnswer(answer);
  return normalized.replace(/[.,\s]/g, '');
}

/**
 * Normalizza codici separati (es. "1984", "1 9 8 4", "1-9-8-4")
 */
export function normalizeCodeAnswer(answer: string): string {
  const normalized = normalizeAnswer(answer);
  return normalized.replace(/[\s-]/g, '');
}

/**
 * Verifica se due risposte sono equivalenti usando diverse strategie
 */
export function areAnswersEquivalent(userAnswer: string, correctAnswer: string): boolean {
  if (!userAnswer || !correctAnswer) return false;

  const userNorm = normalizeAnswer(userAnswer);
  const correctNorm = normalizeAnswer(correctAnswer);

  if (userNorm === correctNorm) return true;

  const userNumeric = normalizeNumericAnswer(userAnswer);
  const correctNumeric = normalizeNumericAnswer(correctAnswer);
  if (userNumeric === correctNumeric && /^\d+$/.test(userNumeric)) return true;

  const userDecimal = userAnswer.replace(/[.,]\d+$/, '').trim();
  const correctDecimal = correctAnswer.replace(/[.,]\d+$/, '').trim();
  if (userDecimal === correctDecimal && /^\d+$/.test(userDecimal)) return true;

  const userCode = normalizeCodeAnswer(userAnswer);
  const correctCode = normalizeCodeAnswer(correctAnswer);
  if (userCode === correctCode && userCode.length >= 4) return true;

  const userWithoutArticles = userNorm.replace(/^(il|lo|la|l'|i|gli|le|un|uno|una)\s+/, '');
  const correctWithoutArticles = correctNorm.replace(/^(il|lo|la|l'|i|gli|le|un|uno|una)\s+/, '');
  if (userWithoutArticles === correctWithoutArticles) return true;

  const synonyms: Record<string, string[]> = {
    barista: ['barman'],
    barman: ['barista'],
  };

  const userSynonyms = synonyms[userNorm] || [];
  if (userSynonyms.includes(correctNorm)) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Tipi per la validazione strutturata
// ---------------------------------------------------------------------------

export interface StepAnswerRecord {
  id: string;
  stepId: string;
  answer: string;
  points: number;
  position?: number | null;
  groupLabel?: string | null;
  fieldLabel?: string | null;
  emptyAllowed?: boolean;
}

// ---------------------------------------------------------------------------
// Validator: multi_text_ordered
// ---------------------------------------------------------------------------
export function validateMultiTextOrdered(
  userAnswerJson: string,
  stepAnswers: StepAnswerRecord[]
): boolean {
  let userAnswers: string[];
  try {
    userAnswers = JSON.parse(userAnswerJson);
    if (!Array.isArray(userAnswers)) return false;
  } catch {
    return false;
  }

  const sorted = [...stepAnswers].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  if (userAnswers.length !== sorted.length) return false;

  for (let i = 0; i < sorted.length; i++) {
    if (!areAnswersEquivalent(userAnswers[i], sorted[i].answer)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Validator: multi_group_ordered_numbers
// ---------------------------------------------------------------------------
export function validateMultiGroupOrderedNumbers(
  userAnswerJson: string,
  stepAnswers: StepAnswerRecord[]
): boolean {
  let userGroups: Record<string, number[]>;
  try {
    userGroups = JSON.parse(userAnswerJson);
    if (typeof userGroups !== 'object' || Array.isArray(userGroups)) return false;
  } catch {
    return false;
  }

  const grouped: Record<string, StepAnswerRecord[]> = {};
  for (const sa of stepAnswers) {
    const key = sa.groupLabel ?? '';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(sa);
  }

  for (const label of Object.keys(grouped)) {
    const sortedGroup = grouped[label].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const userSeq = userGroups[label];
    if (!Array.isArray(userSeq)) return false;
    if (userSeq.length !== sortedGroup.length) return false;
    for (let i = 0; i < sortedGroup.length; i++) {
      if (String(userSeq[i]) !== String(sortedGroup[i].answer)) return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Validator: ordered_sequence_letters
// ---------------------------------------------------------------------------
export function validateOrderedSequenceLetters(
  userAnswerJson: string,
  stepAnswers: StepAnswerRecord[]
): boolean {
  let userSeq: string[];
  try {
    const parsed = JSON.parse(userAnswerJson);
    if (Array.isArray(parsed)) {
      userSeq = parsed.map(String);
    } else if (typeof parsed === 'string') {
      userSeq = parsed.replace(/\s/g, '').split('');
    } else {
      return false;
    }
  } catch {
    userSeq = userAnswerJson.replace(/\s/g, '').split('');
  }

  const sorted = [...stepAnswers].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  if (userSeq.length !== sorted.length) return false;

  for (let i = 0; i < sorted.length; i++) {
    if (userSeq[i].toLowerCase() !== sorted[i].answer.toLowerCase()) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Validator: list_text_with_empty_allowed
// ---------------------------------------------------------------------------
export function validateListTextWithEmptyAllowed(
  userAnswerJson: string,
  stepAnswers: StepAnswerRecord[]
): boolean {
  let userValues: Record<string, string>;
  try {
    userValues = JSON.parse(userAnswerJson);
    if (typeof userValues !== 'object' || Array.isArray(userValues)) return false;
  } catch {
    return false;
  }

  for (const sa of stepAnswers) {
    const key = sa.fieldLabel ?? '';
    const userVal = (userValues[key] ?? '').trim();

    if (sa.emptyAllowed) {
      if (userVal !== '') return false;
    } else {
      if (userVal === '') return false;
      const variants = sa.answer.split('|').map((v) => v.trim());
      // Also generate "core noun" variants by stripping leading Italian prepositions/articles
      // so e.g. "d'interesse" and "di interesse" both produce "interesse" as extra candidate
      const expandedVariants = new Set(variants);
      for (const v of variants) {
        const core = v.replace(/^[a-zàèéìòù]{1,4}['''\s]+/i, '').trim();
        if (core && core !== v) expandedVariants.add(core);
      }
      const matchesAny = [...expandedVariants].some((variant) => areAnswersEquivalent(userVal, variant));
      if (!matchesAny) return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Validator: multi_number_unordered
// ---------------------------------------------------------------------------
export function validateMultiNumberUnordered(
  userAnswerJson: string,
  stepAnswers: StepAnswerRecord[]
): boolean {
  let userNums: number[];
  try {
    const parsed = JSON.parse(userAnswerJson);
    if (!Array.isArray(parsed)) return false;
    userNums = parsed.map(Number).filter((n) => !isNaN(n));
  } catch {
    return false;
  }

  const correctNums = stepAnswers.map((sa) => parseInt(sa.answer, 10));
  if (userNums.length !== correctNums.length) return false;

  const userSet = new Set(userNums.map(String));
  const correctSet = new Set(correctNums.map(String));

  for (const v of correctSet) {
    if (!userSet.has(v)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Validator: structured_choice_with_reason
// ---------------------------------------------------------------------------

// KAN-32: le keyword non sono più hardcoded ma lette da stepAnswers[].motivationKeywords
// Fallback: se nessun record ha motivationKeywords, accetta qualsiasi motivazione non vuota.
const PALINDROME_KEYWORDS_FALLBACK = [
  'palindrom',
  'letto al contrario',
  'uguale al contrario',
  'simmetric',
  'stessa al contrario',
];

export interface StepAnswerRecordWithKeywords extends StepAnswerRecord {
  motivationKeywords?: string | null;
}

export function validateStructuredChoiceWithReason(
  userAnswerJson: string,
  stepAnswers: StepAnswerRecordWithKeywords[]
): boolean {
  let userObj: { scelta?: string; frase?: string; motivazione?: string };
  try {
    userObj = JSON.parse(userAnswerJson);
    if (typeof userObj !== 'object' || Array.isArray(userObj)) return false;
  } catch {
    return false;
  }

  const byScelta = stepAnswers.find((sa) => sa.fieldLabel === 'scelta');
  const byFrase = stepAnswers.find((sa) => sa.fieldLabel === 'frase');
  const byMotivazione = stepAnswers.find((sa) => sa.fieldLabel === 'motivazione');

  if (!byScelta || String(userObj.scelta ?? '').trim() !== String(byScelta.answer).trim()) {
    return false;
  }

  if (!byFrase || String(userObj.frase ?? '').trim() !== String(byFrase.answer).trim()) {
    return false;
  }

  if (!byMotivazione) return false;
  const motiLower = (userObj.motivazione ?? '').toLowerCase();
  if (!motiLower) return false;

  // Legge le keyword dal DB (motivationKeywords è pipe-separated)
  // Se non presenti su nessun record, usa il fallback hardcoded (retrocompatibilità)
  const dbKeywords = stepAnswers
    .filter((sa) => sa.motivationKeywords)
    .flatMap((sa) => sa.motivationKeywords!.split('|').map((k) => k.trim().toLowerCase()))
    .filter(Boolean);

  const keywords = dbKeywords.length > 0 ? dbKeywords : PALINDROME_KEYWORDS_FALLBACK;

  // Fallback permissivo: se motivationKeywords è stringa vuota su tutti, accetta qualsiasi motivazione non vuota
  const allEmpty = stepAnswers.every(
    (sa) => sa.motivationKeywords !== undefined && sa.motivationKeywords !== null && sa.motivationKeywords.trim() === ''
  );
  if (allEmpty) return motiLower.length > 0;

  return keywords.some((kw) => motiLower.includes(kw));
}

// ---------------------------------------------------------------------------
// Dispatcher principale
// ---------------------------------------------------------------------------

const STRUCTURED_TYPES = new Set([
  'multi_text_ordered',
  'multi_group_ordered_numbers',
  'ordered_sequence_letters',
  'list_text_with_empty_allowed',
  'multi_number_unordered',
  'structured_choice_with_reason',
]);

export function isStructuredAnswerType(answerType: string): boolean {
  return STRUCTURED_TYPES.has(answerType);
}

export function validateStructuredAnswer(
  userAnswerJson: string,
  answerType: string,
  stepAnswers: StepAnswerRecord[]
): boolean {
  switch (answerType) {
    case 'multi_text_ordered':
      return validateMultiTextOrdered(userAnswerJson, stepAnswers);
    case 'multi_group_ordered_numbers':
      return validateMultiGroupOrderedNumbers(userAnswerJson, stepAnswers);
    case 'ordered_sequence_letters':
      return validateOrderedSequenceLetters(userAnswerJson, stepAnswers);
    case 'list_text_with_empty_allowed':
      return validateListTextWithEmptyAllowed(userAnswerJson, stepAnswers);
    case 'multi_number_unordered':
      return validateMultiNumberUnordered(userAnswerJson, stepAnswers);
    case 'structured_choice_with_reason':
      return validateStructuredChoiceWithReason(userAnswerJson, stepAnswers as StepAnswerRecordWithKeywords[]);
    default:
      return false;
  }
}
