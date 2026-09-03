'use client';

// KAN-clienti — Storico serate di un locale (locale + storia + data + note)
import { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import type { VenueEventDetail } from '@/lib/creator-types';

interface StoryOption {
  id: string;
  title: string;
}

const inputStyle = {
  backgroundColor: '#0D0D0D',
  border: '1px solid #333',
  color: '#F5F5F5',
};

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

export default function VenueEventsPage({
  params,
}: {
  params: Promise<{ venueId: string }>;
}) {
  const { venueId } = use(params);

  const [venueName, setVenueName] = useState('');
  const [events, setEvents] = useState<VenueEventDetail[]>([]);
  const [stories, setStories] = useState<StoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newStoryId, setNewStoryId] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<Record<string, { storyId: string; eventDate: string; notes: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/venues/${venueId}`).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
      fetch(`/api/venues/${venueId}/events`).then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
      fetch('/api/stories?all=true').then((r) => r.json()),
    ])
      .then(([venue, eventsData, storiesData]) => {
        setVenueName(venue.name);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setStories(Array.isArray(storiesData) ? storiesData.map((s: StoryOption) => ({ id: s.id, title: s.title })) : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Errore nel caricare lo storico serate');
        setLoading(false);
      });
  }, [venueId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!newStoryId || !newDate) {
      alert('Storia e data sono obbligatorie');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: newStoryId, eventDate: newDate, notes: newNotes.trim() || null }),
      });
      if (res.ok) {
        setNewStoryId('');
        setNewDate('');
        setNewNotes('');
        load();
      } else {
        const data = await res.json();
        alert(data.error || 'Errore durante la creazione della serata');
      }
    } catch {
      alert('Errore di connessione');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (event: VenueEventDetail) => {
    setEditing((prev) => ({
      ...prev,
      [event.id]: {
        storyId: event.storyId,
        eventDate: toDateInputValue(event.eventDate),
        notes: event.notes ?? '',
      },
    }));
  };

  const cancelEdit = (id: string) => {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSaveEdit = async (id: string) => {
    const draft = editing[id];
    if (!draft) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/venues/${venueId}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: draft.storyId,
          eventDate: draft.eventDate,
          notes: draft.notes.trim() || null,
        }),
      });
      if (res.ok) {
        cancelEdit(id);
        load();
      } else {
        const data = await res.json();
        alert(data.error || 'Errore durante il salvataggio');
      }
    } catch {
      alert('Errore di connessione');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa serata dallo storico?')) return;
    try {
      const res = await fetch(`/api/venues/${venueId}/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        load();
      } else {
        const data = await res.json();
        alert(data.error || "Errore durante l'eliminazione");
      }
    } catch {
      alert('Errore di connessione');
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
    return <p className="text-center py-20 opacity-60">{error}</p>;
  }

  return (
    <div>
      <Link href="/creator/venues" className="text-sm opacity-60 hover:opacity-100 mb-4 inline-block">
        ← Clienti
      </Link>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Storico serate — {venueName}</h1>
      </div>

      {/* Nuova serata */}
      <div
        className="rounded-lg p-4 border mb-6"
        style={{ borderColor: '#222', backgroundColor: '#111' }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#CC0000' }}>
          Nuova serata
        </h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs opacity-60 mb-1">Storia</label>
            <select
              value={newStoryId}
              onChange={(e) => setNewStoryId(e.target.value)}
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={inputStyle}
            >
              <option value="">Seleziona storia...</option>
              {stories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs opacity-60 mb-1">Data</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs opacity-60 mb-1">Note</label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ backgroundColor: '#CC0000', color: '#F5F5F5' }}
        >
          + Aggiungi serata
        </button>
      </div>

      {/* Elenco serate */}
      {events.length === 0 ? (
        <div
          className="rounded-lg p-12 text-center border"
          style={{ borderColor: '#333', backgroundColor: '#111' }}
        >
          <p className="opacity-60">Nessuna serata registrata per questo locale</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const draft = editing[event.id];
            return (
              <div
                key={event.id}
                className="rounded-lg p-4 border"
                style={{ borderColor: '#222', backgroundColor: '#111' }}
              >
                {draft ? (
                  <div>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs opacity-60 mb-1">Storia</label>
                        <select
                          value={draft.storyId}
                          onChange={(e) =>
                            setEditing((prev) => ({ ...prev, [event.id]: { ...draft, storyId: e.target.value } }))
                          }
                          className="w-full px-3 py-2 rounded text-sm outline-none"
                          style={inputStyle}
                        >
                          {stories.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs opacity-60 mb-1">Data</label>
                        <input
                          type="date"
                          value={draft.eventDate}
                          onChange={(e) =>
                            setEditing((prev) => ({ ...prev, [event.id]: { ...draft, eventDate: e.target.value } }))
                          }
                          className="w-full px-3 py-2 rounded text-sm outline-none"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label className="block text-xs opacity-60 mb-1">Note</label>
                        <textarea
                          value={draft.notes}
                          onChange={(e) =>
                            setEditing((prev) => ({ ...prev, [event.id]: { ...draft, notes: e.target.value } }))
                          }
                          rows={2}
                          className="w-full px-3 py-2 rounded text-sm outline-none resize-y"
                          style={inputStyle}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(event.id)}
                        disabled={savingId === event.id}
                        className="px-3 py-1.5 rounded text-sm transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{ backgroundColor: '#1a3a1a', color: '#6fbf6f', border: '1px solid #234a23' }}
                      >
                        Salva
                      </button>
                      <button
                        onClick={() => cancelEdit(event.id)}
                        className="px-3 py-1.5 rounded text-sm transition-opacity hover:opacity-80"
                        style={{ backgroundColor: '#1a1a2e', color: '#F5F5F5', border: '1px solid #333' }}
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-sm">{event.story.title}</span>
                        <span className="text-xs opacity-50">
                          {new Date(event.eventDate).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      {event.notes && <p className="text-sm opacity-70 whitespace-pre-wrap">{event.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(event)}
                        className="px-3 py-1.5 rounded text-sm transition-opacity hover:opacity-80"
                        style={{ backgroundColor: '#1a1a2e', color: '#F5F5F5', border: '1px solid #333' }}
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="px-3 py-1.5 rounded text-sm transition-opacity hover:opacity-80"
                        style={{ backgroundColor: '#2a0a0a', color: '#bf6f6f', border: '1px solid #3a1a1a' }}
                      >
                        Elimina
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
