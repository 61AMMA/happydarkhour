'use client';

// KAN-21 — Gestione step di una storia
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { StoryWithSteps } from '@/lib/creator-types';

export default function StoryDetailPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = use(params);
  const router = useRouter();

  const [story, setStory] = useState<StoryWithSteps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [addingStep, setAddingStep] = useState(false);

  useEffect(() => {
    fetch(`/api/stories/${storyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); } else { setStory(data); setTitleDraft(data.title); }
        setLoading(false);
      })
      .catch(() => { setError('Errore nel caricare la storia'); setLoading(false); });
  }, [storyId]);

  const handleSaveTitle = async () => {
    if (!titleDraft.trim() || !story) return;
    setSavingTitle(true);
    const res = await fetch(`/api/stories/${storyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleDraft }),
    });
    if (res.ok) {
      const updated = await res.json();
      setStory((prev) => prev ? { ...prev, title: updated.title } : prev);
      setEditingTitle(false);
    }
    setSavingTitle(false);
  };

  const handleAddStep = async () => {
    if (!story) return;
    setAddingStep(true);
    const nextNumber = (story.steps.length > 0
      ? Math.max(...story.steps.map((s) => s.stepNumber))
      : 0) + 1;
    const res = await fetch(`/api/stories/${storyId}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepNumber: nextNumber,
        title: `Step ${nextNumber}`,
        description: '',
        question: '',
        answerType: 'text_single',
      }),
    });
    if (res.ok) {
      const newStep = await res.json();
      router.push(`/creator/stories/${storyId}/steps/${newStep.id}`);
    } else {
      setAddingStep(false);
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Errore nella creazione dello step');
    }
  };

  const handleDeleteStep = async (stepId: string, stepNumber: number) => {
    if (!confirm(`Eliminare Step ${stepNumber}? I dati di risposte e hint saranno persi.`)) return;
    const res = await fetch(`/api/steps/${stepId}`, { method: 'DELETE' });
    if (res.ok) {
      setStory((prev) =>
        prev ? { ...prev, steps: prev.steps.filter((s) => s.id !== stepId) } : prev
      );
    } else {
      alert('Errore nell\'eliminazione dello step');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: '#CC0000', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="py-20 text-center">
        <p className="opacity-60 mb-4">{error || 'Storia non trovata'}</p>
        <Link href="/creator" className="text-sm underline" style={{ color: '#CC0000' }}>
          Torna alle storie
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm opacity-50 mb-6">
        <Link href="/creator">Storie</Link>
        <span className="mx-2">›</span>
        <span>{story.title}</span>
      </nav>

      {/* Header storia */}
      <div
        className="rounded-lg p-5 mb-6 border"
        style={{ backgroundColor: '#111', borderColor: '#222' }}
      >
        {story.isInUse && (
          <div
            className="text-xs px-3 py-2 rounded mb-4"
            style={{ backgroundColor: '#2a1a00', color: '#cc8800', border: '1px solid #3a2a00' }}
          >
            ⚠ Storia in uso da una sessione attiva — le modifiche sono bloccate
          </div>
        )}

        <div className="flex items-start gap-3 mb-3">
          {editingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                className="flex-1 text-xl font-bold rounded px-2 py-1 outline-none"
                style={{ backgroundColor: '#1a1a1a', border: '1px solid #CC0000', color: '#F5F5F5' }}
              />
              <button
                onClick={handleSaveTitle}
                disabled={savingTitle}
                className="text-sm px-3 py-1 rounded disabled:opacity-50"
                style={{ backgroundColor: '#CC0000', color: '#F5F5F5' }}
              >
                {savingTitle ? '...' : 'Salva'}
              </button>
              <button
                onClick={() => setEditingTitle(false)}
                className="text-sm px-3 py-1 rounded opacity-60 hover:opacity-100"
                style={{ border: '1px solid #333' }}
              >
                Annulla
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-1">
              <h1 className="text-xl font-bold">{story.title}</h1>
              {!story.isInUse && (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="text-xs opacity-40 hover:opacity-80 transition-opacity"
                >
                  ✎
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-sm opacity-50">
          {story.difficulty} · {story.durationMin} min · {story.steps.length} step
        </p>
      </div>

      {/* Lista step */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Step della storia</h2>
        {!story.isInUse && (
          <button
            onClick={handleAddStep}
            disabled={addingStep}
            className="px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50 transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#CC0000', color: '#F5F5F5' }}
          >
            {addingStep ? 'Creazione...' : '+ Aggiungi step'}
          </button>
        )}
      </div>

      {story.steps.length === 0 ? (
        <div
          className="rounded-lg p-10 text-center border"
          style={{ borderColor: '#222', backgroundColor: '#0a0a0a' }}
        >
          <p className="opacity-50 mb-3 text-sm">Nessuno step ancora</p>
          {!story.isInUse && (
            <button
              onClick={handleAddStep}
              disabled={addingStep}
              className="text-sm underline"
              style={{ color: '#CC0000' }}
            >
              Aggiungi il primo step
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {[...story.steps]
            .sort((a, b) => a.stepNumber - b.stepNumber)
            .map((step) => (
              <div
                key={step.id}
                className="rounded-lg p-4 border flex items-center gap-4"
                style={{ backgroundColor: '#111', borderColor: '#222' }}
              >
                <span
                  className="text-xs font-mono w-8 h-8 flex items-center justify-center rounded"
                  style={{ backgroundColor: '#1a1a1a', color: '#CC0000' }}
                >
                  {step.stepNumber}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{step.title}</p>
                  <p className="text-xs opacity-40">{step.answerType}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/creator/stories/${storyId}/steps/${step.id}`}
                    className="text-sm px-3 py-1 rounded transition-opacity hover:opacity-80"
                    style={{ backgroundColor: '#1a1a2e', color: '#F5F5F5', border: '1px solid #333' }}
                  >
                    {story.isInUse ? 'Visualizza' : 'Modifica'}
                  </Link>
                  {!story.isInUse && (
                    <button
                      onClick={() => handleDeleteStep(step.id, step.stepNumber)}
                      className="text-sm px-3 py-1 rounded transition-opacity hover:opacity-80"
                      style={{ backgroundColor: '#2a0a0a', color: '#bf6f6f', border: '1px solid #3a1a1a' }}
                    >
                      Elimina
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
