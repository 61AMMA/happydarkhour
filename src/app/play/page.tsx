'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import {
  getGameSession,
  getSessionTeams,
  getTeamState,
  submitAnswer,
  getSessionRanking,
  StepData,
} from '@/lib/game';
import { generateViewOnlyLink } from '@/lib/config';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const STRUCTURED_TYPES = new Set([
  'multi_text_ordered',
  'multi_group_ordered_numbers',
  'ordered_sequence_letters',
  'list_text_with_empty_allowed',
  'multi_number_unordered',
  'structured_choice_with_reason',
]);

// ---------------------------------------------------------------------------
// Hint types (KAN-19)
// ---------------------------------------------------------------------------

interface HintState {
  id: string;
  order: number;
  type: string; // TEXT, PHOTO, VIDEO, AUDIO
  pointsCost: number;
  triggerMinutesAfterFirstClear: number;
  status: 'locked' | 'available' | 'used';
  availableAt: string | null;
  contentText?: string | null;
  contentUrl?: string | null;
}

// ---------------------------------------------------------------------------
// DynamicAnswerInput
// ---------------------------------------------------------------------------

function DynamicAnswerInput({
  step,
  onReady,
  disabled,
}: {
  step: StepData;
  onReady: (value: string) => void;
  disabled: boolean;
}) {
  const answerType = step.answerType ?? 'text_single';
  // Per tipi multi-campo: usa il numero di risposte caricate se inputCount non è impostato
  const answersCount = step.answers?.length ?? 0;
  const inputCount =
    step.inputCount ??
    (['multi_text_ordered', 'ordered_sequence_letters', 'multi_number_unordered'].includes(answerType) && answersCount > 0
      ? answersCount
      : 1);
  let inputConfig: any = null;
  try {
    if (step.inputConfig) inputConfig = JSON.parse(step.inputConfig);
  } catch {
    inputConfig = null;
  }

  // ---- multi_text_ordered ----
  const [fields, setFields] = useState<string[]>(() => Array(inputCount).fill(''));
  const updateField = useCallback((i: number, val: string) => {
    setFields((prev) => { const n = [...prev]; n[i] = val; return n; });
  }, []);
  useEffect(() => {
    if (answerType === 'multi_text_ordered') onReady(JSON.stringify(fields));
  }, [fields, answerType, onReady]);

  // ---- multi_group_ordered_numbers ----
  const [groups, setGroups] = useState<Record<string, string[]>>(() => {
    if (answerType !== 'multi_group_ordered_numbers' || !inputConfig?.groups) return {};
    const init: Record<string, string[]> = {};
    for (const g of inputConfig.groups) init[g.label] = Array(g.fieldCount).fill('');
    return init;
  });
  const updateGroupField = useCallback((label: string, i: number, val: string) => {
    setGroups((prev) => {
      const n = { ...prev };
      n[label] = [...(n[label] ?? [])];
      n[label][i] = val;
      return n;
    });
  }, []);
  useEffect(() => {
    if (answerType === 'multi_group_ordered_numbers') {
      const nums: Record<string, number[]> = {};
      for (const [k, v] of Object.entries(groups)) nums[k] = v.map(Number);
      onReady(JSON.stringify(nums));
    }
  }, [groups, answerType, onReady]);

  // ---- ordered_sequence_letters ----
  const [seq, setSeq] = useState<string[]>(() => Array(inputCount).fill(''));
  const updateSeq = useCallback((i: number, val: string) => {
    setSeq((prev) => { const n = [...prev]; n[i] = val; return n; });
  }, []);
  useEffect(() => {
    if (answerType === 'ordered_sequence_letters')
      onReady(JSON.stringify(seq.map((s) => s.toUpperCase())));
  }, [seq, answerType, onReady]);

  // ---- list_text_with_empty_allowed ----
  const [luoghiValues, setLuoghiValues] = useState<Record<string, string>>({});
  const updateLuogo = useCallback((label: string, val: string) => {
    setLuoghiValues((prev) => ({ ...prev, [label]: val }));
  }, []);
  useEffect(() => {
    if (answerType === 'list_text_with_empty_allowed') onReady(JSON.stringify(luoghiValues));
  }, [luoghiValues, answerType, onReady]);

  // ---- multi_number_unordered ----
  const [nums, setNums] = useState<string[]>(() => Array(inputCount).fill(''));
  const updateNum = useCallback((i: number, val: string) => {
    setNums((prev) => { const n = [...prev]; n[i] = val; return n; });
  }, []);
  useEffect(() => {
    if (answerType === 'multi_number_unordered') {
      const parsed = nums.map(Number).filter((n) => !isNaN(n) && n !== 0);
      onReady(JSON.stringify(parsed));
    }
  }, [nums, answerType, onReady]);

  // ---- structured_choice_with_reason ----
  const [scelta, setScelta] = useState('');
  const [frase, setFrase] = useState('');
  const [motivazione, setMotivazione] = useState('');
  useEffect(() => {
    if (answerType === 'structured_choice_with_reason')
      onReady(JSON.stringify({ scelta, frase, motivazione }));
  }, [scelta, frase, motivazione, answerType, onReady]);

  // ---- Render ----

  if (answerType === 'multi_text_ordered') {
    return (
      <div className="space-y-2">
        {Array.from({ length: inputCount }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-gray-400 text-sm w-6 text-right">{i + 1}.</span>
            <input
              type="text"
              value={fields[i] ?? ''}
              onChange={(e) => updateField(i, e.target.value)}
              disabled={disabled}
              placeholder={inputConfig?.fields?.[i]?.placeholder ?? `Parola ${i + 1}`}
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        ))}
      </div>
    );
  }

  if (answerType === 'multi_group_ordered_numbers') {
    // Deriva gruppi da inputConfig o, come fallback, dalle risposte dello step
    let groupDefs: Array<{ label: string; fieldCount: number }> = inputConfig?.groups ?? [];
    if (groupDefs.length === 0 && step.answers && step.answers.length > 0) {
      const grouped = new Map<string, number>();
      for (const a of step.answers) {
        const label = a.groupLabel ?? 'A';
        grouped.set(label, (grouped.get(label) ?? 0) + 1);
      }
      groupDefs = Array.from(grouped.entries()).map(([label, count]) => ({ label, fieldCount: count }));
    }
    // Fallback finale: 1 gruppo con 3 campi
    if (groupDefs.length === 0) groupDefs = [{ label: 'A', fieldCount: 3 }];
    return (
      <div className="space-y-4">
        {groupDefs.map((g) => (
          <div key={g.label} className="bg-gray-900 rounded-lg p-3">
            <p className="text-sm font-bold text-yellow-400 mb-2">Gruppo {g.label}</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: g.fieldCount }, (_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-xs text-gray-500 mb-1">{i + 1}°</span>
                  <input
                    type="number"
                    value={(groups[g.label] ?? [])[i] ?? ''}
                    onChange={(e) => updateGroupField(g.label, i, e.target.value)}
                    disabled={disabled}
                    className="w-14 px-2 py-2 bg-gray-800 border border-gray-600 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (answerType === 'ordered_sequence_letters') {
    const ordinals = ['1°', '2°', '3°', '4°', '5°', '6°'];
    return (
      <div className="flex gap-3 flex-wrap">
        {Array.from({ length: inputCount }, (_, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-1">{ordinals[i] ?? `${i + 1}°`}</span>
            <input
              type="text"
              maxLength={1}
              value={seq[i] ?? ''}
              onChange={(e) => updateSeq(i, e.target.value.toUpperCase())}
              disabled={disabled}
              className="w-12 px-2 py-2 bg-gray-900 border border-gray-700 rounded text-white text-center font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        ))}
      </div>
    );
  }

  if (answerType === 'list_text_with_empty_allowed') {
    // Deriva righe da inputConfig?.items oppure dai fieldLabel delle risposte
    let items: Array<{ label: string; emptyAllowed: boolean }> = inputConfig?.items ?? [];
    if (items.length === 0 && step.answers && step.answers.length > 0) {
      items = step.answers.map((a) => ({
        label: (a as any).fieldLabel ?? a.answer,
        emptyAllowed: (a as any).emptyAllowed ?? false,
      }));
    }
    // Intestazioni colonne configurabili dal creator via inputConfig
    const colLabel = inputConfig?.columnLabel ?? 'Nome';
    const colValue = inputConfig?.columnValue ?? 'Valore';
    const hint = inputConfig?.hint ?? null;

    if (items.length === 0) {
      return <p className="text-yellow-500 text-sm">Nessun campo configurato per questo step.</p>;
    }

    return (
      <div>
        {hint && (
          <p className="text-sm font-bold text-yellow-400 mb-3">⚠️ {hint}</p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 pr-3">{colLabel}</th>
                <th className="text-left py-2">{colValue}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.label} className="border-b border-gray-800">
                  <td className="py-2 pr-3 text-gray-300 font-medium whitespace-nowrap">{item.label}</td>
                  <td className="py-2">
                    <input
                      type="text"
                      value={luoghiValues[item.label] ?? ''}
                      onChange={(e) => updateLuogo(item.label, e.target.value)}
                      disabled={disabled}
                      placeholder={item.emptyAllowed ? '(lascia vuoto)' : '…'}
                      className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (answerType === 'multi_number_unordered') {
    return (
      <div>
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: inputCount }, (_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <label className="text-sm text-gray-400">Numero {i + 1}</label>
              <input
                type="number"
                value={nums[i] ?? ''}
                onChange={(e) => updateNum(i, e.target.value)}
                disabled={disabled}
                className="w-24 px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">L&apos;ordine non conta</p>
      </div>
    );
  }

  if (answerType === 'structured_choice_with_reason') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">La tua scelta:</label>
          <input
            type="text"
            value={scelta}
            onChange={(e) => setScelta(e.target.value)}
            disabled={disabled}
            placeholder="Inserisci la parola o elemento scelto..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Frase in cui compare:</label>
          <input
            type="text"
            value={frase}
            onChange={(e) => setFrase(e.target.value)}
            disabled={disabled}
            placeholder="Indica la frase dove hai trovato la scelta..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Motivazione:</label>
          <textarea
            value={motivazione}
            onChange={(e) => setMotivazione(e.target.value)}
            disabled={disabled}
            rows={3}
            placeholder="Spiega perché hai fatto questa scelta..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
          />
        </div>
      </div>
    );
  }

  // Fallback — should not reach here for structured types
  return null;
}

// ---------------------------------------------------------------------------
// PlayPage
// ---------------------------------------------------------------------------

function PlayPageInner() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get('team');
  const viewOnly = searchParams.get('viewOnly') === 'true';

  const [session, setSession] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [teamState, setTeamState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [structuredAnswer, setStructuredAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [ranking, setRanking] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // KAN-19: hint state
  const [hints, setHints] = useState<HintState[]>([]);
  const [hintModal, setHintModal] = useState<HintState | null>(null);
  const [usingHint, setUsingHint] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const handleStructuredReady = useCallback((val: string) => {
    setStructuredAnswer(val);
  }, []);

  // Svuota messaggio e risposte quando cambia step
  const currentStepId = teamState?.currentStep?.id;
  useEffect(() => {
    setMessage('');
    setAnswer('');
    setStructuredAnswer('');
  }, [currentStepId]);

  useEffect(() => {
    async function loadData() {
      try {
        const gameSession = await getGameSession();
        if (!gameSession) {
          setMessage('Nessuna sessione attiva trovata');
          setLoading(false);
          return;
        }
        setSession(gameSession);
        if (teamId) {
          const state = await getTeamState(teamId);
          if (state.team) {
            setSelectedTeam(state.team);
            setTeamState(state);
          } else {
            setMessage('Team non trovato');
            setLoading(false);
            return;
          }
        } else {
          const sessionTeams = await getSessionTeams(gameSession.id);
          setTeams(sessionTeams);
        }
        setLoading(false);
      } catch (error) {
        console.error('Errore caricamento dati:', error);
        setMessage('Errore nel caricare i dati di gioco');
        setLoading(false);
      }
    }
    loadData();
  }, [teamId, viewOnly]);

  // Countdown timer for the session
  useEffect(() => {
    if (!session) return;
    const updateTimer = () => {
      const now = new Date();
      const startedAt = new Date(session.startedAt);
      const maxDurationMs = session.maxDuration * 60 * 1000;
      const elapsedMs = now.getTime() - startedAt.getTime();
      const remainingMs = Math.max(0, maxDurationMs - elapsedMs);
      setTimeRemaining(remainingMs);
      setIsExpired(remainingMs <= 0);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Tick each second (for locked hint countdown display)
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!session || !selectedTeam) return;
    const shouldLoadRanking = teamState?.progress?.isCompleted || isExpired;
    if (shouldLoadRanking && !ranking) loadRanking();
  }, [session, selectedTeam, teamState, isExpired, ranking]);

  // KAN-19: load hints when step changes
  const loadHints = useCallback(async (currentSession: any, currentTeam: any, currentTeamState: any) => {
    if (!currentSession || !currentTeam || !currentTeamState?.currentStep) return;
    try {
      const res = await fetch(
        `/api/session/${currentSession.id}/hints/${currentTeamState.currentStep.id}?teamId=${currentTeam.id}`
      );
      if (res.ok) setHints(await res.json());
    } catch { /* network error, ignore */ }
  }, []);

  useEffect(() => {
    if (session && selectedTeam && teamState?.currentStep) {
      loadHints(session, selectedTeam, teamState);
    }
  }, [session, selectedTeam, teamState?.currentStep?.id, loadHints]);

  // Poll locked hints every 30s
  useEffect(() => {
    const hasLocked = hints.some((h) => h.status === 'locked');
    if (!hasLocked || !session || !selectedTeam || !teamState?.currentStep) return;
    const id = setInterval(() => loadHints(session, selectedTeam, teamState), 30_000);
    return () => clearInterval(id);
  }, [hints, session, selectedTeam, teamState, loadHints]);

  // KAN-19: use a hint
  const handleUseHint = async (hint: HintState) => {
    if (!session || !selectedTeam) return;
    setUsingHint(true);
    try {
      const res = await fetch(
        `/api/session/${session.id}/hints/${hint.id}/use`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: selectedTeam.id }),
        }
      );
      setHintModal(null);
      if (res.ok) {
        const newState = await getTeamState(selectedTeam.id);
        if (newState.team) {
          setTeamState(newState);
          await loadHints(session, selectedTeam, newState);
        }
      } else {
        const data = await res.json();
        setMessage(data.error || 'Errore nell\'usare il suggerimento');
      }
    } catch {
      setMessage('Errore di rete');
      setHintModal(null);
    } finally {
      setUsingHint(false);
    }
  };

  const loadRanking = async () => {
    if (!session) return;
    try {
      const rankingData = await getSessionRanking(session.id);
      if (rankingData.success) setRanking(rankingData);
    } catch (error) {
      console.error('Errore caricamento ranking:', error);
    }
  };

  const selectTeam = async (id: string) => {
    setLoading(true);
    const state = await getTeamState(id);
    if (state.team) {
      setSelectedTeam(state.team);
      setTeamState(state);
      setMessage('');
    }
    setLoading(false);
  };

  const submitAnswerHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamState?.currentStep || submitting || teamState.progress?.isCompleted || isExpired || viewOnly) {
      if (viewOnly) setMessage('Modalità view-only: non è possibile inviare risposte');
      return;
    }

    const isStructured = STRUCTURED_TYPES.has(teamState.currentStep.answerType ?? '');
    const finalAnswer = isStructured ? structuredAnswer : answer.trim();
    if (!finalAnswer) return;

    setSubmitting(true);
    setMessage('');

    try {
      const result = await submitAnswer(selectedTeam.id, teamState.currentStep.id, finalAnswer);
      if (result.success) {
        setAnswer('');
        if (result.isCompleted) {
          setMessage('Complimenti! Avete completato la storia!');
          const finalState = await getTeamState(selectedTeam.id);
          if (finalState.team) setTeamState(finalState);
        } else {
          setMessage(`Risposta corretta! Punti: +${result.points}`);
          const newState = await getTeamState(selectedTeam.id);
          if (newState.team) {
            setTeamState(newState);
            // Reload hints for new step
            await loadHints(session, selectedTeam, newState);
          }
        }
      } else {
        setMessage('Risposta errata. Riprova!');
      }
    } catch (error) {
      console.error("Errore submit risposta:", error);
      setMessage("Errore durante l'invio. Riprova!");
    } finally {
      setSubmitting(false);
    }
  };

  const showViewOnlyQR = async () => {
    if (!selectedTeam?.id) return;
    const viewOnlyLink = generateViewOnlyLink(selectedTeam.id);
    try {
      const qrDataUrl = await QRCode.toDataURL(viewOnlyLink, {
        width: 256,
        margin: 2,
        color: { dark: '#FFFFFF', light: '#1F2937' },
      });
      setQrCodeUrl(qrDataUrl);
      setShowQRModal(true);
    } catch (error) {
      console.error('Errore generazione QR:', error);
    }
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setQrCodeUrl('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Happy Dark Hour</h1>
          <p className="text-gray-400">{message || 'Nessuna sessione attiva'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h1 className="text-xl font-bold text-center">{session.story.title}</h1>
          <div className="flex justify-between text-sm mt-2">
            <span>Team: {selectedTeam?.teamName || 'Non selezionato'}</span>
            <div className="flex items-center gap-2">
              <span>Punti: {teamState?.progress?.totalScore || 0}</span>
              {viewOnly && (
                <span className="px-2 py-1 bg-purple-600 text-xs rounded">View-only</span>
              )}
            </div>
          </div>
        </div>

        {/* Team info + timer */}
        {selectedTeam && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedTeam.teamName}</h2>
                <p className="text-sm text-gray-400">{session?.story?.title}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-400">
                  {teamState?.progress?.totalScore || 0} pts
                </p>
                <p className="text-sm text-gray-400">
                  Step {teamState?.progress?.currentStep || 0}/{teamState?.progress?.totalSteps || 1}
                </p>
                {!viewOnly && (
                  <button
                    onClick={showViewOnlyQR}
                    className="mt-2 bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-xs"
                  >
                    QR per compagni
                  </button>
                )}
              </div>
            </div>

            {timeRemaining !== null && (
              <div className={`mt-4 p-3 rounded-lg text-center ${isExpired ? 'bg-red-900' : 'bg-gray-900'}`}>
                <p className="text-sm font-medium mb-1">
                  {isExpired ? 'Tempo scaduto' : 'Tempo rimanente'}
                </p>
                <p className={`text-2xl font-bold ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                  {formatTime(timeRemaining)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Selezione team */}
        {!selectedTeam && teams.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-4">
            <h2 className="text-lg font-bold mb-4">Seleziona il tuo team</h2>
            <div className="space-y-3">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => selectTeam(team.id)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg text-left transition-colors"
                >
                  <div className="font-semibold">{team.teamName}</div>
                  <div className="text-sm text-gray-400">
                    {team.members} giocatori • {team.score} punti
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Progress bar */}
        {selectedTeam && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="text-center mb-2">
              <div className="text-sm text-gray-400">
                Step {teamState?.progress?.currentStep || 0} di {teamState?.progress?.totalSteps || 0}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((teamState?.progress?.currentStep || 0) / (teamState?.progress?.totalSteps || 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Game completed / expired */}
        {teamState?.progress?.isCompleted || isExpired ? (
          <div className={`${teamState?.progress?.isCompleted ? 'bg-green-800' : 'bg-red-800'} rounded-lg p-6 mb-4 text-center`}>
            <h2 className="text-2xl font-bold mb-4">
              {teamState?.progress?.isCompleted ? 'Complimenti!' : 'Tempo scaduto!'}
            </h2>
            <p className="text-lg mb-4">
              {teamState?.progress?.isCompleted
                ? 'Avete completato la storia'
                : 'Il tempo a disposizione è terminato'}
            </p>
            <p className="text-xl font-bold mb-2">{session?.story?.title}</p>

            <div className={`${teamState?.progress?.isCompleted ? 'bg-green-900' : 'bg-red-900'} rounded-lg p-4 mb-4`}>
              <p className="text-lg font-bold mb-2">Il tuo riepilogo</p>
              <p className="text-lg">Punti totali: {teamState?.progress?.totalScore || 0}</p>
              <p className="text-sm opacity-90">Hint usati: {teamState?.progress?.hintsUsed || 0}</p>
              {ranking && ranking.teams && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-lg font-bold text-yellow-400">
                    Posizione: #{ranking.teams.find((t: any) => t.teamId === selectedTeam.id)?.position || 'N/A'}
                  </p>
                  <p className="text-sm opacity-75">su {ranking.totalTeams} team totali</p>
                </div>
              )}
            </div>

            {ranking && ranking.teams && (
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <p className="text-lg font-bold mb-3 text-center">Ranking Finale</p>
                <div className="space-y-2">
                  {ranking.teams.map((team: any) => (
                    <div
                      key={team.teamId}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        team.teamId === selectedTeam.id
                          ? 'bg-yellow-800 border-2 border-yellow-600'
                          : 'bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`font-bold text-lg ${
                          team.position === 1 ? 'text-yellow-400' :
                          team.position === 2 ? 'text-gray-300' :
                          team.position === 3 ? 'text-orange-600' : 'text-gray-400'
                        }`}>
                          #{team.position}
                        </span>
                        <div>
                          <p className="font-semibold">{team.teamName}</p>
                          <p className="text-sm opacity-75">
                            {team.isCompleted ? 'Completato' : `Step ${team.currentStep}/${team.totalSteps}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{team.totalScore} pts</p>
                        <p className="text-xs opacity-75">{team.hintsUsed} hints</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-gray-300">
              {teamState?.progress?.isCompleted ? 'La partita è terminata!' : 'La sessione è scaduta!'}
            </p>
          </div>

        ) : teamState?.currentStep ? (
          <>
            {/* Current step */}
            <div className="bg-gray-800 rounded-lg p-6 mb-4">
              <h2 className="text-lg font-bold mb-4">
                Step {teamState.currentStep.stepNumber}: {teamState.currentStep.title}
              </h2>
              <p className="text-gray-300 mb-6 whitespace-pre-wrap">{teamState.currentStep.description}</p>

              {/* Media allegati (KAN-27) */}
              {teamState.currentStep.media && teamState.currentStep.media.length > 0 && (
                <div className="flex flex-col gap-4 mb-6">
                  {teamState.currentStep.media.map((m: { id: string; url: string; mediaType: string; mimeType: string; originalName: string }) => {
                    if (m.mediaType === 'IMAGE') {
                      return (
                        <img
                          key={m.id}
                          src={m.url}
                          alt={m.originalName}
                          className="w-full rounded-lg max-h-[70vh] object-contain bg-black"
                        />
                      );
                    }
                    if (m.mediaType === 'PDF') {
                      return (
                        <div key={m.id} className="flex flex-col gap-2">
                          <iframe
                            src={m.url}
                            className="w-full rounded-lg"
                            style={{ height: '70vh' }}
                            title={m.originalName}
                          />
                          <a
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline text-center"
                          >
                            Apri PDF in una nuova scheda
                          </a>
                        </div>
                      );
                    }
                    if (m.mediaType === 'AUDIO') {
                      return (
                        <audio key={m.id} controls className="w-full">
                          <source src={m.url} type={m.mimeType} />
                        </audio>
                      );
                    }
                    if (m.mediaType === 'VIDEO') {
                      return (
                        <video key={m.id} controls className="w-full rounded-lg max-h-[70vh]">
                          <source src={m.url} type={m.mimeType} />
                        </video>
                      );
                    }
                    return null;
                  })}
                </div>
              )}

              <form onSubmit={submitAnswerHandler} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">La tua risposta:</label>
                  {STRUCTURED_TYPES.has(teamState.currentStep.answerType ?? '') ? (
                    <DynamicAnswerInput
                      step={teamState.currentStep}
                      onReady={handleStructuredReady}
                      disabled={submitting || viewOnly}
                    />
                  ) : (
                    <input
                      type={teamState.currentStep.answerType === 'number_single' ? 'number' : 'text'}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      placeholder={viewOnly ? 'Modalità view-only - solo visualizzazione' : 'Scrivi la tua risposta qui...'}
                      disabled={submitting || viewOnly}
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    viewOnly ||
                    (STRUCTURED_TYPES.has(teamState.currentStep.answerType ?? '')
                      ? !structuredAnswer
                      : !answer.trim())
                  }
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {viewOnly ? 'View-only' : submitting ? 'Invio in corso...' : 'Invia risposta'}
                </button>
              </form>
            </div>

            {/* KAN-19: Suggerimenti */}
            {hints.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                  Suggerimenti disponibili
                </h3>
                <div className="space-y-2">
                  {hints.map((hint) => {
                    if (hint.status === 'locked') {
                      const remainingMs = hint.availableAt
                        ? Math.max(0, new Date(hint.availableAt).getTime() - nowTick)
                        : null;
                      return (
                        <div
                          key={hint.id}
                          className="flex items-center gap-3 p-3 bg-gray-700/40 rounded-lg cursor-not-allowed select-none"
                        >
                          <span className="text-gray-500 text-lg">🔒</span>
                          <div className="flex-1">
                            <p className="text-gray-500 text-sm">Suggerimento {hint.order}</p>
                            {remainingMs !== null && (
                              <p className="text-xs text-gray-600">
                                Disponibile in {formatTime(remainingMs)}
                              </p>
                            )}
                            {remainingMs === null && (
                              <p className="text-xs text-gray-600">Completa lo step per sbloccare</p>
                            )}
                          </div>
                          <span className="text-gray-600 text-xs">-{hint.pointsCost} pt</span>
                        </div>
                      );
                    }

                    if (hint.status === 'used') {
                      return (
                        <div
                          key={hint.id}
                          className="p-3 bg-green-900/20 border border-green-700/40 rounded-lg"
                        >
                          <p className="text-green-400 text-sm font-medium mb-2">
                            ✓ Suggerimento {hint.order} — usato
                          </p>
                          {hint.type === 'TEXT' && hint.contentText && (
                            <p className="text-gray-200 text-sm whitespace-pre-wrap">{hint.contentText}</p>
                          )}
                          {hint.type === 'PHOTO' && hint.contentUrl && (
                            <img src={hint.contentUrl} alt={`Suggerimento ${hint.order}`} className="max-w-full rounded mt-1" />
                          )}
                          {hint.type === 'VIDEO' && hint.contentUrl && (
                            <video src={hint.contentUrl} controls className="max-w-full rounded mt-1" />
                          )}
                          {hint.type === 'AUDIO' && hint.contentUrl && (
                            <audio src={hint.contentUrl} controls className="w-full mt-1" />
                          )}
                        </div>
                      );
                    }

                    // available
                    return (
                      <button
                        key={hint.id}
                        onClick={() => !viewOnly && setHintModal(hint)}
                        disabled={viewOnly}
                        className="w-full flex items-center gap-3 p-3 bg-yellow-900/20 border border-yellow-600/40 rounded-lg hover:bg-yellow-800/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
                      >
                        <span className="text-yellow-400 text-lg">💡</span>
                        <div className="flex-1">
                          <p className="text-yellow-300 text-sm font-medium">Suggerimento {hint.order}</p>
                          <p className="text-xs text-yellow-500/70">
                            {hint.type === 'TEXT' ? 'Testo'
                              : hint.type === 'PHOTO' ? 'Foto'
                              : hint.type === 'VIDEO' ? 'Video'
                              : 'Audio'}
                          </p>
                        </div>
                        <span className="text-yellow-400 text-sm font-bold">-{hint.pointsCost} pt</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : null}

        {/* Messaggi */}
        {message && (
          <div className={`rounded-lg p-4 text-center mb-4 ${
            message.includes('corretta') || message.includes('Complimenti') ? 'bg-green-800' :
            message.includes('errata') ? 'bg-red-800' :
            'bg-blue-800'
          }`}>
            <p>{message}</p>
          </div>
        )}

        {/* QR Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="text-center">
                <h3 className="text-lg font-bold mb-4">QR Code View-Only</h3>
                {qrCodeUrl && (
                  <div className="bg-white p-4 rounded-lg mb-4 inline-block">
                    <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                  </div>
                )}
                <div className="text-xs text-gray-400 mb-4 break-all">
                  {generateViewOnlyLink(selectedTeam?.id || '')}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigator.clipboard.writeText(generateViewOnlyLink(selectedTeam?.id || ''))}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                  >
                    Copia Link
                  </button>
                  <button
                    onClick={closeQRModal}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KAN-19: Modal conferma hint */}
        {hintModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl border border-yellow-700/30">
              <h3 className="text-lg font-bold mb-2">Usare suggerimento {hintModal.order}?</h3>
              <p className="text-gray-300 text-sm mb-5">
                Questo suggerimento costerà{' '}
                <span className="text-yellow-400 font-bold">{hintModal.pointsCost} punti</span>{' '}
                al punteggio del vostro team.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setHintModal(null)}
                  disabled={usingHint}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={() => handleUseHint(hintModal)}
                  disabled={usingHint}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg transition-colors font-semibold"
                >
                  {usingHint ? 'Caricamento...' : 'Conferma'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Caricamento…</div>}>
      <PlayPageInner />
    </Suspense>
  );
}
