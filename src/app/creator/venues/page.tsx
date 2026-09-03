'use client';

// KAN-clienti — Dashboard Clienti: lista locali
import { useState, useEffect } from 'react';
import Link from 'next/link';
import VenueContactsModal from '@/components/creator/VenueContactsModal';
import type { VenueSummary } from '@/lib/creator-types';

export default function ClientiDashboard() {
  const [venues, setVenues] = useState<VenueSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openVenueId, setOpenVenueId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadVenues = () => {
    setLoading(true);
    fetch('/api/venues?all=true')
      .then((r) => r.json())
      .then((data) => {
        setVenues(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Errore nel caricare i locali');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadVenues();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        setNewName('');
        loadVenues();
      } else {
        const data = await res.json();
        alert(data.error || "Errore durante la creazione del locale");
      }
    } catch {
      alert('Errore di connessione');
    } finally {
      setCreating(false);
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Clienti</h1>
      </div>

      {/* Form nuovo locale */}
      <div
        className="rounded-lg p-4 border flex items-center gap-3 mb-6"
        style={{ borderColor: '#222', backgroundColor: '#111' }}
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder="Nome locale"
          className="flex-1 px-3 py-2 rounded text-sm outline-none"
          style={{ backgroundColor: '#0D0D0D', border: '1px solid #333', color: '#F5F5F5' }}
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ backgroundColor: '#CC0000', color: '#F5F5F5' }}
        >
          + Nuovo locale
        </button>
      </div>

      {/* Lista locali */}
      {venues.length === 0 ? (
        <div
          className="rounded-lg p-12 text-center border"
          style={{ borderColor: '#333', backgroundColor: '#111' }}
        >
          <p className="opacity-60">Nessun locale ancora</p>
        </div>
      ) : (
        <div className="space-y-3">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="rounded-lg p-5 border flex items-start justify-between gap-4"
              style={{ borderColor: '#222', backgroundColor: '#111' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="font-semibold text-base truncate">{venue.name}</h2>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: venue.isActive ? '#1a3a1a' : '#2a1a1a',
                      color: venue.isActive ? '#6fbf6f' : '#bf6f6f',
                    }}
                  >
                    {venue.isActive ? 'attivo' : 'disattivo'}
                  </span>
                </div>
                <p className="text-xs opacity-40">
                  {[venue.city, venue.province].filter(Boolean).join(' · ') || 'Nessun indirizzo salvato'}
                  {venue.phone ? ` · ${venue.phone}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/creator/venues/${venue.id}/events`}
                  className="px-3 py-1.5 rounded text-sm transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#1a1a2e', color: '#F5F5F5', border: '1px solid #333' }}
                >
                  Storico serate
                </Link>
                <button
                  onClick={() => setOpenVenueId(venue.id)}
                  className="px-3 py-1.5 rounded text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#CC0000', color: '#F5F5F5' }}
                >
                  Visualizza contatti
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {openVenueId && (
        <VenueContactsModal
          venueId={openVenueId}
          onClose={() => setOpenVenueId(null)}
          onSaved={loadVenues}
        />
      )}
    </div>
  );
}
