'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  AnswerType,
  AnswerFormEntry,
  HintFormEntry,
  StepDetail,
} from '@/lib/creator-types';
import AnswerTypeSelector from './AnswerTypeSelector';
import DynamicAnswerForm from './DynamicAnswerForm';
import StepPreview from './StepPreview';
import HintPanel from './HintPanel';
import MediaPanel from './MediaPanel';

interface Props {
  storyId: string;
  stepId: string;
}

interface StepMeta {
  stepNumber: number;
  title: string;
  description: string;
  question: string;
  answerType: AnswerType;
  inputCount: number | null;
  inputConfig: string | null;
  isActive: boolean;
}

function toFormEntries(
  raw: StepDetail['answers']
): AnswerFormEntry[] {
  return raw.map((a) => ({
    id: a.id,
    answer: a.answer,
    points: a.points,
    position: a.position,
    groupLabel: a.groupLabel,
    fieldLabel: a.fieldLabel,
    emptyAllowed: a.emptyAllowed,
    motivationKeywords: a.motivationKeywords,
  }));
}

function toHintEntries(raw: StepDetail['hints']): HintFormEntry[] {
  return raw.map((h) => ({
    id: h.id,
    order: h.order,
    type: h.type as HintFormEntry['type'],
    contentText: h.contentText,
    contentUrl: h.contentUrl,
    pointsCost: h.pointsCost,
    triggerMinutesAfterFirstClear: h.triggerMinutesAfterFirstClear,
  }));
}

const inputCls =
  'bg-[#111] border border-[#333] text-[#F5F5F5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#CC0000] w-full';

