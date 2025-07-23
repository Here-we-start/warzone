import React, { useState } from 'react';
import { Target, Save, Edit, Trash2, Plus, AlertTriangle, Users, Trophy } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { Team, Match, Tournament, AuditLog } from '../types';
import { logAction } from '../utils/auditLogger';

interface ScoreAssignmentProps {
  teams: Team[];
  matches: Match[];
  setMatches: (matches: Match[] | ((prev: Match[]) => Match[])) => void;
  tournament: Tournament;
  auditLogs: AuditLog[];
  setAuditLogs: (logs: AuditLog[] | ((prev: AuditLog[]) => AuditLog[])) => void;
  userRole: 'admin' | 'manager';
  userName: string;
  multipliers: Record<number, number>;
}

interface MatchEntry {
  teamCode: string;
  teamName: string;
  position: number;
  kills: number;
  score: number;
}

export default function ScoreAssignment({
  teams,
  matches,
  setMatches,
  tournament,
  auditLogs,
  setAuditLogs,
  userRole,
  userName,
  multipliers
}: ScoreAssignmentProps) {
  const [selectedMatch, setSelectedMatch] = useState<number>(1);
  const [matchEntries, setMatchEntries] = useState<MatchEntry[]>([]);
  const [editingMatch, setEditingMatch] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Genera lista partite disponibili
  const availableMatches = Array.from({ length: tournament.settings.totalMatches }, (_, i) => i + 1);

  // Ottieni partite esistenti per la partita selezionata
  const getExistingMatchData = (matchNumber: number) => {
    return matches.filter(match => 
      match.tournamentId === tournament.id && 
      match.status === 'approved' &&
      match.id.includes(`match-${matchNumber}-`)
    );
  };

  // Inizializza entries per una nuova partita
  const initializeMatchEntries = (matchNumber: number) => {
    const existingMatches = getExistingMatchData(matchNumber);
    
    if (existingMatches.length > 0) {
      // Carica dati esistenti
      const entries = existingMatches.map(match => ({
        teamCode: match.teamCode,
        teamName: teams.find(t => t.code === match.teamCode)?.name || match.teamCode,
        position: match.position,
        kills: match.kills,
        score: match.score
      }));
      setMatchEntries(entries);
    } else {
      // Inizializza con teams vuoti
      const entries = teams
        .filter(team => team.tournamentId === tournament.id)
        .map(team => ({
          teamCode: team.code,
          teamName: team.name,
          position: 1,
          kills: 0,
          score: 0
        }));
      setMatchEntries(entries);
    }
  };

  // Cambia partita selezionata
  const handleMatchChange = (matchNumber: number) => {
    setSelectedMatch(matchNumber);
    setEditingMatch(null);
    initializeMatchEntries(matchNumber);
  };

  // Aggiorna entry di una squadra
  const updateEntry = (teamCode: string, field: 'position' | 'kills', value: number) => {
    setMatchEntries(prev => prev.map(entry => {
      if (entry.teamCode === teamCode) {
        const updated = { ...entry, [field]: value };
        // Ricalcola score
        const multiplier = multipliers[updated.position] || 1;
        updated.score = updated.kills * multiplier;
        return updated;
      }
      return entry;
    }));
  };

  // Salva partita
  const saveMatch = async () => {
    if (matchEntries.length === 0) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Rimuovi partite esistenti per questo match number
    const existingMatches = getExistingMatchData(selectedMatch);
    const newMatches = matchEntries.map(entry => ({
      id: `match-${selectedMatch}-${entry.teamCode}-${Date.now()}`,
      position: entry.position,
      kills: entry.kills,
      score: entry.score,
      teamCode: entry.teamCode,
      photos: [], // Admin/Manager non necessitano foto
      status: 'approved' as const,
      submittedAt: Date.now(),
      reviewedAt: Date.now(),
      reviewedBy: userName,
      tournamentId: tournament.id
    }));

    // Usa syncOperation per sincronizzazione robusta
    const updatedMatches = matches.filter(match => 
      !existingMatches.some(existing => existing.id === match.id)
    ).concat(newMatches);

    const syncResult = await ApiService.syncOperation({
      localUpdate: () => {
        setMatches(prev => prev.filter(match => 
          !existingMatches.some(existing => existing.id === match.id)
        ));
        setMatches(prev => [...prev, ...newMatches]);
      },
      apiCall: async () => {
        // Elimina partite esistenti
        for (const match of existingMatches) {
          await ApiService.deleteMatch(match.id);
        }
        // Crea nuove partite
        for (const match of newMatches) {
          await ApiService.createMatch(match);
        }
        return { success: true };
      },
      storageKey: 'matches',
      storageData: updatedMatches,
      operationName: `Match ${selectedMatch} Score Assignment`
    });

    if (!syncResult.success) {
      console.warn('⚠️ Score assignment saved locally, database sync failed:', syncResult.error);
      alert('⚠️ Punteggi salvati localmente. Sincronizzazione database fallita, ma i punteggi funzioneranno ugualmente.');
    }

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'MATCH_SCORES_ASSIGNED',
      `Punteggi assegnati per Partita ${selectedMatch} - ${matchEntries.length} squadre`,
      userName,
      userRole,
      { 
        matchNumber: selectedMatch, 
        tournamentId: tournament.id,
        teamsCount: matchEntries.length,
        totalScore: matchEntries.reduce((sum, entry) => sum + entry.score, 0)
      }
    );

    setIsSubmitting(false);
    setEditingMatch(null);
  };

  // Elimina partita
  const deleteMatch = async (matchNumber: number) => {
    if (!confirm(`Sei sicuro di voler eliminare tutti i punteggi della Partita ${matchNumber}?`)) return;

    const existingMatches = getExistingMatchData(matchNumber);
    const updatedMatches = matches.filter(match => 
      !existingMatches.some(existing => existing.id === match.id)
    );

    // Sincronizza con database
    const syncResult = await ApiService.syncOperation({
      localUpdate: () => {
        setMatches(prev => prev.filter(match => 
          !existingMatches.some(existing => existing.id === match.id)
        ));
      },
      apiCall: async () => {
        for (const match of existingMatches) {
          await ApiService.deleteMatch(match.id);
        }
        return { success: true };
      },
      storageKey: 'matches',
      storageData: updatedMatches,
      operationName: `Match ${matchNumber} Deletion`
    });

    if (!syncResult.success) {
      console.warn('⚠️ Match deleted locally, database sync failed:', syncResult.error);
    }

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'MATCH_SCORES_DELETED',
      `Punteggi eliminati per Partita ${matchNumber}`,
      userName,
      userRole,
      { matchNumber, tournamentId: tournament.id }
    );

    // Reinizializza se è la partita corrente
    if (matchNumber === selectedMatch) {
      initializeMatchEntries(matchNumber);
    }
  };

  // Inizializza al mount
  React.useEffect(() => {
    initializeMatchEntries(selectedMatch);
  }, [selectedMatch, teams, matches]);

  const existingMatchData = getExistingMatchData(selectedMatch);
  const hasExistingData = existingMatchData.length > 0;

  return (
    <div className="space-y-6">
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <Target className="w-5 h-5 text-ice-blue" />
            <span>ASSEGNA PUNTEGGI</span>
          </h2>
          
          <div className="flex items-center space-x-4">
            <div className="text-ice-blue font-mono text-sm">
              Torneo: <span className="text-white font-bold">{tournament.name}</span>
            </div>
          </div>
        </div>

        {/* Selezione Partita */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-ice-blue mb-2 font-mono text-sm">Seleziona Partita</label>
            <select
              value={selectedMatch}
              onChange={(e) => handleMatchChange(Number(e.target.value))}
              className="w-full px-4 py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono"
              disabled={editingMatch !== null}
            >
              {availableMatches.map(matchNum => {
                const hasData = getExistingMatchData(matchNum).length > 0;
                return (
                  <option key={matchNum} value={matchNum}>
                    Partita {matchNum} {hasData ? '(Completata)' : '(Vuota)'}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-end space-x-3">
            {hasExistingData && editingMatch === null && (
              <>
                <button
                  onClick={() => setEditingMatch(selectedMatch)}
                  className="flex items-center space-x-2 px-4 py-3 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-xl hover:bg-yellow-500/30 transition-colors font-mono"
                >
                  <Edit className="w-4 h-4" />
                  <span>MODIFICA</span>
                </button>
                <button
                  onClick={() => deleteMatch(selectedMatch)}
                  className="flex items-center space-x-2 px-4 py-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors font-mono"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ELIMINA</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Partita */}
        <div className="mb-6">
          <div className={`p-4 rounded-lg border ${
            hasExistingData 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-yellow-500/10 border-yellow-500/30'
          }`}>
            <div className="flex items-center space-x-2">
              {hasExistingData ? (
                <>
                  <Trophy className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-mono font-bold">
                    Partita {selectedMatch} completata - {existingMatchData.length} squadre
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-mono font-bold">
                    Partita {selectedMatch} non ancora completata
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabella Punteggi */}
        {(!hasExistingData || editingMatch === selectedMatch) && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ice-blue/30">
                    <th className="text-left py-3 px-4 text-ice-blue font-mono text-sm">SQUADRA</th>
                    <th className="text-center py-3 px-4 text-ice-blue font-mono text-sm">POSIZIONE</th>
                    <th className="text-center py-3 px-4 text-ice-blue font-mono text-sm">KILLS</th>
                    <th className="text-center py-3 px-4 text-ice-blue font-mono text-sm">MOLTIPLICATORE</th>
                    <th className="text-right py-3 px-4 text-ice-blue font-mono text-sm">PUNTEGGIO</th>
                  </tr>
                </thead>
                <tbody>
                  {matchEntries.map((entry, index) => (
                    <tr key={entry.teamCode} className="border-b border-ice-blue/10 hover:bg-ice-blue/5">
                      <td className="py-3 px-4">
                        <div className="text-white font-bold font-mono">{entry.teamName}</div>
                        <div className="text-ice-blue/60 text-sm font-mono">{entry.teamCode}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={entry.position}
                          onChange={(e) => updateEntry(entry.teamCode, 'position', Number(e.target.value))}
                          className="w-20 px-2 py-1 bg-black/30 border border-ice-blue/40 rounded text-white font-mono text-center focus:outline-none focus:border-ice-blue"
                        >
                          {Array.from({ length: 20 }, (_, i) => i + 1).map(pos => (
                            <option key={pos} value={pos}>{pos}°</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          value={entry.kills}
                          onChange={(e) => updateEntry(entry.teamCode, 'kills', Number(e.target.value))}
                          min="0"
                          className="w-20 px-2 py-1 bg-black/30 border border-ice-blue/40 rounded text-white font-mono text-center focus:outline-none focus:border-ice-blue"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-ice-blue font-mono font-bold">
                          x{multipliers[entry.position] || 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-white font-mono font-bold text-lg">
                          {entry.score.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-4">
              <div className="text-ice-blue/60 font-mono text-sm">
                Punteggio totale partita: <span className="text-white font-bold">
                  {matchEntries.reduce((sum, entry) => sum + entry.score, 0).toFixed(1)} punti
                </span>
              </div>
              
              <div className="flex space-x-3">
                {editingMatch === selectedMatch && (
                  <button
                    onClick={() => {
                      setEditingMatch(null);
                      initializeMatchEntries(selectedMatch);
                    }}
                    className="px-4 py-2 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors font-mono"
                  >
                    ANNULLA
                  </button>
                )}
                <button
                  onClick={saveMatch}
                  disabled={isSubmitting || matchEntries.length === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                >
                  <Save className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>{isSubmitting ? 'SALVATAGGIO...' : 'SALVA PARTITA'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Visualizzazione Dati Esistenti */}
        {hasExistingData && editingMatch !== selectedMatch && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ice-blue/30">
                  <th className="text-left py-3 px-4 text-ice-blue font-mono text-sm">SQUADRA</th>
                  <th className="text-center py-3 px-4 text-ice-blue font-mono text-sm">POSIZIONE</th>
                  <th className="text-center py-3 px-4 text-ice-blue font-mono text-sm">KILLS</th>
                  <th className="text-right py-3 px-4 text-ice-blue font-mono text-sm">PUNTEGGIO</th>
                </tr>
              </thead>
              <tbody>
                {existingMatchData
                  .sort((a, b) => a.position - b.position)
                  .map((match, index) => (
                    <tr 
                      key={match.id} 
                      className={`border-b border-ice-blue/10 ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400/10 to-transparent' :
                        index === 2 ? 'bg-gradient-to-r from-orange-600/10 to-transparent' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {index < 3 && <Trophy className="w-4 h-4 text-yellow-400" />}
                          <div>
                            <div className="text-white font-bold font-mono">
                              {teams.find(t => t.code === match.teamCode)?.name || match.teamCode}
                            </div>
                            <div className="text-ice-blue/60 text-sm font-mono">{match.teamCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-white font-mono font-bold">{match.position}°</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-white font-mono">{match.kills}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-white font-mono font-bold text-lg">
                          {match.score.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      {/* Riepilogo Partite */}
      <GlassPanel className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 font-mono flex items-center space-x-2">
          <Users className="w-5 h-5 text-ice-blue" />
          <span>RIEPILOGO PARTITE</span>
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {availableMatches.map(matchNum => {
            const hasData = getExistingMatchData(matchNum).length > 0;
            return (
              <button
                key={matchNum}
                onClick={() => handleMatchChange(matchNum)}
                className={`p-3 rounded-lg border font-mono transition-all duration-300 ${
                  selectedMatch === matchNum
                    ? 'bg-ice-blue/20 border-ice-blue/50 text-ice-blue'
                    : hasData
                    ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                    : 'bg-gray-500/10 border-gray-500/30 text-gray-400 hover:bg-gray-500/20'
                }`}
              >
                <div className="text-center">
                  <div className="font-bold">Partita {matchNum}</div>
                  <div className="text-xs mt-1">
                    {hasData ? `${getExistingMatchData(matchNum).length} squadre` : 'Vuota'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </GlassPanel>
    </div>
  );
}