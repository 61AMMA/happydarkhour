'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

// KAN-20: URL builder from server-info (no longer uses generatePlayerLink from config.ts)
function buildPlayerLink(baseUrl: string, teamId: string): string {
  return `${baseUrl}/play?team=${teamId}`;
}
function buildViewOnlyLink(baseUrl: string, teamId: string): string {
  return `${baseUrl}/play?team=${teamId}&viewOnly=true`;
}

export default function OperatorPage() {
  const [session, setSession] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // KAN-20: LAN info from server-info API
  const [serverInfo, setServerInfo] = useState<{ lanIp: string | null; port: number; baseUrl: string } | null>(null);

  // Form states
  const [newSessionForm, setNewSessionForm] = useState({
    venueId: '',
    storyId: '',
    operatorId: '',
    maxDuration: 60
  });
  const [newTeamForm, setNewTeamForm] = useState({
    teamName: '',
    members: 2
  });
  const [ranking, setRanking] = useState<any>(null);

  // KAN-22: polling indicator
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);

  // QR Modal states
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrType, setQrType] = useState<'player' | 'viewOnly'>('player');
  const [qrTeamId, setQrTeamId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // KAN-23: confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    action: 'forceEnd' | 'reset' | null;
    title: string;
    body: string;
  }>({ action: null, title: '', body: '' });

  // Carica dati iniziali
  useEffect(() => {
    async function loadData() {
      try {
        // KAN-20: carica server-info prima di tutto
        const serverInfoRes = await fetch('/api/server-info');
        if (serverInfoRes.ok) {
          setServerInfo(await serverInfoRes.json());
        }

        // Carica sessione attiva
        const sessionResponse = await fetch('/api/session');
        const gameSession = await sessionResponse.json();
        setSession(gameSession);

        // Carica dati per setup
        const [venuesRes, storiesRes, operatorsRes] = await Promise.all([
          fetch('/api/venues'),
          fetch('/api/stories'),
          fetch('/api/operators')
        ]);

        setVenues(await venuesRes.json());
        setStories(await storiesRes.json());
        setOperators(await operatorsRes.json());

        // Carica team se sessione esiste
        if (gameSession?.id) {
          const teamsResponse = await fetch(`/api/teams?sessionId=${gameSession.id}`);
          setTeams(await teamsResponse.json());
        }

        setLoading(false);
      } catch (error) {
        console.error('Errore caricamento dati:', error);
        setError('Errore nel caricare i dati');
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Refresh automatico ranking in modalità live
  // KAN-22: stop polling when session is completed or expired
  useEffect(() => {
    if (!session || session.status === 'created') return;
    // KAN-22: non fare polling se la sessione è terminata
    if (session.status === 'completed' || session.status === 'expired') {
      // Carica ranking finale una volta sola
      loadRanking();
      return;
    }

    loadRanking();
    const interval = setInterval(loadRanking, 10000);
    return () => clearInterval(interval);
  }, [session]);

  // KAN-22: tick per "aggiornato X secondi fa"
  useEffect(() => {
    const id = setInterval(() => {
      if (lastUpdatedAt) {
        setSecondsSinceUpdate(Math.floor((Date.now() - lastUpdatedAt.getTime()) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdatedAt]);

  const loadRanking = async () => {
    if (!session?.id) return;
    try {
      const rankingResponse = await fetch(`/api/session/${session.id}/ranking`);
      const rankingData = await rankingResponse.json();
      if (rankingResponse.ok) {
        setRanking(rankingData);
        setLastUpdatedAt(new Date()); // KAN-22
        setSecondsSinceUpdate(0);
      } else {
        console.error('Ranking response non ok:', rankingData);
      }
    } catch (err) {
      console.error('Errore refresh ranking:', err);
    }
  };

  // KAN-23: esegue l'azione confermata
  const handleConfirmAction = async () => {
    const action = confirmDialog.action;
    setConfirmDialog({ action: null, title: '', body: '' });
    if (action === 'forceEnd') {
      await handleForceEndSession();
    } else if (action === 'reset') {
      await handleResetSession();
    }
  };

  // Reset sessione
  const handleResetSession = async () => {
    try {
      await fetch('/api/session', { method: 'DELETE' });
      setSession(null);
      setTeams([]);
    } catch (err) {
      console.error('Errore reset sessione:', err);
    }
  };

  // Crea nuova sessione
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSessionForm)
      });

      if (response.ok) {
        const newSession = await response.json();
        setSession(newSession);
        setTeams([]);
      }
    } catch (err) {
      console.error('Errore creazione sessione:', err);
    }
  };

  // Crea nuovo team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.id) return;

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          teamName: newTeamForm.teamName,
          members: newTeamForm.members
        })
      });

      if (response.ok) {
        const newTeam = await response.json();
        setTeams([...teams, newTeam]);
        setNewTeamForm({ teamName: '', members: 2 });
      }
    } catch (err) {
      console.error('Errore creazione team:', err);
    }
  };

  // Elimina team
  const handleDeleteTeam = async (teamId: string) => {
    try {
      await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
      setTeams(teams.filter(t => t.id !== teamId));
    } catch (err) {
      console.error('Errore eliminazione team:', err);
    }
  };

  // Avvia sessione
  const handleStartSession = async () => {
    if (!session?.id) return;
    try {
      await fetch(`/api/session/${session.id}/start`, { method: 'POST' });
      const sessionResponse = await fetch('/api/session');
      setSession(await sessionResponse.json());
    } catch (err) {
      console.error('Errore avvio sessione:', err);
    }
  };

  // Forza conclusione sessione (chiamata dopo conferma)
  const handleForceEndSession = async () => {
    if (!session?.id) return;
    try {
      await fetch(`/api/session/${session.id}/end`, { method: 'POST' });
      const sessionResponse = await fetch('/api/session');
      setSession(await sessionResponse.json());
    } catch (err) {
      console.error('Errore conclusione sessione:', err);
    }
  };

  // Gestione QR Modal — KAN-20: usa serverInfo.baseUrl
  const showQRCode = async (teamId: string, type: 'player' | 'viewOnly') => {
    const base = serverInfo?.baseUrl || window.location.origin;
    const link = type === 'player' ? buildPlayerLink(base, teamId) : buildViewOnlyLink(base, teamId);

    try {
      const qrDataUrl = await QRCode.toDataURL(link, {
        width: 256,
        margin: 2,
        color: { dark: '#FFFFFF', light: '#1F2937' }
      });
      setQrTeamId(teamId);
      setQrType(type);
      setQrCodeUrl(qrDataUrl);
      setShowQRModal(true);
    } catch (error) {
      console.error('Errore generazione QR:', error);
    }
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setQrCodeUrl('');
    setQrTeamId('');
  };

  const getTeamLink = (teamId: string, type: 'player' | 'viewOnly') => {
    const base = serverInfo?.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return type === 'player' ? buildPlayerLink(base, teamId) : buildViewOnlyLink(base, teamId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Caricamento dati operatore...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Errore</h1>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-center mb-2">Console Operatore</h1>
          {/* KAN-20: mostra IP LAN rilevato */}
          {serverInfo && (
            <p className="text-center text-gray-400 text-sm">
              LAN: <span className="text-green-400 font-mono">{serverInfo.baseUrl}</span>
              {serverInfo.lanIp ? '' : ' (localhost — avvia il server con IP LAN)'}
            </p>
          )}
        </div>

        {/* MODO SETUP - session.status === 'created' */}
        {session && session.status === 'created' && (
          <>
            {/* Gestione Sessione - Setup */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-blue-400">Setup Sessione</h2>

              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="font-bold mb-2">Sessione Corrente</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Stato:</span>
                      <span className="ml-2 px-2 py-1 rounded text-xs bg-yellow-600">created</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Storia:</span>
                      <span className="ml-2">{session.story?.title}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Durata:</span>
                      <span className="ml-2">{session.maxDuration} min</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Team:</span>
                      <span className="ml-2">{teams.length}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleStartSession}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
                  >
                    Avvia Sessione
                  </button>
                  {/* KAN-23: conferma prima di reset */}
                  <button
                    onClick={() => setConfirmDialog({
                      action: 'reset',
                      title: 'Reset sessione?',
                      body: 'La sessione e tutti i progressi saranno eliminati. Questa operazione non è reversibile.'
                    })}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
                  >
                    Reset Sessione
                  </button>
                </div>
              </div>
            </div>

            {/* Gestione Team - Setup */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-green-400">Gestione Team</h2>

              <div className="mb-6">
                <h3 className="font-bold mb-4">Crea Nuovo Team</h3>
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome tavolo *</label>
                    <input
                      type="text"
                      placeholder="Es: Tavolo 1, Sala Rossa, etc."
                      value={newTeamForm.teamName}
                      onChange={(e) => setNewTeamForm({...newTeamForm, teamName: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Partecipanti al tavolo (solo informativo)</label>
                    <input
                      type="number"
                      placeholder="Numero partecipanti"
                      value={newTeamForm.members}
                      onChange={(e) => setNewTeamForm({...newTeamForm, members: parseInt(e.target.value)})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                      min="1"
                      max="8"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Questo valore è solo informativo e non influisce sull'accesso ai dispositivi
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg w-full"
                  >
                    Crea Tavolo
                  </button>
                </form>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold">Team Creati ({teams.length})</h3>
                {teams.map((team: any) => (
                  <div key={team.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-lg">{team.teamName}</h4>
                        <p className="text-sm text-gray-400">Partecipanti: {team.members}</p>
                      </div>

                      {/* Accesso Dispositivi */}
                      <div className="bg-gray-800 rounded-lg p-3">
                        <h5 className="font-medium text-sm mb-2 text-blue-400">Accesso Dispositivi</h5>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium">Link Giocatore</span>
                              <p className="text-xs text-gray-400">1 solo dispositivo può rispondere</p>
                            </div>
                            <button
                              onClick={() => showQRCode(team.id, 'player')}
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                            >
                              QR Giocatore
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium">Link View-Only</span>
                              <p className="text-xs text-gray-400">Multi dispositivo, solo visualizzazione</p>
                            </div>
                            <button
                              onClick={() => showQRCode(team.id, 'viewOnly')}
                              className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
                            >
                              QR View-Only
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Link completi — KAN-20: usa serverInfo.baseUrl */}
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>Giocatore: {getTeamLink(team.id, 'player')}</div>
                        <div>View-Only: {getTeamLink(team.id, 'viewOnly')}</div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                        >
                          Elimina Tavolo
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* MODO LIVE - session.status !== 'created' */}
        {session && session.status !== 'created' && (
          <>
            {/* Dashboard Live */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Informazioni Sessione */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-400">Sessione Live</h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400">Storia:</span>
                    <p className="font-semibold">{session.story?.title || 'Caricamento...'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Stato:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${
                      session.status === 'active' ? 'bg-green-600' :
                      session.status === 'completed' ? 'bg-blue-600' :
                      session.status === 'expired' ? 'bg-red-600' :
                      'bg-gray-600'
                    }`}>
                      {session.status === 'active' ? 'Attiva' :
                       session.status === 'completed' ? 'Completata' :
                       session.status === 'expired' ? 'Scaduta' :
                       session.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Durata:</span>
                    <p>{session.maxDuration} minuti</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Iniziata:</span>
                    <p>{session.startedAt ? new Date(session.startedAt).toLocaleString() : 'N/D'}</p>
                  </div>
                  {session.completedAt && (
                    <div>
                      <span className="text-gray-400">Completata:</span>
                      <p>{new Date(session.completedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Pulsanti azione sessione — KAN-23: con conferma */}
                <div className="mt-6 space-y-3">
                  {session.status === 'active' && (
                    <button
                      onClick={() => setConfirmDialog({
                        action: 'forceEnd',
                        title: 'Forza conclusione sessione?',
                        body: 'La sessione sarà terminata immediatamente. Tutti i team verranno bloccati e i punteggi saranno definitivi.'
                      })}
                      className="w-full bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg"
                    >
                      Forza Conclusione Sessione
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDialog({
                      action: 'reset',
                      title: 'Reset sessione?',
                      body: session.status === 'completed' || session.status === 'expired'
                        ? 'La sessione terminata sarà eliminata e si potrà crearne una nuova.'
                        : 'ATTENZIONE: la sessione è ancora attiva. Reset eliminerà tutti i progressi in corso.'
                    })}
                    className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
                  >
                    {session.status === 'completed' || session.status === 'expired' ?
                      'Reset Sessione' :
                      'Reset Sessione (Attenzione!)'}
                  </button>
                </div>
              </div>

              {/* Team Partecipanti */}
              <div className="bg-gray-800 rounded-lg p-6 lg:col-span-2">
                <h2 className="text-xl font-bold mb-4 text-green-400">Team Partecipanti</h2>
                {teams && teams.length > 0 ? (
                  <div className="space-y-3">
                    {teams.map((team: any) => (
                      <div
                        key={team.id}
                        className="bg-gray-700 rounded-lg p-4 border border-gray-600"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">{team.teamName}</h3>
                            <div className="text-sm text-gray-400 space-y-1">
                              <p>Partecipanti: {team.members}</p>
                              <p>Stato: {team.isActive ? 'Attivo' : 'Non attivo'}</p>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-bold text-blue-400">
                              {team.score} pts
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">Nessun team partecipante</p>
                )}
              </div>
            </div>

            {/* Ranking Live */}
            {ranking && ranking.teams && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-2 text-yellow-400 text-center">
                  {ranking.sessionStatus === 'completed' ? 'Ranking Finale' : 'Ranking Live'}
                </h2>
                {/* KAN-22: indicatore aggiornamento + status polling */}
                <div className="text-sm text-gray-400 text-center mb-4 flex items-center justify-center gap-3">
                  <span>{ranking.totalTeams} team totali</span>
                  {lastUpdatedAt && (
                    <span className="flex items-center gap-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        session.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                      }`} />
                      Aggiornato {secondsSinceUpdate}s fa
                      {session.status !== 'active' && session.status !== 'paused' && (
                        <span className="ml-1 text-gray-500">(polling fermo)</span>
                      )}
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left p-3">#</th>
                        <th className="text-left p-3">Team</th>
                        <th className="text-left p-3">Stato</th>
                        <th className="text-left p-3">Step</th>
                        <th className="text-left p-3">Punti</th>
                        <th className="text-left p-3">Hints</th>
                        <th className="text-left p-3">Completato</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.teams.map((team: any) => (
                        <tr
                          key={team.teamId}
                          className="border-b border-gray-700 hover:bg-gray-700 transition-colors"
                        >
                          <td className="p-3">
                            <span className={`font-bold text-lg ${
                              team.position === 1 ? 'text-yellow-400' :
                              team.position === 2 ? 'text-gray-300' :
                              team.position === 3 ? 'text-orange-600' :
                              'text-gray-400'
                            }`}>
                              #{team.position}
                            </span>
                          </td>
                          <td className="p-3 font-medium">{team.teamName}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              team.isCompleted ? 'bg-green-600' : 'bg-orange-600'
                            }`}>
                              {team.isCompleted ? 'Completato' : 'In corso'}
                            </span>
                          </td>
                          <td className="p-3">{team.currentStep}/{team.totalSteps}</td>
                          <td className="p-3 font-bold text-blue-400">{team.totalScore}</td>
                          <td className="p-3 text-gray-400">{team.hintsUsed}</td>
                          <td className="p-3 text-gray-400">
                            {team.completedAt ? new Date(team.completedAt).toLocaleTimeString() : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Nessuna sessione - Creazione */}
        {!session && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Crea Nuova Sessione</h2>
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Venue</label>
                  <select
                    value={newSessionForm.venueId}
                    onChange={(e) => setNewSessionForm({...newSessionForm, venueId: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Seleziona venue</option>
                    {venues.map((venue: any) => (
                      <option key={venue.id} value={venue.id}>{venue.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Storia</label>
                  <select
                    value={newSessionForm.storyId}
                    onChange={(e) => setNewSessionForm({...newSessionForm, storyId: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Seleziona storia</option>
                    {stories.map((story: any) => (
                      <option key={story.id} value={story.id}>{story.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Operatore</label>
                  <select
                    value={newSessionForm.operatorId}
                    onChange={(e) => setNewSessionForm({...newSessionForm, operatorId: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Seleziona operatore</option>
                    {operators.map((operator: any) => (
                      <option key={operator.id} value={operator.id}>{operator.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Durata (minuti)</label>
                <input
                  type="number"
                  value={newSessionForm.maxDuration}
                  onChange={(e) => setNewSessionForm({...newSessionForm, maxDuration: parseInt(e.target.value)})}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                  min="30"
                  max="180"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
              >
                Crea Sessione
              </button>
            </form>
          </div>
        )}

        {/* QR Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="text-center">
                <h3 className="text-lg font-bold mb-4">
                  {qrType === 'player' ? 'QR Code Giocatore' : 'QR Code View-Only'}
                </h3>
                {qrCodeUrl && (
                  <div className="bg-white p-4 rounded-lg mb-4 inline-block">
                    <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                  </div>
                )}
                <div className="text-xs text-gray-400 mb-4 break-all">
                  {getTeamLink(qrTeamId, qrType)}
                </div>
                <div className="text-sm text-gray-300 mb-4">
                  <p className="font-medium mb-1">
                    {qrType === 'player' ? 'Scansiona con un dispositivo per giocare' : 'Scansiona per visualizzare solo'}
                  </p>
                  {qrType === 'player' && <p className="text-xs">Solo un dispositivo può rispondere</p>}
                  {qrType === 'viewOnly' && <p className="text-xs">Multi dispositivo, solo visualizzazione</p>}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigator.clipboard.writeText(getTeamLink(qrTeamId, qrType))}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                  >
                    Copia Link
                  </button>
                  <button
                    onClick={closeQRModal}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KAN-23: Dialog conferma azioni distruttive */}
        {confirmDialog.action && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl border border-red-700/40">
              <h3 className="text-lg font-bold mb-3 text-red-400">{confirmDialog.title}</h3>
              <p className="text-gray-300 text-sm mb-6">{confirmDialog.body}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog({ action: null, title: '', body: '' })}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleConfirmAction}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Conferma
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm mt-8">
          <p>Happy Dark Hour - Console Operatore</p>
        </div>
      </div>
    </div>
  );
}
