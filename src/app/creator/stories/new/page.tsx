'use client';

// KAN-21 — Crea nuova storia
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewStoryPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    durationMin: 60,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Il titolo è obbligatorio'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Errore durante la creazione'); setSaving(false); return; }
      router.push(`/creator/stories/${data.id}`);
    } catch {
      setError('Errore di connessione');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <nav className="text-sm opacity-50 mb-6">
        <Link href="/creator">Storie</Link>
        <span className="mx-2">›</span>
        <span>Nuova storia</span>
      </nav>

      <h1 className="text-xl font-bold mb-6">Nuova storia</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">
            Titolo <span style={{ color: '#CC0000' }}>*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Es: La Garduña"
            className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-1"
            style={{
              backgroundColor: '#111',
              border: '1px solid #333',
              color: '#F5F5F5',
            }}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descrizione</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Breve descrizione della storia per l'operatore"
            className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-1 resize-none"
            style={{
              backgroundColor: '#111',
              border: '1px solid #333',
              color: '#F5F5F5',
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Difficoltà</label>
            <select
              value={form.difficulty}
              onChange={(e) =>
                setForm({ ...form, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })
              }
              className="w-full rounded px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: '#111', border: '1px solid #333', color: '#F5F5F5' }}
            >
              <option value="easy">Facile</option>
              <option value="medium">Media</option>
              <option value="hard">Difficile</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Durata (minuti)</label>
            <input
              type="number"
              value={form.durationMin}
              onChange={(e) => setForm({ ...form, durationMin: parseInt(e.target.value) || 60 })}
              min={15}
              max={240}
              className="w-full rounded px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: '#111', border: '1px solid #333', color: '#F5F5F5' }}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm" style={{ color: '#CC0000' }}>{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#CC0000', color: '#F5F5F5' }}
          >
            {saving ? 'Creazione...' : 'Crea storia'}
          </button>
          <Link
            href="/creator"
            className="px-5 py-2 rounded text-sm opacity-60 hover:opacity-100"
            style={{ border: '1px solid #333' }}
          >
            Annulla
          </Link>
        </div>
      </form>
    </div>
  );
}
