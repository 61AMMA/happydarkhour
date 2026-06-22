'use client';

import { AnswerType, ANSWER_TYPE_LABELS } from '@/lib/creator-types';

const TYPE_DESCRIPTIONS: Record<AnswerType, string> = {
  text_single: 'Una risposta testuale esatta (con varianti)',
  number_single: 'Un numero esatto',
  multi_text_ordered: 'Più risposte in ordine specifico',
  multi_group_ordered_numbers: 'Gruppi di numeri in ordine',
  ordered_sequence_letters: 'Lettere in sequenza ordinata',
  list_text_with_empty_allowed: 'Lista di campi, alcuni possono essere vuoti',
  multi_number_unordered: 'Più numeri, ordine libero',
  structured_choice_with_reason: 'Scelta con frase e motivazione',
};

const ALL_TYPES: AnswerType[] = [
  'text_single',
  'number_single',
  'multi_text_ordered',
  'multi_group_ordered_numbers',
  'ordered_sequence_letters',
  'list_text_with_empty_allowed',
  'multi_number_unordered',
  'structured_choice_with_reason',
];

interface Props {
  value: AnswerType;
  onChange: (t: AnswerType) => void;
  disabled?: boolean;
}

export default function AnswerTypeSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ALL_TYPES.map((t) => {
        const selected = t === value;
        return (
          <button
            key={t}
            type="button"
            onClick={() => !disabled && onChange(t)}
            disabled={disabled}
            className={[
              'text-left p-3 rounded border transition-colors',
              selected
                ? 'border-[#CC0000] bg-[#CC0000]/10 text-[#F5F5F5]'
                : 'border-[#333] bg-[#1A1A1A] text-[#AAAAAA] hover:border-[#555]',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            <div className="font-semibold text-sm mb-0.5">
              {ANSWER_TYPE_LABELS[t]}
            </div>
            <div className="text-xs opacity-70">{TYPE_DESCRIPTIONS[t]}</div>
          </button>
        );
      })}
    </div>
  );
}
