'use client';

import { AnswerFormEntry } from '@/lib/creator-types';

/**
 * KAN-26 — Pannello varianti risposta.
 * Mostra le varianti di una risposta (separate da | ) e permette
 * di aggiungerne/rimuoverne. Usato per text_single e i campi
 * testuali di structured_choice_with_reason.
 */
interface Props {
  answer: AnswerFormEntry;
  onChange: (updated: AnswerFormEntry) => void;
  disabled?: boolean;
}

export default function AnswerVariantsPanel({ answer, onChange, disabled }: Props) {
  const variants = answer.answer
    ? answer.answer.split('|').filter((v) => v.trim() !== '')
    : [];

  const updateVariants = (next: string[]) => {
    onChange({ ...answer, answer: next.join('|') });
  };

  const addVariant = () => updateVariants([...variants, '']);

  const updateAt = (i: number, val: string) => {
    const next = [...variants];
    next[i] = val;
    updateVariants(next);
  };

  const removeAt = (i: number) => {
    updateVariants(variants.filter((_, idx) => idx !== i));
  };

  const inputCls =
    'bg-[#1A1A1A] border border-[#333] text-[#F5F5F5] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#CC0000] flex-1';

  return (
    <div className="border border-[#2A2A2A] rounded p-3 space-y-2">
      <div className="text-xs text-[#888] uppercase tracking-widest mb-1">Varianti risposta</div>
      {variants.length === 0 && (
        <p className="text-xs text-[#555] italic">Nessuna variante. Aggiungi almeno la risposta principale.</p>
      )}
      {variants.map((v, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="text-xs text-[#888] w-5">{i + 1}.</span>
          <input
            type="text"
            className={inputCls}
            value={v}
            disabled={disabled}
            placeholder="variante risposta..."
            onChange={(e) => updateAt(i, e.target.value)}
          />
          {variants.length > 1 && (
            <button
              type="button"
              onClick={() => removeAt(i)}
              disabled={disabled}
              className="text-[#CC0000] text-lg leading-none px-1 hover:opacity-70 disabled:opacity-30"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addVariant}
        disabled={disabled}
        className="text-xs text-[#CC0000] hover:underline disabled:opacity-30"
      >
        + Aggiungi variante
      </button>
      {variants.length > 1 && (
        <p className="text-xs text-[#666]">
          Salvato come: <code className="text-[#AAAAAA]">{variants.join('|')}</code>
        </p>
      )}
    </div>
  );
}
