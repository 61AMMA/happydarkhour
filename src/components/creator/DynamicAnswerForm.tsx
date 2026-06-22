'use client';

import { useState } from 'react';
import { AnswerType, AnswerFormEntry } from '@/lib/creator-types';

interface Props {
  answerType: AnswerType;
  answers: AnswerFormEntry[];
  onChange: (answers: AnswerFormEntry[]) => void;
  disabled?: boolean;
  inputConfig?: string | null;
  onInputConfigChange?: (config: string) => void;
}

function emptyAnswer(overrides: Partial<AnswerFormEntry> = {}): AnswerFormEntry {
  return {
    answer: '',
    points: 10,
    position: null,
    groupLabel: null,
    fieldLabel: null,
    emptyAllowed: false,
    motivationKeywords: null,
    ...overrides,
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-[#AAAAAA]">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'bg-[#1A1A1A] border border-[#333] text-[#F5F5F5] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#CC0000]';

// ----------------------------------------------------------------
// text_single / number_single
// ----------------------------------------------------------------
function SingleAnswerForm({
  answers,
  onChange,
  disabled,
  isNumber,
}: {
  answers: AnswerFormEntry[];
  onChange: (a: AnswerFormEntry[]) => void;
  disabled?: boolean;
  isNumber?: boolean;
}) {
  const current = answers[0] ?? emptyAnswer({ points: 10 });
  const update = (patch: Partial<AnswerFormEntry>) => {
    onChange([{ ...current, ...patch }]);
  };
  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1">
        <Field label={isNumber ? 'Numero corretto' : 'Risposta corretta (varianti separate da |)'}>
          <input
            type={isNumber ? 'number' : 'text'}
            className={inputCls}
            value={current.answer}
            disabled={disabled}
            onChange={(e) => update({ answer: e.target.value })}
            placeholder={isNumber ? 'Es. 42' : 'Es. risposta1|variante2'}
          />
        </Field>
      </div>
      <div className="w-24">
        <Field label="Punti">
          <input
            type="number"
            className={inputCls}
            value={current.points}
            disabled={disabled}
            onChange={(e) => update({ points: parseInt(e.target.value) || 0 })}
          />
        </Field>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// multi_text_ordered
// ----------------------------------------------------------------
function MultiTextOrdered({
  answers,
  onChange,
  disabled,
}: {
  answers: AnswerFormEntry[];
  onChange: (a: AnswerFormEntry[]) => void;
  disabled?: boolean;
}) {
  const add = () => {
    onChange([...answers, emptyAnswer({ position: answers.length + 1 })]);
  };
  const remove = (i: number) => {
    const next = answers.filter((_, idx) => idx !== i).map((a, idx) => ({ ...a, position: idx + 1 }));
    onChange(next);
  };
  const update = (i: number, patch: Partial<AnswerFormEntry>) => {
    onChange(answers.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  };

  return (
    <div className="flex flex-col gap-2">
      {answers.map((a, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="w-6 text-center text-xs text-[#CC0000] font-bold">{i + 1}</span>
          <input
            type="text"
            className={inputCls + ' flex-1'}
            value={a.answer}
            disabled={disabled}
            placeholder="Risposta..."
            onChange={(e) => update(i, { answer: e.target.value })}
          />
          <input
            type="number"
            className={inputCls + ' w-20'}
            value={a.points}
            disabled={disabled}
            onChange={(e) => update(i, { points: parseInt(e.target.value) || 0 })}
            title="Punti"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={disabled}
            className="text-[#CC0000] text-lg leading-none px-1 hover:opacity-70 disabled:opacity-30"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={disabled}
        className="text-sm text-[#CC0000] hover:underline disabled:opacity-30 text-left"
      >
        + Aggiungi risposta
      </button>
    </div>
  );
}

// ----------------------------------------------------------------
// multi_group_ordered_numbers
// ----------------------------------------------------------------
function MultiGroupOrderedNumbers({
  answers,
  onChange,
  disabled,
}: {
  answers: AnswerFormEntry[];
  onChange: (a: AnswerFormEntry[]) => void;
  disabled?: boolean;
}) {
  const groups = Array.from(new Set(answers.map((a) => a.groupLabel ?? 'A')));

  const addGroup = () => {
    const label = String.fromCharCode(65 + groups.length); // A, B, C...
    onChange([...answers, emptyAnswer({ groupLabel: label, position: 1 })]);
  };

  const addToGroup = (groupLabel: string) => {
    const groupItems = answers.filter((a) => a.groupLabel === groupLabel);
    onChange([...answers, emptyAnswer({ groupLabel, position: groupItems.length + 1 })]);
  };

  const removeAnswer = (i: number) => {
    const a = answers[i];
    const gl = a.groupLabel;
    const next = answers.filter((_, idx) => idx !== i).map((item) =>
      item.groupLabel === gl ? { ...item, position: answers.filter((_, j) => j < i && answers[j].groupLabel === gl).length } : item
    );
    // Recalculate positions per group
    const byGroup: Record<string, AnswerFormEntry[]> = {};
    next.forEach((item) => {
      const k = item.groupLabel ?? 'A';
      if (!byGroup[k]) byGroup[k] = [];
      byGroup[k].push(item);
    });
    const result: AnswerFormEntry[] = [];
    Object.keys(byGroup).sort().forEach((k) => {
      byGroup[k].forEach((item, pos) => result.push({ ...item, position: pos + 1 }));
    });
    onChange(result);
  };

  const updateAnswer = (i: number, patch: Partial<AnswerFormEntry>) => {
    onChange(answers.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  };

  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => {
        const items = answers.filter((a) => a.groupLabel === g);
        return (
          <div key={g} className="border border-[#333] rounded p-3">
            <div className="text-xs font-bold text-[#CC0000] mb-2">Gruppo {g}</div>
            {items.map((item, pos) => {
              const globalIdx = answers.findIndex(
                (a) => a.groupLabel === g && a.position === item.position
              );
              return (
                <div key={pos} className="flex gap-2 items-center mb-2">
                  <span className="w-5 text-center text-xs text-[#888]">{pos + 1}</span>
                  <input
                    type="number"
                    className={inputCls + ' flex-1'}
                    value={item.answer}
                    disabled={disabled}
                    placeholder="Numero..."
                    onChange={(e) => updateAnswer(globalIdx, { answer: e.target.value })}
                  />
                  <input
                    type="number"
                    className={inputCls + ' w-20'}
                    value={item.points}
                    disabled={disabled}
                    onChange={(e) => updateAnswer(globalIdx, { points: parseInt(e.target.value) || 0 })}
                    title="Punti"
                  />
                  <button
                    type="button"
                    onClick={() => removeAnswer(globalIdx)}
                    disabled={disabled}
                    className="text-[#CC0000] text-lg leading-none px-1 hover:opacity-70 disabled:opacity-30"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => addToGroup(g)}
              disabled={disabled}
              className="text-xs text-[#CC0000] hover:underline disabled:opacity-30"
            >
              + Aggiungi numero al gruppo {g}
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={addGroup}
        disabled={disabled}
        className="text-sm text-[#CC0000] hover:underline disabled:opacity-30 text-left"
      >
        + Aggiungi gruppo
      </button>
    </div>
  );
}

// ----------------------------------------------------------------
// ordered_sequence_letters
// ----------------------------------------------------------------
function OrderedSequenceLetters({
  answers,
  onChange,
  disabled,
}: {
  answers: AnswerFormEntry[];
  onChange: (a: AnswerFormEntry[]) => void;
  disabled?: boolean;
}) {
  const add = () => {
    onChange([...answers, emptyAnswer({ position: answers.length + 1 })]);
  };
  const remove = (i: number) => {
    onChange(answers.filter((_, idx) => idx !== i).map((a, idx) => ({ ...a, position: idx + 1 })));
  };
  const update = (i: number, patch: Partial<AnswerFormEntry>) => {
    onChange(answers.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  };

  return (
    <div className="flex flex-col gap-2">
      {answers.map((a, i) => (
        <div key={i} className="flex gap-2 items-center">
          <span className="w-6 text-center text-xs text-[#CC0000] font-bold">{i + 1}</span>
          <input
            type="text"
            maxLength={1}
            className={inputCls + ' w-12 uppercase text-center'}
            value={a.answer}
            disabled={disabled}
            placeholder="A"
            onChange={(e) => update(i, { answer: e.target.value.toUpperCase() })}
          />
          <input
            type="number"
            className={inputCls + ' w-20'}
            value={a.points}
            disabled={disabled}
            onChange={(e) => update(i, { points: parseInt(e.target.value) || 0 })}
            title="Punti"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={disabled}
            className="text-[#CC0000] text-lg leading-none px-1 hover:opacity-70 disabled:opacity-30"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={disabled}
        className="text-sm text-[#CC0000] hover:underline disabled:opacity-30 text-left"
      >
        + Aggiungi lettera
      </button>
    </div>
  );
}

// ----------------------------------------------------------------
// list_text_with_empty_allowed
// ----------------------------------------------------------------
function ListTextWithEmptyAllowed({
  answers,
  onChange,
  disabled,
  inputConfig,
  onInputConfigChange,
}: {
  answers: AnswerFormEntry[];
  onChange: (a: AnswerFormEntry[]) => void;
  disabled?: boolean;
  inputConfig?: string | null;
  onInputConfigChange?: (config: string) => void;
}) {
  const cfg = (() => { try { return inputConfig ? JSON.parse(inputConfig) : {}; } catch { return {}; } })();
  const setConfigField = (key: string, value: string) => {
    onInputConfigChange?.(JSON.stringify({ ...cfg, [key]: value }));
  };
  const add = () => {
    onChange([...answers, emptyAnswer({ fieldLabel: `Campo ${answers.length + 1}`, position: answers.length + 1 })]);
  };
  const remove = (i: number) => {
    onChange(answers.filter((_, idx) => idx !== i).map((a, idx) => ({ ...a, position: idx + 1 })));
  };
  const update = (i: number, patch: Partial<AnswerFormEntry>) => {
    onChange(answers.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Intestazioni colonne configurabili */}
      <div className="flex gap-2 items-center text-xs text-[#AAAAAA]">
        <span className="w-28 shrink-0">Intestazione colonne:</span>
        <input
          type="text"
          className={inputCls + ' w-32'}
          value={cfg.columnLabel ?? ''}
          disabled={disabled}
          placeholder="Nome (es. Luogo)"
          title="Intestazione colonna sinistra"
          onChange={(e) => setConfigField('columnLabel', e.target.value)}
        />
        <input
          type="text"
          className={inputCls + ' w-40'}
          value={cfg.columnValue ?? ''}
          disabled={disabled}
          placeholder="Valore (es. PUNTO +)"
          title="Intestazione colonna destra"
          onChange={(e) => setConfigField('columnValue', e.target.value)}
        />
      </div>
      <div className="border-t border-[#333] pt-2 flex flex-col gap-2">
      {answers.map((a, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="text"
            className={inputCls + ' w-32'}
            value={a.fieldLabel ?? ''}
            disabled={disabled}
            placeholder="Label campo"
            onChange={(e) => update(i, { fieldLabel: e.target.value })}
          />
          <input
            type="text"
            className={inputCls + ' flex-1'}
            value={a.answer}
            disabled={disabled || a.emptyAllowed}
            placeholder={a.emptyAllowed ? '(vuoto ammesso)' : 'Risposta...'}
            onChange={(e) => update(i, { answer: e.target.value })}
          />
          <label className="flex items-center gap-1 text-xs text-[#AAAAAA] cursor-pointer">
            <input
              type="checkbox"
              checked={a.emptyAllowed}
              disabled={disabled}
              onChange={(e) => update(i, { emptyAllowed: e.target.checked, answer: e.target.checked ? '' : a.answer })}
              className="accent-[#CC0000]"
            />
            Vuoto OK
          </label>
          <input
            type="number"
            className={inputCls + ' w-20'}
            value={a.points}
            disabled={disabled}
            onChange={(e) => update(i, { points: parseInt(e.target.value) || 0 })}
            title="Punti"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={disabled}
            className="text-[#CC0000] text-lg leading-none px-1 hover:opacity-70 disabled:opacity-30"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={disabled}
        className="text-sm text-[#CC0000] hover:underline disabled:opacity-30 text-left"
      >
        + Aggiungi campo
      </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// multi_number_unordered
// ----------------------------------------------------------------
function MultiNumberUnordered({
  answers,
  onChange,
  disabled,
}: {
  answers: AnswerFormEntry[];
  onChange: (a: AnswerFormEntry[]) => void;
  disabled?: boolean;
}) {
  const add = () => onChange([...answers, emptyAnswer()]);
  const remove = (i: number) => onChange(answers.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<AnswerFormEntry>) => {
    onChange(answers.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  };

  return (
    <div className="flex flex-col gap-2">
      {answers.map((a, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input
            type="number"
            className={inputCls + ' flex-1'}
            value={a.answer}
            disabled={disabled}
            placeholder="Numero..."
            onChange={(e) => update(i, { answer: e.target.value })}
          />
          <input
            type="number"
            className={inputCls + ' w-20'}
            value={a.points}
            disabled={disabled}
            onChange={(e) => update(i, { points: parseInt(e.target.value) || 0 })}
            title="Punti"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={disabled}
            className="text-[#CC0000] text-lg leading-none px-1 hover:opacity-70 disabled:opacity-30"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={disabled}
        className="text-sm text-[#CC0000] hover:underline disabled:opacity-30 text-left"
      >
        + Aggiungi numero
      </button>
    </div>
  );
}

// ----------------------------------------------------------------
// structured_choice_with_reason
// ----------------------------------------------------------------
function StructuredChoiceWithReason({
  answers,
  onChange,
  disabled,
}: {
  answers: AnswerFormEntry[];
  onChange: (a: AnswerFormEntry[]) => void;
  disabled?: boolean;
}) {
  const getField = (label: string) =>
    answers.find((a) => a.fieldLabel === label) ?? emptyAnswer({ fieldLabel: label });

  const updateField = (label: string, patch: Partial<AnswerFormEntry>) => {
    const exists = answers.find((a) => a.fieldLabel === label);
    if (exists) {
      onChange(answers.map((a) => (a.fieldLabel === label ? { ...a, ...patch } : a)));
    } else {
      onChange([...answers, { ...emptyAnswer({ fieldLabel: label }), ...patch }]);
    }
  };

  const scelta = getField('scelta');
  const frase = getField('frase');
  const motivazione = getField('motivazione');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Field label="Campo scelta (es: caldaia, motore, pompa...)">
            <input
              type="text"
              className={inputCls}
              value={scelta.answer}
              disabled={disabled}
              placeholder="es. caldaia"
              onChange={(e) => updateField('scelta', { answer: e.target.value })}
            />
          </Field>
        </div>
        <div className="w-24">
          <Field label="Punti scelta">
            <input
              type="number"
              className={inputCls}
              value={scelta.points}
              disabled={disabled}
              onChange={(e) => updateField('scelta', { points: parseInt(e.target.value) || 0 })}
            />
          </Field>
        </div>
      </div>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Field label="Frase corretta (varianti separate da |)">
            <input
              type="text"
              className={inputCls}
              value={frase.answer}
              disabled={disabled}
              placeholder="es. la caldaia è rotta|la caldaia ha ceduto"
              onChange={(e) => updateField('frase', { answer: e.target.value })}
            />
          </Field>
        </div>
        <div className="w-24">
          <Field label="Punti frase">
            <input
              type="number"
              className={inputCls}
              value={frase.points}
              disabled={disabled}
              onChange={(e) => updateField('frase', { points: parseInt(e.target.value) || 0 })}
            />
          </Field>
        </div>
      </div>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Field label="Keyword motivazione (pipe-separated, es: gas|perdita|pressione)">
            <input
              type="text"
              className={inputCls}
              value={motivazione.motivationKeywords ?? ''}
              disabled={disabled}
              placeholder="es. gas|perdita|tubazione"
              onChange={(e) => updateField('motivazione', { motivationKeywords: e.target.value })}
            />
          </Field>
        </div>
        <div className="w-24">
          <Field label="Punti motiv.">
            <input
              type="number"
              className={inputCls}
              value={motivazione.points}
              disabled={disabled}
              onChange={(e) => updateField('motivazione', { points: parseInt(e.target.value) || 0 })}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Root export
// ----------------------------------------------------------------
export default function DynamicAnswerForm({ answerType, answers, onChange, disabled, inputConfig, onInputConfigChange }: Props) {
  const props = { answers, onChange, disabled };
  switch (answerType) {
    case 'text_single':
      return <SingleAnswerForm {...props} />;
    case 'number_single':
      return <SingleAnswerForm {...props} isNumber />;
    case 'multi_text_ordered':
      return <MultiTextOrdered {...props} />;
    case 'multi_group_ordered_numbers':
      return <MultiGroupOrderedNumbers {...props} />;
    case 'ordered_sequence_letters':
      return <OrderedSequenceLetters {...props} />;
    case 'list_text_with_empty_allowed':
      return <ListTextWithEmptyAllowed {...props} inputConfig={inputConfig} onInputConfigChange={onInputConfigChange} />;
    case 'multi_number_unordered':
      return <MultiNumberUnordered {...props} />;
    case 'structured_choice_with_reason':
      return <StructuredChoiceWithReason {...props} />;
    default:
      return <div className="text-[#888] text-sm">Tipo non riconosciuto</div>;
  }
}
