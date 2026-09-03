'use client';

// Selettore semaforo (reale / digitale) per lo stato di una storia — Pagina Storie
import {
  SemaforoStatus,
  SEMAFORO_STATUS_VALUES,
  SEMAFORO_COLORS,
  REAL_STATUS_LABELS,
  DIGITAL_STATUS_LABELS,
} from '@/lib/creator-types';

interface Props {
  axis: 'reale' | 'digitale';
  value: SemaforoStatus;
  onChange: (value: SemaforoStatus) => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function SemaforoSelector({ axis, value, onChange, disabled, compact }: Props) {
  const labels = axis === 'reale' ? REAL_STATUS_LABELS : DIGITAL_STATUS_LABELS;
  const color = SEMAFORO_COLORS[value];

  return (
    <label
      className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs"
      style={{ backgroundColor: '#151515', border: '1px solid #2A2A2A' }}
      title={`Semaforo ${axis}`}
    >
      <span
        className="inline-block rounded-full shrink-0"
        style={{ width: 9, height: 9, backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
        aria-hidden
      />
      {!compact && <span className="opacity-50 capitalize">{axis}</span>}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as SemaforoStatus)}
        className="bg-transparent text-[#F5F5F5] text-xs outline-none disabled:opacity-50"
        style={{ colorScheme: 'dark' }}
      >
        {SEMAFORO_STATUS_VALUES.map((s) => (
          <option key={s} value={s} style={{ backgroundColor: '#111' }}>
            {labels[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
