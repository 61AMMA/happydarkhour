'use client';

// KAN-clienti — Modale "Visualizza contatti": dati locale + contatti personale, editabili
import { useState, useEffect, useCallback } from 'react';
import type { VenueDetail, VenueContactEntry } from '@/lib/creator-types';

interface Props {
  venueId: string;
  onClose: () => void;
  onSaved: () => void;
}

type VenueFieldsForm = {
  name: string;
  phone: string;
  street: string;
  streetNumber: string;
  postalCode: string;
  city: string;
  province: string;
  openingHours: string;
};

const EMPTY_FIELDS: VenueFieldsForm = {
  name: '',
  phone: '',
  street: '',
  streetNumber: '',
  postalCode: '',
  city: '',
  province: '',
  openingHours: '',
};

const inputStyle = {
  backgroundColor: '#0D0D0D',
  border: '1px solid #333',
  color: '#F5F5F5',
};

export default function VenueContactsModal({ venueId, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<VenueFieldsForm>(EMPTY_FIELDS);
  const [savingVenue, setSavingVenue] = useState(false);
  const [venueSaved, setVenueSaved] = useState(false);

  const [contacts, setContacts] = useState<(VenueContactEntry & { _saving?: boolean; _isNew?: boolean })[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/venues/${venueId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: VenueDetail) => {
        setFields({
          name: data.name ?? '',
          phone: data.phone ?? '',
          street: data.street ?? '',
          streetNumber: data.streetNumber ?? '',
          postalCode: data.postalCode ?? '',
          city: data.city ?? '',
          province: data.province ?? '',
          openingHours: data.openingHours ?? '',
        });
        setContacts(
          data.contacts.map((c) => ({
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            phone: c.phone,
            role: c.role,
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        setError('Errore nel caricare il locale');
        setLoading(false);
      });
  }, [venueId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveVenue = async () => {
    if (!fields.name.trim()) {
      alert('Il nome del locale è obbligatorio');
      return;
    }
    setSavingVenue(true);
    setVenueSaved(false);
    try {
      const res = await fetch(`/api/venues/${venueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        setVenueSaved(true);
        onSaved();
        setTimeout(() => setVenueSaved(false), 2000);
      } else {
        const data = await res.json();
        alert(data.error || 'Errore durante il salvataggio');
      }
    } catch {
      alert('Errore di connessione');
    } finally {
      setSavingVenue(false);
    }
  };

  const handleAddRow = () => {
    setContacts((prev) => [
      ...prev,
      { firstName: '', lastName: '', phone: '', role: '', _isNew: true },
    ]);
  };

  const updateRow = (index: number, patch: Partial<VenueContactEntry>) => {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const handleSaveRow = async (index: number) => {
    const row = contacts[index];
    if (!row.firstName.trim() || !row.lastName.trim()) {
      alert('Nome e cognome sono obbligatori');
      return;
    }
    updateRow(index, {} as Partial<VenueContactEntry>);
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, _saving: true } : c)));
    try {
      const payload = {
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        phone: row.phone?.trim() || null,
        role: row.role?.trim() || null,
      };
      const res = row.id
        ? await fetch(`/api/venues/${venueId}/contacts/${row.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/venues/${venueId}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      if (res.ok) {
        const saved = await res.json();
        setContacts((prev) =>
          prev.map((c, i) =>
            i === index
              ? { id: saved.id, firstName: saved.firstName, lastName: saved.lastName, phone: saved.phone, role: saved.role }
              : c
          )
        );
      } else {
        const data = await res.json();
        alert(data.error || 'Errore durante il salvataggio del contatto');
        setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, _saving: false } : c)));
      }
    } catch {
      alert('Errore di connessione');
      setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, _saving: false } : c)));
    }
  };

  const handleDeleteRow = async (index: number) => {
    const row = contacts[index];
    if (!row.id) {
      setContacts((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    if (!confirm(`Rimuovere ${row.firstName} ${row.lastName}?`)) return;
    try {
      const res = await fetch(`/api/venues/${venueId}/contacts/${row.id}`, { method: 'DELETE' });
      if (res.ok) {
        setContacts((prev) => prev.filter((_, i) => i !== index));
      } else {
        const data = await res.json();
        alert(data.error || "Errore durante l'eliminazione");
      }
    } catch {
      alert('Errore di connessione');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border p-6"
        style={{ backgroundColor: '#0D0D0D', borderColor: '#CC0000' }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#CC0000', borderTopColor: 'transparent' }}
            />
          </div>
        ) : error ? (
          <p className="text-center py-16 opacity-60">{error}</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Contatti locale</h2>
              <button onClick={onClose} className="opacity-60 hover:opacity-100 text-sm">
                ✕ Chiudi
              </button>
            </div>

            {/* Nome locale */}
            <div className="mb-6">
              <label className="block text-xs opacity-60 mb-1">Nome locale</label>
              <input
                type="text"
                value={fields.name}
                onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded text-sm outline-none font-semibold"
                style={inputStyle}
              />
            </div>

            {/* Sezione Contatti del locale */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#CC0000' }}>
                Contatti del locale
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs opacity-60 mb-1">Numero locale</label>
                  <input
                    type="text"
                    value={fields.phone}
                    onChange={(e) => setFields((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs opacity-60 mb-1">Via</label>
                  <input
                    type="text"
                    value={fields.street}
                    onChange={(e) => setFields((f) => ({ ...f, street: e.target.value }))}
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs opacity-60 mb-1">Numero civico</label>
                  <input
                    type="text"
                    value={fields.streetNumber}
                    onChange={(e) => setFields((f) => ({ ...f, streetNumber: e.target.value }))}
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs opacity-60 mb-1">CAP</label>
                  <input
                    type="text"
                    value={fields.postalCode}
                    onChange={(e) => setFields((f) => ({ ...f, postalCode: e.target.value }))}
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs opacity-60 mb-1">Località</label>
                  <input
                    type="text"
                    value={fields.city}
                    onChange={(e) => setFields((f) => ({ ...f, city: e.target.value }))}
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs opacity-60 mb-1">Provincia</label>
                  <input
                    type="text"
                    value={fields.province}
                    onChange={(e) => setFields((f) => ({ ...f, province: e.target.value }))}
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs opacity-60 mb-1">Giorni e orari di apertura</label>
                  <textarea
                    value={fields.openingHours}
                    onChange={(e) => setFields((f) => ({ ...f, openingHours: e.target.value }))}
                    rows={3}
                    placeholder={'Es. Lunedì: chiuso\nMartedì-Domenica: 18:00-01:30'}
                    className="w-full px-3 py-2 rounded text-sm outline-none resize-y"
                    style={inputStyle}
                  />
                </div>
              </div>
              <button
                onClick={handleSaveVenue}
                disabled={savingVenue}
                className="mt-4 px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ backgroundColor: '#CC0000', color: '#F5F5F5' }}
              >
                {savingVenue ? 'Salvataggio...' : venueSaved ? 'Salvato ✓' : 'Salva locale'}
              </button>
            </div>

            {/* Sezione Contatti personale del locale */}
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#CC0000' }}>
                Contatti personale del locale
              </h3>
              <div className="space-y-2">
                {contacts.map((c, i) => (
                  <div
                    key={c.id ?? `new-${i}`}
                    className="rounded p-3 border grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end"
                    style={{ borderColor: '#222', backgroundColor: '#111' }}
                  >
                    <div>
                      <label className="block text-[10px] opacity-60 mb-1">Nome</label>
                      <input
                        type="text"
                        value={c.firstName}
                        onChange={(e) => updateRow(i, { firstName: e.target.value })}
                        className="w-full px-2 py-1.5 rounded text-sm outline-none"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] opacity-60 mb-1">Cognome</label>
                      <input
                        type="text"
                        value={c.lastName}
                        onChange={(e) => updateRow(i, { lastName: e.target.value })}
                        className="w-full px-2 py-1.5 rounded text-sm outline-none"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] opacity-60 mb-1">Numero di telefono</label>
                      <input
                        type="text"
                        value={c.phone ?? ''}
                        onChange={(e) => updateRow(i, { phone: e.target.value })}
                        className="w-full px-2 py-1.5 rounded text-sm outline-none"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] opacity-60 mb-1">Ruolo</label>
                      <input
                        type="text"
                        value={c.role ?? ''}
                        onChange={(e) => updateRow(i, { role: e.target.value })}
                        className="w-full px-2 py-1.5 rounded text-sm outline-none"
                        style={inputStyle}
                      />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleSaveRow(i)}
                        disabled={c._saving}
                        className="px-2 py-1.5 rounded text-xs transition-opacity hover:opacity-80 disabled:opacity-40"
                        style={{ backgroundColor: '#1a3a1a', color: '#6fbf6f', border: '1px solid #234a23' }}
                      >
                        Salva
                      </button>
                      <button
                        onClick={() => handleDeleteRow(i)}
                        className="px-2 py-1.5 rounded text-xs transition-opacity hover:opacity-80"
                        style={{ backgroundColor: '#2a0a0a', color: '#bf6f6f', border: '1px solid #3a1a1a' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddRow}
                className="mt-3 px-4 py-2 rounded text-sm transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#1a1a2e', color: '#F5F5F5', border: '1px solid #333' }}
              >
                + Aggiungi persona
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
