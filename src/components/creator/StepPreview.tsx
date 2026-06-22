'use client';

import { AnswerType, ANSWER_TYPE_LABELS, AnswerFormEntry } from '@/lib/creator-types';

interface PreviewProps {
  title: string;
  description: string;
  answerType: AnswerType;
  answers: AnswerFormEntry[];
  stepNumber: number;
}

function AnswerSummary({ answerType, answers }: { answerType: AnswerType; answers: AnswerFormEntry[] }) {
  if (answers.length === 0) {
    return <p className="text-[#888] text-xs italic">Nessuna risposta configurata</p>;
  }

  switch (answerType) {
    case 'text_single':
    case 'number_single': {
      const a = answers[0];
      const variants = a?.answer?.split('|').filter(Boolean) ?? [];
      return (
        <div>
          <div className="text-xs text-[#AAAAAA] mb-1">Risposta accettata:</div>
          <div className="flex flex-wrap gap-1">
            {variants.map((v, i) => (
              <span key={i} className="bg-[#222] border border-[#444] rounded px-2 py-0.5 text-xs text-[#F5F5F5]">
                {v}
              </span>
            ))}
          </div>
          {a?.points > 0 && (
            <div className="text-xs text-[#AAAAAA] mt-1">+{a.points} pt</div>
          )}
        </div>
      );
    }
    case 'multi_text_ordered':
    case 'ordered_sequence_letters': {
      const sorted = [...answers].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      return (
        <div>
          <div className="text-xs text-[#AAAAAA] mb-1">Sequenza:</div>
          <ol className="list-decimal list-inside space-y-0.5">
            {sorted.map((a, i) => (
              <li key={i} className="text-xs text-[#F5F5F5]">
                {a.answer || <em className="text-[#888]">vuoto</em>}
                <span className="text-[#888] ml-1">(+{a.points}pt)</span>
              </li>
            ))}
          </ol>
        </div>
      );
    }
    case 'multi_group_ordered_numbers': {
      const groups = Array.from(new Set(answers.map((a) => a.groupLabel ?? 'A')));
      return (
        <div className="space-y-2">
          {groups.map((g) => {
            const items = answers.filter((a) => a.groupLabel === g).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
            return (
              <div key={g}>
                <div className="text-xs font-bold text-[#CC0000]">Gruppo {g}</div>
                <div className="text-xs text-[#F5F5F5]">{items.map((a) => a.answer).join(', ')}</div>
              </div>
            );
          })}
        </div>
      );
    }
    case 'list_text_with_empty_allowed': {
      const sorted = [...answers].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      return (
        <div className="space-y-1">
          {sorted.map((a, i) => (
            <div key={i} className="flex gap-2 items-center text-xs">
              <span className="text-[#AAAAAA] w-28 truncate">{a.fieldLabel ?? `Campo ${i + 1}`}:</span>
              <span className="text-[#F5F5F5]">
                {a.emptyAllowed ? <em className="text-[#888]">qualsiasi</em> : a.answer || <em className="text-[#888]">—</em>}
              </span>
            </div>
          ))}
        </div>
      );
    }
    case 'multi_number_unordered': {
      const nums = answers.map((a) => a.answer).filter(Boolean);
      return (
        <div>
          <div className="text-xs text-[#AAAAAA] mb-1">Numeri validi (ordine libero):</div>
          <div className="flex flex-wrap gap-1">
            {nums.map((n, i) => (
              <span key={i} className="bg-[#222] border border-[#444] rounded px-2 py-0.5 text-xs text-[#F5F5F5]">{n}</span>
            ))}
          </div>
        </div>
      );
    }
    case 'structured_choice_with_reason': {
      const scelta = answers.find((a) => a.fieldLabel === 'scelta');
      const frase = answers.find((a) => a.fieldLabel === 'frase');
      const mot = answers.find((a) => a.fieldLabel === 'motivazione');
      return (
        <div className="space-y-1 text-xs">
          {scelta?.answer && <div><span className="text-[#AAAAAA]">Scelta:</span> <span className="text-[#F5F5F5]">{scelta.answer}</span></div>}
          {frase?.answer && <div><span className="text-[#AAAAAA]">Frase:</span> <span className="text-[#F5F5F5]">{frase.answer}</span></div>}
          {mot?.motivationKeywords && (
            <div><span className="text-[#AAAAAA]">Keyword motiv.:</span>{' '}
              <span className="text-[#F5F5F5]">{mot.motivationKeywords.split('|').join(', ')}</span>
            </div>
          )}
        </div>
      );
    }
    default:
      return null;
  }
}

export default function StepPreview({ title, description, answerType, answers, stepNumber }: PreviewProps) {
  return (
    <div className="bg-[#111] border border-[#2A2A2A] rounded-lg overflow-hidden">
      {/* Header simula la UI /play */}
      <div className="bg-[#0D0D0D] border-b border-[#2A2A2A] px-4 py-2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#CC0000]" />
        <span className="text-xs text-[#888]">Anteprima Step {stepNumber} — come appare in /play</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Titolo step */}
        <div>
          <div className="text-xs text-[#888] uppercase tracking-widest mb-1">Step {stepNumber}</div>
          <h2 className="text-lg font-bold text-[#F5F5F5]">
            {title || <span className="text-[#555] italic">Titolo non impostato</span>}
          </h2>
        </div>

        {/* Narrativa/descrizione */}
        {description ? (
          <p className="text-[#AAAAAA] text-sm leading-relaxed whitespace-pre-wrap">{description}</p>
        ) : (
          <p className="text-[#555] text-sm italic">Nessuna narrativa</p>
        )}

        {/* Tipo risposta badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#888]">Tipo:</span>
          <span className="bg-[#CC0000]/20 text-[#CC0000] text-xs rounded px-2 py-0.5">
            {ANSWER_TYPE_LABELS[answerType]}
          </span>
        </div>

        {/* Riepilogo risposte */}
        <div className="border-t border-[#2A2A2A] pt-3">
          <div className="text-xs text-[#888] uppercase tracking-widest mb-2">Risposte valide</div>
          <AnswerSummary answerType={answerType} answers={answers} />
        </div>
      </div>
    </div>
  );
}
