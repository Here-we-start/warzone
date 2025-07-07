import React, { useState } from 'react';
import { Archive, Eye, Download, Trophy, Calendar, Users, RotateCcw } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { Tournament, AuditLog } from '../types';
import { logAction } from '../utils/auditLogger';

interface TournamentArchiveProps {
  tournaments: Tournament[];
  setTournaments: (tournaments: Tournament[] | ((prev: Tournament[]) => Tournament[])) => void;
  auditLogs: AuditLog[];
  setAuditLogs: (logs: AuditLog[] | ((prev: AuditLog[]) => AuditLog[])) => void;
}

export default function TournamentArchive({ 
  tournaments, 
  setTournaments, 
  auditLogs, 
  setAuditLogs 
}: TournamentArchiveProps) {
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportTournamentCSV = (tournament: Tournament) => {
    let csv = 'Rank,Team,Code,Match Score,Adjustments,Final Score,Matches Played\n';
    
    // Add defensive check for finalLeaderboard
    const leaderboard = tournament.finalLeaderboard || [];
    leaderboard.forEach(team => {
      csv += `${team.rank},${team.teamName},${team.teamCode},${team.totalScore.toFixed(1)},${team.adjustmentTotal > 0 ? '+' : ''}${team.adjustmentTotal.toFixed(1)},${team.finalScore.toFixed(1)},${team.matches.length}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tournament.name.toLowerCase().replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'TOURNAMENT_EXPORTED',
      `Torneo esportato: ${tournament.name}`,
      'admin',
      'admin',
      { tournamentId: tournament.id, format: 'CSV' }
    );
  };

  const restoreTournament = (tournament: Tournament) => {
    if (!confirm(`Sei sicuro di voler ripristinare il torneo "${tournament.name}"? Questo sovrascriverà i dati attuali.`)) return;

    // This would restore the tournament data to current state
    // For now, we'll just log the action
    logAction(
      auditLogs,
      setAuditLogs,
      'TOURNAMENT_RESTORED',
      `Torneo ripristinato: ${tournament.name}`,
      'admin',
      'admin',
      { tournamentId: tournament.id, section: tournament.section }
    );

    alert('Funzionalità di ripristino non ancora implementata');
  };

  const deleteTournament = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;

    if (!confirm(`Sei sicuro di voler eliminare definitivamente il torneo "${tournament.name}"?`)) return;

    // Fix: Handle tournaments as an array, not an object
    setTournaments(prev => {
      if (Array.isArray(prev)) {
        return prev.filter(t => t.id !== tournamentId);
      }
      // If prev is somehow not an array, convert it to array and filter
      const tournamentsArray = Array.isArray(prev) ? prev : Object.values(prev);
      return tournamentsArray.filter(t => t.id !== tournamentId);
    });

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'TOURNAMENT_DELETED',
      `Torneo eliminato: ${tournament.name}`,
      'admin',
      'admin',
      { tournamentId, tournamentName: tournament.name }
    );
  };

  return (
    <>
      <GlassPanel className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <Archive className="w-5 h-5 text-ice-blue" />
            <span>ARCHIVIO TORNEI ({tournaments.length})</span>
          </h2>
        </div>

        {tournaments.length === 0 ? (
          <div className="text-center text-ice-blue/60 font-mono py-12">
            <Archive className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Nessun torneo archiviato</p>
            <p className="text-sm">I tornei completati appariranno qui</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg hover:bg-ice-blue/5 transition-all duration-300 animate-fade-in"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-bold font-mono text-sm">{tournament.name}</h3>
                    <div className="text-ice-blue/60 text-xs font-mono mt-1">
                      {tournament.section} • {tournament.teams ? Object.keys(tournament.teams).length : 0} squadre
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-mono ${
                    tournament.status === 'completed' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {tournament.status.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-xs text-ice-blue/60 font-mono">
                    <Calendar className="w-3 h-3" />
                    <span>Completato: {formatDate(tournament.completedAt || tournament.endDate || 0)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-ice-blue/60 font-mono">
                    <Trophy className="w-3 h-3" />
                    <span>Vincitore: {tournament.finalLeaderboard && tournament.finalLeaderboard[0] ? tournament.finalLeaderboard[0].teamName : 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-ice-blue/60 font-mono">
                    <Users className="w-3 h-3" />
                    <span>{tournament.matches ? tournament.matches.length : 0} partite giocate</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedTournament(tournament)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-mono text-xs"
                  >
                    <Eye className="w-3 h-3" />
                    <span>VEDI</span>
                  </button>
                  <button
                    onClick={() => exportTournamentCSV(tournament)}
                    className="flex items-center justify-center px-3 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => restoreTournament(tournament)}
                    className="flex items-center justify-center px-3 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {/* Tournament Details Modal */}
      {selectedTournament && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-ice-blue" />
                  <span>{selectedTournament.name}</span>
                </h3>
                <button
                  onClick={() => setSelectedTournament(null)}
                  className="text-ice-blue/60 hover:text-ice-blue transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Tournament Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg">
                  <div className="text-ice-blue font-mono text-sm">SEZIONE</div>
                  <div className="text-white font-bold text-lg">{selectedTournament.section}</div>
                </div>
                <div className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg">
                  <div className="text-ice-blue font-mono text-sm">SQUADRE</div>
                  <div className="text-white font-bold text-lg">{selectedTournament.teams ? Object.keys(selectedTournament.teams).length : 0}</div>
                </div>
                <div className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg">
                  <div className="text-ice-blue font-mono text-sm">PARTITE</div>
                  <div className="text-white font-bold text-lg">{selectedTournament.matches ? selectedTournament.matches.length : 0}</div>
                </div>
              </div>

              {/* Final Leaderboard */}
              <div className="overflow-x-auto">
                <h4 className="text-lg font-bold text-white mb-4 font-mono">CLASSIFICA FINALE</h4>
                {selectedTournament.finalLeaderboard && selectedTournament.finalLeaderboard.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-ice-blue/30">
                        <th className="text-left py-3 px-4 text-ice-blue font-mono text-sm">RANK</th>
                        <th className="text-left py-3 px-4 text-ice-blue font-mono text-sm">SQUADRA</th>
                        <th className="text-left py-3 px-4 text-ice-blue font-mono text-sm">CODICE</th>
                        <th className="text-right py-3 px-4 text-ice-blue font-mono text-sm">PUNTEGGIO</th>
                        <th className="text-right py-3 px-4 text-ice-blue font-mono text-sm">MODIFICHE</th>
                        <th className="text-right py-3 px-4 text-ice-blue font-mono text-sm">TOTALE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTournament.finalLeaderboard.map((team, index) => (
                        <tr 
                          key={team.teamCode}
                          className={`border-b border-ice-blue/10 ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' :
                            index === 1 ? 'bg-gradient-to-r from-gray-400/10 to-transparent' :
                            index === 2 ? 'bg-gradient-to-r from-orange-600/10 to-transparent' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className={`flex items-center space-x-2 ${
                              index === 0 ? 'text-yellow-400' :
                              index === 1 ? 'text-gray-300' :
                              index === 2 ? 'text-orange-400' : 'text-white'
                            }`}>
                              <span className="font-bold font-mono">#{team.rank}</span>
                              {index < 3 && <Trophy className="w-4 h-4" />}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-white font-bold font-mono">{team.teamName}</td>
                          <td className="py-3 px-4 text-ice-blue font-mono">********</td>
                          <td className="py-3 px-4 text-right text-ice-blue font-mono font-bold">
                            {team.totalScore.toFixed(1)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            <span className={
                              team.adjustmentTotal > 0 ? 'text-green-400' :
                              team.adjustmentTotal < 0 ? 'text-red-400' : 'text-ice-blue/60'
                            }>
                              {team.adjustmentTotal > 0 ? '+' : ''}{team.adjustmentTotal.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-white font-mono text-lg font-bold">
                            {team.finalScore.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center text-ice-blue/60 font-mono py-8">
                    <p>Nessuna classifica finale disponibile</p>
                    <p className="text-sm">Il torneo potrebbe non essere stato completato correttamente</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => deleteTournament(selectedTournament.id)}
                  className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-mono"
                >
                  ELIMINA TORNEO
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => exportTournamentCSV(selectedTournament)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono"
                  >
                    <Download className="w-4 h-4" />
                    <span>ESPORTA CSV</span>
                  </button>
                  <button
                    onClick={() => setSelectedTournament(null)}
                    className="px-4 py-2 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors font-mono"
                  >
                    CHIUDI
                  </button>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>
      )}
    </>
  );
}