'use client';

import { useState, useCallback } from 'react';
import { HintFormEntry, HintType } from '@/lib/creator-types';
import HintCard from './HintCard';

interface Props {
  stepId: string;
  hints: HintFormEntry[];
  onChange: (hints: HintFormEntry[]) => void;
  onSaveHint: (hint: HintFormEntry) => Promise<HintFormEntry>;
  onDeleteHint: (hint: HintFormEntry) => Promise<void>;
  disabled?: boolean;
}

function newHint(order: number): HintFormEntry {
  return {
    order,
    type: 'TEXT',
    contentText: null,
    contentUrl: null,
    pointsCost: 50,
    triggerMinutesAfterFirstClear: 5,
  };
}

export default function HintPanel({
  stepId,
  hints,
  onChange,
  onSaveHint,
  onDeleteHint,
  disabled,
}: Props) {
  const [saving, setSaving] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const addHint = () => {
    const next = [...hints, newHint(hints.length + 1)];
    onChange(next);
  };

  const updateHint = (i: number, updated: HintFormEntry) => {
    onChange(hints.map((h, idx) => (idx === i ? updated : h)));
  };

  const saveHint = useCallback(
    async (i: number) => {
      const hint = hints[i];
      if (!hint) return;
      // Validate
      if (hint.type === 'TEXT' && !hint.contentText?.trim()) {
        setError(`Hint #${i + 1}: il testo è obbligatorio per hint di tipo TEXT`);
        return;
      }
      if (hint.type !== 'TEXT' && !hint.contentUrl?.trim()) {
        setError(`Hint #${i + 1}: il file è obbligatorio per hint di tipo ${hint.type}`);
        return;
      }
      setError(null);
      setSaving((s) => new Set(s).add(i));
      try {
        const saved = await onSaveHint(hint);
        onChange(hints.map((h, idx) => (idx === i ? saved : h)));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Errore nel salvataggio hint');
      } finally {
        setSaving((s) => {
          const next = new Set(s);
          next.delete(i);
          return next;
        });
      }
    },
    [hints, onSaveHint, onChange]
  );

  const deleteHint = useCallback(
    async (i: number) => {
      const hint = hints[i];
      if (!hint) return;
      // Se non ha id, è solo locale — rimuovi senza chiamata API
      if (!hint.id) {
        onChange(hints.filter((_, idx) => idx !== i).map((h, idx) => ({ ...h, order: idx + 1 })));
        return;
      }
      try {
        await onDeleteHint(hint);
        onChange(hints.filter((_, idx) => idx !== i).map((h, idx) => ({ ...h, order: idx + 1 })));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Errore nella cancellazione hint');
      }
    },
    [hints, onDeleteHint, onChange]
  );

  // Drag-and-drop reorder (semplice: swap su drop)
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleDragStart = (i: number) => setDragIdx(i);
  const handleDrop = (i: number) => {
    if (dragIdx === null || dragIdx === i) return;
    const next = [...hints];
    const [removed] = next.splice(dragIdx, 1);
    next.splice(i, 0, removed);
    onChange(next.map((h, idx) => ({ ...h, order: idx + 1 })));
    setDragIdx(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#F5F5F5]">
          Hint ({hints.length})
        </h3>
        <button
          type="button"
          onClick={addHint}
          disabled={disabled}
          className="text-xs bg-[#CC0000] text-white px-3 py-1 rounded hover:bg-[#AA0000] disabled:opacity-50"
        >
          + Aggiungi hint
        </button>
      </div>

      {error && (
        <div className="bg-[#CC0000]/10 border border-[#CC0000]/40 rounded px-3 py-2 text-sm text-[#FF6666]">
          {error}
        </div>
      )}

      {hints.length === 0 && (
        <p className="text-sm text-[#555] italic">
          Nessun hint configurato. Gli hint vengono sbloccati automaticamente in base al trigger.
        </p>
      )}

      <div className="space-y-2">
        {hints.map((hint, i) => (
          <div
            key={hint.id ?? `new-${i}`}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className={dragIdx === i ? 'opacity-40' : ''}
          >
            <HintCard
              hint={hint}
              index={i}
              stepId={stepId}
              onChange={(updated) => updateHint(i, updated)}
              onDelete={() => deleteHint(i)}
              disabled={disabled || saving.has(i)}
            />
            {/* Pulsante salva per ogni hint (solo se modified) */}
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={() => saveHint(i)}
                disabled={disabled || saving.has(i)}
                className="text-xs text-[#CC0000] hover:underline disabled:opacity-30"
              >
                {saving.has(i) ? 'Salvo...' : hint.id ? 'Aggiorna hint' : 'Salva hint →'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
