'use client';

import { useState, useRef } from 'react';
import { HintFormEntry, HintType, HINT_TYPE_LABELS } from '@/lib/creator-types';

interface Props {
  hint: HintFormEntry;
  index: number;
  stepId: string;
  onChange: (updated: HintFormEntry) => void;
  onDelete: () => void;
  disabled?: boolean;
}

const HINT_TYPES: HintType[] = ['TEXT', 'PHOTO', 'VIDEO', 'AUDIO'];

const inputCls =
  'bg-[#111] border border-[#333] text-[#F5F5F5] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#CC0000] w-full';

export default function HintCard({ hint, index, stepId, onChange, onDelete, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<HintFormEntry>) => onChange({ ...hint, ...patch });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload fallito');
      const data: { url: string } = await res.json();
      update({ contentUrl: data.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Errore upload');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const typeIcon: Record<HintType, string> = {
    TEXT: '💬',
    PHOTO: '📷',
    VIDEO: '🎬',
    AUDIO: '🔊',
  };

  return (
    <div className="border border-[#2A2A2A] rounded overflow-hidden">
      {/* Header sempre visibile */}
      <div className="flex items-center gap-2 bg-[#111] px-3 py-2">
        {/* Drag handle (visivo) */}
        <span className="text-[#555] cursor-grab select-none">⠿</span>
        <span className="text-sm font-mono text-[#CC0000] w-5">{index + 1}</span>
        <span className="text-sm">{typeIcon[hint.type as HintType] ?? '?'}</span>
        <span className="text-sm text-[#F5F5F5] flex-1 truncate">
          {hint.type === 'TEXT'
            ? (hint.contentText?.slice(0, 60) ?? '') || <em className="text-[#555]">Hint #{index + 1}</em>
            : `${HINT_TYPE_LABELS[hint.type as HintType]} — ${hint.contentUrl ? hint.contentUrl.split('/').pop() : 'nessun file'}`
          }
        </span>
        <span className="text-xs text-[#888]">
          -{hint.pointsCost}pt @ {hint.triggerMinutesAfterFirstClear}min
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="text-xs text-[#AAAAAA] hover:text-[#F5F5F5] px-2"
        >
          {open ? '▲' : '▼'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={disabled}
          className="text-[#CC0000] text-sm hover:opacity-70 disabled:opacity-30 px-1"
          title="Elimina hint"
        >
          ✕
        </button>
      </div>

      {/* Body espandibile */}
      {open && (
        <div className="p-4 space-y-3 bg-[#0F0F0F] border-t border-[#2A2A2A]">
          {/* Tipo */}
          <div>
            <label className="text-xs text-[#888] mb-1 block">Tipo</label>
            <div className="flex gap-2">
              {HINT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update({ type: t, contentText: t === 'TEXT' ? hint.contentText : null, contentUrl: t !== 'TEXT' ? hint.contentUrl : null })}
                  disabled={disabled}
                  className={[
                    'px-3 py-1 rounded text-xs border transition-colors',
                    hint.type === t
                      ? 'bg-[#CC0000] border-[#CC0000] text-white'
                      : 'bg-[#1A1A1A] border-[#333] text-[#AAAAAA] hover:border-[#555]',
                    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                >
                  {typeIcon[t]} {HINT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Contenuto */}
          {hint.type === 'TEXT' ? (
            <div>
              <label className="text-xs text-[#888] mb-1 block">Testo hint</label>
              <textarea
                className={inputCls + ' resize-y min-h-[80px]'}
                value={hint.contentText ?? ''}
                disabled={disabled}
                placeholder="Scrivi il testo dell'hint..."
                onChange={(e) => update({ contentText: e.target.value })}
              />
            </div>
          ) : (
            <div>
              <label className="text-xs text-[#888] mb-1 block">File media</label>
              {hint.contentUrl && (
                <div className="text-xs text-[#AAAAAA] mb-2 truncate">
                  File attuale:{' '}
                  <a
                    href={hint.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#CC0000] hover:underline"
                  >
                    {hint.contentUrl.split('/').pop()}
                  </a>
                </div>
              )}
              <div className="flex gap-2 items-center">
                <input
                  ref={fileRef}
                  type="file"
                  accept={
                    hint.type === 'PHOTO'
                      ? 'image/*'
                      : hint.type === 'VIDEO'
                      ? 'video/*'
                      : 'audio/*'
                  }
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={disabled || uploading}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={disabled || uploading}
                  className="bg-[#1A1A1A] border border-[#444] text-[#F5F5F5] text-xs px-3 py-1 rounded hover:border-[#CC0000] disabled:opacity-50"
                >
                  {uploading ? 'Caricamento...' : hint.contentUrl ? 'Sostituisci file' : 'Carica file'}
                </button>
                {hint.contentUrl && (
                  <button
                    type="button"
                    onClick={() => update({ contentUrl: null })}
                    disabled={disabled}
                    className="text-xs text-[#888] hover:text-[#CC0000] disabled:opacity-30"
                  >
                    Rimuovi
                  </button>
                )}
              </div>
              {uploadError && <p className="text-xs text-[#CC0000] mt-1">{uploadError}</p>}
            </div>
          )}

          {/* Costo punti + trigger */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#888] mb-1 block">Costo in punti</label>
              <input
                type="number"
                className={inputCls}
                value={hint.pointsCost}
                disabled={disabled}
                min={0}
                onChange={(e) => update({ pointsCost: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-xs text-[#888] mb-1 block">
                Trigger (min dopo 1° clear)
              </label>
              <input
                type="number"
                className={inputCls}
                value={hint.triggerMinutesAfterFirstClear}
                disabled={disabled}
                min={0}
                onChange={(e) =>
                  update({ triggerMinutesAfterFirstClear: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
