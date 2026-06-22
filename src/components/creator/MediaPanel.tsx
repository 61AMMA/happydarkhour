'use client';

import { useState, useRef, useEffect } from 'react';

interface StepMediaItem {
  id: string;
  url: string;
  mediaType: string;
  mimeType: string;
  originalName: string;
  fileSize: number;
  position: number;
}

interface Props {
  stepId: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function MediaIcon({ mediaType }: { mediaType: string }) {
  switch (mediaType) {
    case 'IMAGE': return <span className="text-blue-400">🖼</span>;
    case 'PDF':   return <span className="text-red-400">📄</span>;
    case 'AUDIO': return <span className="text-green-400">🎵</span>;
    case 'VIDEO': return <span className="text-purple-400">🎬</span>;
    default:      return <span className="text-gray-400">📎</span>;
  }
}

export default function MediaPanel({ stepId }: Props) {
  const [mediaList, setMediaList] = useState<StepMediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/steps/${stepId}/media`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMediaList(data); })
      .catch(() => {});
  }, [stepId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    try {
      // 1. Upload fisico del file
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Errore upload');

      // 2. Associa il file allo step nel DB
      const mediaRes = await fetch(`/api/steps/${stepId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadData),
      });
      const mediaData = await mediaRes.json();
      if (!mediaRes.ok) throw new Error(mediaData.error || 'Errore salvataggio media');

      setMediaList((prev) => [...prev, mediaData]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Eliminare questo file?')) return;
    const res = await fetch(`/api/steps/${stepId}/media/${mediaId}`, { method: 'DELETE' });
    if (res.ok) {
      setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
    } else {
      alert('Errore durante l\'eliminazione');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Lista file allegati */}
      {mediaList.length > 0 && (
        <div className="flex flex-col gap-2">
          {mediaList.map((m) => (
            <div key={m.id} className="flex items-center gap-3 bg-[#1A1A1A] border border-[#333] rounded px-3 py-2">
              <MediaIcon mediaType={m.mediaType} />
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm text-[#F5F5F5] hover:text-[#CC0000] truncate"
              >
                {m.originalName}
              </a>
              <span className="text-xs text-[#555] shrink-0">{formatBytes(m.fileSize)}</span>
              <button
                type="button"
                onClick={() => handleDelete(m.id)}
                className="text-[#CC0000] text-lg leading-none px-1 hover:opacity-70"
                title="Elimina"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload */}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex items-center gap-3">
        <label className={`cursor-pointer text-sm px-4 py-2 rounded border ${uploading ? 'opacity-50 cursor-not-allowed border-[#333] text-[#555]' : 'border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000] hover:text-white'} transition-colors`}>
          {uploading ? 'Caricamento...' : '+ Allega file'}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,audio/mpeg,audio/wav,video/mp4,video/webm,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
        <span className="text-xs text-[#555]">JPG, PNG, PDF, MP3, MP4 — max 50 MB</span>
      </div>
    </div>
  );
}
