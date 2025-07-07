import React, { useState } from 'react';
import { Trophy, Users, Calendar, Clock, Search, Eye, Zap, WifiOff, AlertTriangle } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { Tournament, Team, Match, ScoreAdjustment } from '../types';

interface PublicViewProps {
  onShowLogin: () => void;
}

export default function PublicView({ onShowLogin }: PublicViewProps) {
  const [tournaments, , tournamentsStatus] = useRealTimeData<Record<string, Tournament>>('tournaments', {});
  const [teams] = useRealTimeData<Record<string, Team>>('teams', {});
  const [matches] = useRealTimeData<Match[]>('matches', []);
  const [scoreAdjustments] = useRealTimeData<ScoreAdjustment[]>('scoreAdjustments', []);
  const [selectedTournament, setSelectedTournament] = useState<string>('');

  const activeTournaments = Object.values(tournaments).filter(t => t.status === 'active');

  const getLeaderboard = (tournamentId: string) => {
    const tournamentTeams = Object.values(teams).filter(team => team.tournamentId === tournamentId);
    const tournamentMatches = matches.filter(match => 
      match.tournamentId === tournamentId && match.status === 'approved'
    );
    const tournamentAdjustments = scoreAdjustments.filter(adj => adj.tournamentId === tournamentId);

    const teamStats: Record<string, {
      teamName: string;
      finalScore: number;
      matches: number;
    }> = {};

    // Inizializza statistiche team
    tournamentTeams.forEach(team => {
      teamStats[team.code] = {
        teamName: team.name,
        finalScore: 0,
        matches: 0
      };
    });

    // Calcola punteggi partite
    Object.keys(teamStats).forEach(teamCode => {
      const teamMatches = tournamentMatches.filter(m => m.teamCode === teamCode);
      const totalScore = teamMatches.reduce((sum, match) => sum + match.score, 0);
      teamStats[teamCode].finalScore = totalScore;
      teamStats[teamCode].matches = teamMatches.length;
    });

    // Aggiungi modifiche
    tournamentAdjustments.forEach(adj => {
      if (teamStats[adj.teamCode]) {
        teamStats[adj.teamCode].finalScore += adj.points;
      }
    });

    return Object.values(teamStats)
      .filter(team => team.matches > 0)
      .sort((a, b) => b.finalScore - a.finalScore);
  };

  return (
    <div className="min-h-screen p-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        {/* Header semplificato */}
        <GlassPanel className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-ice-blue/20 to-ice-blue-dark/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-ice-blue" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white font-mono">
                  WARZONE PORTAL
                </h1>
                <p className="text-ice-blue/80 font-mono text-sm">
                  Tornei eSports {!tournamentsStatus?.isOnline && '(Offline)'}
                </p>
              </div>
            </div>
            
            {/* Connection Status */}
            {!tournamentsStatus?.isOnline && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-lg font-mono text-xs">
                <WifiOff className="w-4 h-4" />
                <span>OFFLINE</span>
              </div>
            )}
            
            <button
              onClick={onShowLogin}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-lg hover:scale-105 transition-all duration-300 font-mono"
            >
              <Zap className="w-4 h-4" />
              <span>ACCEDI</span>
            </button>
          </div>
        </GlassPanel>

        {/* Lista tornei */}
        {!selectedTournament ? (
          <div className="space-y-4">
            {/* Offline Notice */}
            {!tournamentsStatus?.isOnline && (
              <GlassPanel className="p-4 bg-orange-500/10 border-orange-500/30">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <div>
                    <div className="text-orange-400 font-mono font-bold">Modalità Offline</div>
                    <div className="text-orange-400/80 font-mono text-sm">
                      Visualizzando dati salvati localmente. La sincronizzazione riprenderà quando il server sarà disponibile.
                    </div>
                  </div>
                </div>
              </GlassPanel>
            )}
            
            <h2 className="text-xl font-bold text-white font-mono mb-4">
              TORNEI ATTIVI ({activeTournaments.length})
            </h2>

            {activeTournaments.length === 0 ? (
              <GlassPanel className="p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-ice-blue/50" />
                <p className="text-ice-blue/60 font-mono">Nessun torneo attivo</p>
              </GlassPanel>
            ) : (
              <div className="grid gap-4">
                {activeTournaments.map((tournament) => {
                  const tournamentTeams = Object.values(teams).filter(t => t.tournamentId === tournament.id);
                  const tournamentMatches = matches.filter(m => 
                    m.tournamentId === tournament.id && m.status === 'approved'
                  );
                  
                  return (
                    <GlassPanel 
                      key={tournament.id} 
                      className="p-4 cursor-pointer hover:scale-105 transition-all duration-300"
                      onClick={() => setSelectedTournament(tournament.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white font-mono">
                            {tournament.name}
                          </h3>
                          <div className="text-ice-blue/80 font-mono text-sm">
                            {tournament.type} • {tournamentTeams.length} squadre
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-ice-blue font-mono text-sm">
                          <Eye className="w-4 h-4" />
                          <span>VEDI</span>
                        </div>
                      </div>
                    </GlassPanel>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Dettagli torneo */
          <div className="space-y-4">
            <button
              onClick={() => setSelectedTournament('')}
              className="text-ice-blue hover:text-white transition-colors font-mono text-sm mb-4"
            >
              ← Torna ai Tornei
            </button>

            <GlassPanel className="p-6">
              <h2 className="text-2xl font-bold text-white font-mono mb-4">
                {tournaments[selectedTournament]?.name}
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ice-blue/30">
                      <th className="text-left py-3 px-4 text-ice-blue font-mono">POS</th>
                      <th className="text-left py-3 px-4 text-ice-blue font-mono">SQUADRA</th>
                      <th className="text-right py-3 px-4 text-ice-blue font-mono">PUNTI</th>
                      <th className="text-right py-3 px-4 text-ice-blue font-mono">PARTITE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getLeaderboard(selectedTournament).map((team, index) => (
                      <tr 
                        key={index}
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
                            <span className="font-bold font-mono">#{index + 1}</span>
                            {index < 3 && <Trophy className="w-4 h-4" />}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white font-bold font-mono">
                          {team.teamName}
                        </td>
                        <td className="py-3 px-4 text-right text-white font-mono font-bold">
                          {team.finalScore.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-right text-ice-blue/60 font-mono">
                          {team.matches}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassPanel>
          </div>
        )}
      </div>
    </div>
  );
}