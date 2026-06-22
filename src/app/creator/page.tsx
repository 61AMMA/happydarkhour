'use client';

// KAN-21 — Dashboard Creator: lista storie
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Story {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  durationMin: number;
  isActive: boolean;
  steps: { id: string }[];
}

export default function CreatorDashboard() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stories?all=true')
      .then((r) => r.json())
      .then((data) => {
        setStories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Errore nel caricare le storie');
        setLoading(false);
      });
  }, []);

  const handleDelete = async (storyId: string, title: string) => {
    if (!confirm(`Eliminare la storia "${title}"? L'operazione non è reversibile.`)) return;
    setDeleting(storyId);
    try {
      const res = await fetch(`/api/stories/${storyId}`, { method: 'DELETE' });
      if (res.ok) {
        setStories((prev) => prev.filter((s) => s.id !== storyId));
      } else {
        const data = await res.json();
        alert(data.error || 'Errore durante l\'eliminazione');
      }
    } catch {
      alert('Errore di connessione');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#CC0000', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center py-20 opacity-60">{error}</p>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Storie</h1>
        <Link
          href="/creator/stories/new"
          className="px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#CC0000', color: '#F5F5F5' }}
        >
          + Nuova storia
        </Link>
      </div>

      {/* Lista storie */}
      {stories.length === 0 ? (
        <div
          className="rounded-lg p-12 text-center border"
          style={{ borderColor: '#333', backgroundColor: '#111' }}
        >
          <p className="opacity-60 mb-4">Nessuna storia ancora</p>
          <Link
            href="/creator/stories/new"
            className="text-sm underline"
            style={{ color: '#CC0000' }}
          >
            Crea la tua prima storia
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map((story) => (
            <div
              key={story.id}
              className="rounded-lg p-5 border flex items-start justify-between gap-4"
              style={{ borderColor: '#222', backgroundColor: '#111' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="font-semibold text-base truncate">{story.title}</h2>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: story.isActive ? '#1a3a1a' : '#2a1a1a',
                      color: story.isActive ? '#6fbf6f' : '#bf6f6f',
                    }}
                  >
                    {story.isActive ? 'attiva' : 'disattiva'}
                  </span>
                </div>
                {story.description && (
                  <p className="text-sm opacity-60 mb-2 truncate">{story.description}</p>
                )}
                <p className="text-xs opacity-40">
                  {story.steps.length} step · {story.durationMin} min · difficoltà: {story.difficulty}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/creator/stories/${story.id}`}
                  className="px-3 py-1.5 rounded text-sm transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#1a1a2e', color: '#F5F5F5', border: '1px solid #333' }}
                >
                  Modifica
                </Link>
                <button
                  onClick={() => handleDelete(story.id, story.title)}
                  disabled={deleting === story.id}
                  className="px-3 py-1.5 rounded text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ backgroundColor: '#2a0a0a', color: '#bf6f6f', border: '1px solid #3a1a1a' }}
                >
                  {deleting === story.id ? '...' : 'Elimina'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