export default function StepEditor({ storyId, stepId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [meta, setMeta] = useState<StepMeta>({
    stepNumber: 1,
    title: '',
    description: '',
    question: '',
    answerType: 'text_single',
    inputCount: null,
    inputConfig: null,
    isActive: true,
  });
  const [answers, setAnswers] = useState<AnswerFormEntry[]>([]);
  const [hints, setHints] = useState<HintFormEntry[]>([]);

  // ----------------------------------------------------------------
  // Load step
  // ----------------------------------------------------------------
  useEffect(() => {
    setLoading(true);
    fetch(`/api/steps/${stepId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Errore ${r.status}`);
        return r.json() as Promise<StepDetail>;
      })
      .then((data) => {
        setMeta({
          stepNumber: data.stepNumber,
          title: data.title,
          description: data.description ?? '',
          question: data.question ?? '',
          answerType: (data.answerType as AnswerType) ?? 'text_single',
          inputCount: data.inputCount,
          inputConfig: data.inputConfig,
          isActive: data.isActive,
        });
        setAnswers(toFormEntries(data.answers));
        setHints(toHintEntries(data.hints));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [stepId]);

  // ----------------------------------------------------------------
  // Validate
  // ----------------------------------------------------------------
  const validate = useCallback((): string | null => {
    if (!meta.title.trim()) return 'Il titolo è obbligatorio';
    if (answers.length === 0) return 'Aggiungi almeno una risposta';

    switch (meta.answerType) {
      case 'text_single':
      case 'number_single':
        if (!answers[0]?.answer?.trim()) return 'La risposta è obbligatoria';
        break;
      case 'multi_text_ordered':
      case 'ordered_sequence_letters':
      case 'multi_number_unordered':
        if (answers.some((a) => !a.answer?.trim())) return 'Tutte le risposte devono avere un valore';
        break;
      case 'multi_group_ordered_numbers': {
        const groups = new Set(answers.map((a) => a.groupLabel));
        if (groups.size === 0) return 'Aggiungi almeno un gruppo';
        if (answers.some((a) => !a.answer?.trim())) return 'Tutti i numeri devono avere un valore';
        break;
      }
      case 'list_text_with_empty_allowed':
        if (answers.some((a) => !a.emptyAllowed && !a.answer?.trim()))
          return 'I campi non marcati "vuoto OK" devono avere un valore';
        break;
      case 'structured_choice_with_reason': {
        const scelta = answers.find((a) => a.fieldLabel === 'scelta');
        if (!scelta?.answer?.trim()) return 'Il campo "scelta" è obbligatorio';
        break;
      }
    }
    return null;
  }, [meta, answers]);

  // ----------------------------------------------------------------
  // Save meta + answers
  // ----------------------------------------------------------------
  const handleSave = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      setSaveError(validationError);
      return;
    }
    setSaveError(null);
    setSaving(true);
    setSaved(false);

    try {
      // 1. PUT step metadata
      const metaRes = await fetch(`/api/steps/${stepId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: meta.title.trim(),
          description: meta.description.trim(),
          question: meta.question.trim(),
          answerType: meta.answerType,
          inputCount: meta.inputCount,
          inputConfig: meta.inputConfig,
          isActive: meta.isActive,
        }),
      });
      if (!metaRes.ok) {
        const e = (await metaRes.json()) as { error?: string };
        throw new Error(e.error ?? `Errore ${metaRes.status}`);
      }

      // 2. POST answers (replace-all)
      const answersRes = await fetch(`/api/steps/${stepId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          answers.map((a) => ({
            answer: a.answer,
            points: a.points,
            position: a.position,
            groupLabel: a.groupLabel,
            fieldLabel: a.fieldLabel,
            emptyAllowed: a.emptyAllowed,
            motivationKeywords: a.motivationKeywords,
          }))
        ),
      });
      if (!answersRes.ok) {
        const e = (await answersRes.json()) as { error?: string };
        throw new Error(e.error ?? `Errore risposte ${answersRes.status}`);
      }

      const savedAnswers = (await answersRes.json()) as { answers: StepDetail['answers'] };
      setAnswers(toFormEntries(savedAnswers.answers));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  }, [stepId, meta, answers, validate]);

  // ----------------------------------------------------------------
  // Hint persistence
  // ----------------------------------------------------------------
  const onSaveHint = useCallback(
    async (hint: HintFormEntry): Promise<HintFormEntry> => {
      if (hint.id) {
        // PUT existing
        const res = await fetch(`/api/hints/${hint.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: hint.type,
            contentText: hint.contentText,
            contentUrl: hint.contentUrl,
            pointsCost: hint.pointsCost,
            triggerMinutesAfterFirstClear: hint.triggerMinutesAfterFirstClear,
            order: hint.order,
          }),
        });
        if (!res.ok) {
          const e = (await res.json()) as { error?: string };
          throw new Error(e.error ?? 'Errore aggiornamento hint');
        }
        return { ...hint, ...(await res.json() as object) } as HintFormEntry;
      } else {
        // POST new
        const res = await fetch(`/api/steps/${stepId}/hints`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: hint.type,
            contentText: hint.contentText,
            contentUrl: hint.contentUrl,
            pointsCost: hint.pointsCost,
            triggerMinutesAfterFirstClear: hint.triggerMinutesAfterFirstClear,
            order: hint.order,
          }),
        });
        if (!res.ok) {
          const e = (await res.json()) as { error?: string };
          throw new Error(e.error ?? 'Errore creazione hint');
        }
        const created = await res.json() as { id: string; order: number; type: string; contentText: string | null; contentUrl: string | null; pointsCost: number; triggerMinutesAfterFirstClear: number };
        return {
          id: created.id,
          order: created.order,
          type: created.type as HintFormEntry['type'],
          contentText: created.contentText,
          contentUrl: created.contentUrl,
          pointsCost: created.pointsCost,
          triggerMinutesAfterFirstClear: created.triggerMinutesAfterFirstClear,
        };
      }
    },
    [stepId]
  );

  const onDeleteHint = useCallback(async (hint: HintFormEntry) => {
    if (!hint.id) return;
    const res = await fetch(`/api/hints/${hint.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const e = (await res.json()) as { error?: string };
      throw new Error(e.error ?? 'Errore eliminazione hint');
    }
  }, []);

  // ----------------------------------------------------------------
  // Render states
  // ----------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-[#888] text-sm animate-pulse">Caricamento step...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-[#CC0000] font-semibold">Errore nel caricamento</div>
          <div className="text-[#888] text-sm">{error}</div>
          <Link
            href={`/creator/stories/${storyId}`}
            className="text-xs text-[#CC0000] hover:underline"
          >
            ← Torna alla storia
          </Link>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // Main render
  // ----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F5F5F5]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-[#0D0D0D] border-b border-[#2A2A2A] px-6 py-3 flex items-center gap-4">
        <Link
          href={`/creator/stories/${storyId}`}
          className="text-sm text-[#888] hover:text-[#F5F5F5] transition-colors"
        >
          ← Storia
        </Link>
        <span className="text-[#333]">/</span>
        <span className="text-sm text-[#AAAAAA]">
          Step {meta.stepNumber}
        </span>
        <div className="flex-1" />

        {saveError && (
          <span className="text-sm text-[#FF6666]">{saveError}</span>
        )}
        {saved && (
          <span className="text-sm text-green-400">✓ Salvato</span>
        )}

        {/* Toggle attivo */}
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-xs text-[#888]">Attivo</span>
          <div
            onClick={() => setMeta((m) => ({ ...m, isActive: !m.isActive }))}
            className={[
              'w-10 h-5 rounded-full relative transition-colors cursor-pointer',
              meta.isActive ? 'bg-[#CC0000]' : 'bg-[#333]',
            ].join(' ')}
          >
            <div
              className={[
                'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                meta.isActive ? 'translate-x-5' : 'translate-x-0.5',
              ].join(' ')}
            />
          </div>
        </label>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-[#CC0000] text-white text-sm px-5 py-2 rounded hover:bg-[#AA0000] disabled:opacity-50 transition-colors font-semibold"
        >
          {saving ? 'Salvataggio...' : 'Salva step'}
        </button>
      </div>

      {/* Main content — two columns */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* LEFT: Form */}
        <div className="space-y-6">
          {/* Titolo */}
          <section className="bg-[#111] border border-[#2A2A2A] rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-widest">
              Metadata Step
            </h2>
            <div>
              <label className="text-xs text-[#888] mb-1 block">Titolo *</label>
              <input
                type="text"
                className={inputCls}
                value={meta.title}
                placeholder="Titolo dello step..."
                onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-[#888] mb-1 block">
                Narrativa / Ambientazione
                <span className="ml-2 text-[#555]">(il testo che i giocatori leggono)</span>
              </label>
              <textarea
                className={inputCls + ' resize-y min-h-[100px]'}
                value={meta.description}
                placeholder="Descrivi l'atmosfera, il contesto... mai la domanda diretta."
                onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-[#888] mb-1 block">
                Domanda interna
                <span className="ml-2 text-[#555]">(solo per operatore, non mostrata)</span>
              </label>
              <input
                type="text"
                className={inputCls}
                value={meta.question}
                placeholder="Qual è la risposta corretta..."
                onChange={(e) => setMeta((m) => ({ ...m, question: e.target.value }))}
              />
            </div>
          </section>

          {/* Tipo risposta */}
          <section className="bg-[#111] border border-[#2A2A2A] rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-widest">
              Tipo di risposta
            </h2>
            <AnswerTypeSelector
              value={meta.answerType}
              onChange={(t) => {
                setMeta((m) => ({ ...m, answerType: t }));
                setAnswers([]); // reset answers on type change
              }}
            />
          </section>

          {/* Risposte corrette */}
          <section className="bg-[#111] border border-[#2A2A2A] rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-widest">
              Risposte corrette
            </h2>
            <DynamicAnswerForm
              answerType={meta.answerType}
              answers={answers}
              onChange={setAnswers}
              inputConfig={meta.inputConfig}
              onInputConfigChange={(cfg) => setMeta((m) => ({ ...m, inputConfig: cfg }))}
            />
          </section>

          {/* Media allegati (KAN-28) */}
          <section className="bg-[#111] border border-[#2A2A2A] rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#F5F5F5] uppercase tracking-widest">
              Media allegati
            </h2>
            <p className="text-xs text-[#555]">
              Immagini, PDF, audio o video mostrati al giocatore prima della risposta.
            </p>
            <MediaPanel stepId={stepId} />
          </section>

          {/* Hint (KAN-26) */}
          <section className="bg-[#111] border border-[#2A2A2A] rounded-lg p-5">
            <HintPanel
              stepId={stepId}
              hints={hints}
              onChange={setHints}
              onSaveHint={onSaveHint}
              onDeleteHint={onDeleteHint}
            />
          </section>
        </div>

        {/* RIGHT: Preview */}
        <div className="xl:sticky xl:top-20 xl:self-start space-y-4">
          <StepPreview
            title={meta.title}
            description={meta.description}
            answerType={meta.answerType}
            answers={answers}
            stepNumber={meta.stepNumber}
          />

          {/* Info tipo risposta */}
          <div className="bg-[#111] border border-[#2A2A2A] rounded-lg p-4">
            <div className="text-xs text-[#888] uppercase tracking-widest mb-2">Note tecniche</div>
            <div className="text-xs text-[#666] space-y-1">
              <p>• Le varianti di risposta si separano con <code className="text-[#AAAAAA]">|</code></p>
              <p>• La comparazione è case-insensitive e ignora spazi extra</p>
              <p>• Gli hint si sbloccano solo dopo il trigger configurato</p>
              <p>• Il flag &ldquo;Attivo&rdquo; controlla se lo step appare in /play</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
