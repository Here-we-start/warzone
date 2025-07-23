import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Trash2, Trophy, Target, Calculator, Eye, Download, Upload, Settings, Plus, Minus, RefreshCw } from 'lucide-react';
import GlassPanel from './GlassPanel';

interface ManualScoreAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: any;
  teams: any[];
  matches: any[];
  multipliers: Record<number, number>;
  onScoreUpdate: (teamCode: string, matchNumber: number, scoreData: any) => void;
  onScoreDelete: (matchId: string) => void;
  onMultiplierUpdate: (multipliers: Record<number, number>) => void;
  userRole: 'admin' | 'manager';
}

export default function ManualScoreAssignment({ 
  isOpen, 
  onClose, 
  tournament, 
  teams, 
  matches,
  multipliers,
  onScoreUpdate,
  onScoreDelete,
  onMultiplierUpdate,
  userRole
}: ManualScoreAssignmentProps) {
  const [activeTab, setActiveTab] = useState<'assign' | 'multipliers' | 'export'>('assign');
  const [selectedMatch, setSelectedMatch] = useState(1);
  const [scoreEntries, setScoreEntries] = useState<Record<string, { kills: number; position: number; score: number; id?: string }>>({});
  const [editingMultipliers, setEditingMultipliers] = useState<Record<number, number>>({});
  const [showExportPreview, setShowExportPreview] = useState(false);

  const totalMatches = tournament.settings?.totalMatches || 4;

  // Initialize score entries when match changes
  useEffect(() => {
    if (teams.length > 0) {
      const initialEntries: Record<string, { kills: number; position: number; score: number; id?: string }> = {};
      
      teams.forEach((team, index) => {
        const existingMatch = matches.find(m => 
          m.teamCode === team.code && 
          (m.matchNumber === selectedMatch || (!m.matchNumber && matches.filter(x => x.teamCode === team.code).indexOf(m) === selectedMatch - 1))
        );
        
        if (existingMatch) {
          initialEntries[team.code] = {
            kills: existingMatch.kills || 0,
            position: existingMatch.position || index + 1,
            score: existingMatch.score || 0,
            id: existingMatch.id
          };
        } else {
          initialEntries[team.code] = {
            kills: 0,
            position: index + 1,
            score: 0
          };
        }
      });
      
      setScoreEntries(initialEntries);
    }
  }, [teams, selectedMatch, matches]);

  // Initialize multipliers
  useEffect(() => {
    setEditingMultipliers({...multipliers});
  }, [multipliers]);

  // Calculate score based on kills and position
  const calculateScore = (kills: number, position: number) => {
    const multiplier = editingMultipliers[position] || multipliers[position] || 1;
    return Math.round(kills * multiplier);
  };

  // Update score entry
  const updateScoreEntry = (teamCode: string, field: 'kills' | 'position', value: number) => {
    setScoreEntries(prev => {
      const updated = { ...prev };
      if (!updated[teamCode]) {
        updated[teamCode] = { kills: 0, position: 1, score: 0 };
      }
      
      updated[teamCode][field] = value;
      
      // Recalculate score
      updated[teamCode].score = calculateScore(
        updated[teamCode].kills,
        updated[teamCode].position
      );
      
      return updated;
    });
  };

  // Auto-assign positions based on kills (descending)
  const autoAssignPositions = () => {
    const teamEntries = Object.entries(scoreEntries)
      .map(([teamCode, entry]) => ({ teamCode, ...entry }))
      .sort((a, b) => b.kills - a.kills);

    const updated = { ...scoreEntries };
    teamEntries.forEach((entry, index) => {
      updated[entry.teamCode].position = index + 1;
      updated[entry.teamCode].score = calculateScore(entry.kills, index + 1);
    });

    setScoreEntries(updated);
  };

  // Save scores for selected match
  const saveMatchScores = () => {
    Object.entries(scoreEntries).forEach(([teamCode, entry]) => {
      if (entry.kills > 0 || entry.position > 0) {
        const scoreData = {
          position: entry.position,
          kills: entry.kills,
          score: entry.score,
          teamCode,
          photos: [`manual-match-${selectedMatch}.jpg`],
          status: 'approved',
          submittedAt: Date.now(),
          reviewedAt: Date.now(),
          reviewedBy: userRole,
          tournamentId: tournament.id,
          matchNumber: selectedMatch,
          isManualEntry: true
        };
        
        onScoreUpdate(teamCode, selectedMatch, scoreData);
      }
    });
    
    alert(`Punteggi partita ${selectedMatch} salvati con successo!`);
  };

  // Delete match score
  const deleteMatchScore = (teamCode: string) => {
    const entry = scoreEntries[teamCode];
    if (entry?.id && confirm(`Confermi l'eliminazione del punteggio per ${teams.find(t => t.code === teamCode)?.name}?`)) {
      onScoreDelete(entry.id);
      
      // Update local state
      setScoreEntries(prev => ({
        ...prev,
        [teamCode]: { kills: 0, position: 0, score: 0 }
      }));
    }
  };

  // Save multipliers
  const saveMultipliers = () => {
    onMultiplierUpdate(editingMultipliers);
    alert('Moltiplicatori salvati con successo!');
  };

  // Calculate final leaderboard
  const calculateLeaderboard = () => {
    const teamScores = teams.map(team => {
      const teamMatches = matches.filter(m => m.teamCode === team.code);
      const totalScore = teamMatches.reduce((sum, match) => sum + (match.score || 0), 0);
      const totalKills = teamMatches.reduce((sum, match) => sum + (match.kills || 0), 0);
      const matchesPlayed = teamMatches.length;
      
      return {
        team,
        totalScore,
        totalKills,
        matchesPlayed,
        averageScore: matchesPlayed > 0 ? (totalScore / matchesPlayed) : 0,
        matches: teamMatches
      };
    });

    return teamScores.sort((a, b) => b.totalScore - a.totalScore);
  };

  // Export leaderboard
  const exportLeaderboard = () => {
    const leaderboard = calculateLeaderboard();
    setShowExportPreview(true);
  };

  if (!isOpen) return null;

  const leaderboard = calculateLeaderboard();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassPanel className="w-full max-w-7xl max-h-[95vh] overflow-y-auto p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white font-mono flex items-center space-x-2">
              <Target className="w-6 h-6 text-ice-blue" />
              <span>ASSEGNAZIONE PUNTEGGI</span>
            </h2>
            <p className="text-ice-blue/80 font-mono mt-1">
              {tournament.name} • Controllo manuale completo per {userRole}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ice-blue/60 hover:text-ice-blue transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6 border-b border-ice-blue/20">
          {[
            { id: 'assign', label: 'ASSEGNA PUNTEGGI', icon: Target },
            { id: 'multipliers', label: 'MOLTIPLICATORI', icon: Calculator },
            { id: 'export', label: 'ESPORTA CLASSIFICA', icon: Download }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 font-mono transition-all ${
                activeTab === tab.id
                  ? 'text-ice-blue border-b-2 border-ice-blue'
                  : 'text-ice-blue/60 hover:text-ice-blue'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ASSIGN SCORES TAB */}
        {activeTab === 'assign' && (
          <div className="space-y-6">
            {/* Match Selection */}
            <div>
              <h3 className="text-lg font-bold text-white font-mono mb-4">SELEZIONA PARTITA</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {Array.from({ length: totalMatches }, (_, i) => i + 1).map(matchNum => {
                  const matchCount = matches.filter(m => 
                    (m.matchNumber === matchNum || (!m.matchNumber && matches.filter(x => x.teamCode === m.teamCode).indexOf(m) === matchNum - 1))
                  ).length;
                  
                  return (
                    <button
                      key={matchNum}
                      onClick={() => setSelectedMatch(matchNum)}
                      className={`p-3 rounded-lg font-mono transition-all relative ${
                        selectedMatch === matchNum
                          ? 'bg-ice-blue/20 text-ice-blue border border-ice-blue/50'
                          : 'bg-black/20 text-ice-blue/60 border border-ice-blue/20 hover:bg-ice-blue/10'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold">MATCH {matchNum}</div>
                        <div className="text-xs mt-1">
                          {matchCount > 0 ? (
                            <span className="text-green-400">{matchCount} punteggi</span>
                          ) : (
                            <span className="text-gray-400">Vuoto</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Score Assignment Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white font-mono">
                  PARTITA {selectedMatch} - ASSEGNAZIONE PUNTEGGI
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={autoAssignPositions}
                    className="flex items-center space-x-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors font-mono text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>AUTO POSIZIONI</span>
                  </button>
                  <button
                    onClick={saveMatchScores}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono text-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>SALVA PARTITA</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ice-blue/20">
                      <th className="text-left p-3 text-ice-blue font-mono">SQUADRA</th>
                      <th className="text-center p-3 text-ice-blue font-mono">KILLS</th>
                      <th className="text-center p-3 text-ice-blue font-mono">POSIZIONE</th>
                      <th className="text-center p-3 text-ice-blue font-mono">MOLTIPLICATORE</th>
                      <th className="text-center p-3 text-ice-blue font-mono">PUNTEGGIO</th>
                      <th className="text-center p-3 text-ice-blue font-mono">AZIONI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team) => {
                      const entry = scoreEntries[team.code] || { kills: 0, position: 0, score: 0 };
                      const multiplier = editingMultipliers[entry.position] || multipliers[entry.position] || 1;

                      return (
                        <tr key={team.code} className="border-b border-ice-blue/10 hover:bg-ice-blue/5">
                          <td className="p-3">
                            <div className="text-white font-mono font-bold">{team.name}</div>
                            <div className="text-ice-blue/60 text-xs font-mono">{team.code}</div>
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={entry.kills}
                              onChange={(e) => updateScoreEntry(team.code, 'kills', parseInt(e.target.value) || 0)}
                              className="w-20 p-2 bg-black/20 border border-ice-blue/30 rounded text-white font-mono text-center"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="1"
                              max={teams.length}
                              value={entry.position}
                              onChange={(e) => updateScoreEntry(team.code, 'position', parseInt(e.target.value) || 1)}
                              className="w-20 p-2 bg-black/20 border border-ice-blue/30 rounded text-white font-mono text-center"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-yellow-400 font-mono font-bold">x{multiplier}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-green-400 font-mono font-bold text-lg">{entry.score}</span>
                          </td>
                          <td className="p-3 text-center">
                            {entry.id && (
                              <button
                                onClick={() => deleteMatchScore(team.code)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MULTIPLIERS TAB */}
        {activeTab === 'multipliers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-mono">CONFIGURAZIONE MOLTIPLICATORI</h3>
              <button
                onClick={saveMultipliers}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono text-sm"
              >
                <Save className="w-4 h-4" />
                <span>SALVA MOLTIPLICATORI</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 20 }, (_, i) => i + 1).map(position => (
                <div key={position} className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg">
                  <div className="text-center mb-2">
                    <div className="text-white font-mono font-bold">{position}° POSTO</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingMultipliers(prev => ({
                        ...prev,
                        [position]: Math.max(0.1, (prev[position] || 1) - 0.1)
                      }))}
                      className="w-8 h-8 bg-red-500/20 border border-red-500/50 text-red-400 rounded flex items-center justify-center hover:bg-red-500/30 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={editingMultipliers[position] || multipliers[position] || 1}
                      onChange={(e) => setEditingMultipliers(prev => ({
                        ...prev,
                        [position]: parseFloat(e.target.value) || 1
                      }))}
                      className="flex-1 p-2 bg-black/20 border border-ice-blue/30 rounded text-white font-mono text-center"
                    />
                    <button
                      onClick={() => setEditingMultipliers(prev => ({
                        ...prev,
                        [position]: Math.min(10, (prev[position] || 1) + 0.1)
                      }))}
                      className="w-8 h-8 bg-green-500/20 border border-green-500/50 text-green-400 rounded flex items-center justify-center hover:bg-green-500/30 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXPORT TAB */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-mono">CLASSIFICA FINALE</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowExportPreview(!showExportPreview)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors font-mono text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>{showExportPreview ? 'NASCONDI' : 'ANTEPRIMA'}</span>
                </button>
                <button
                  onClick={exportLeaderboard}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>ESPORTA</span>
                </button>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ice-blue/20">
                    <th className="text-center p-3 text-ice-blue font-mono">POS</th>
                    <th className="text-left p-3 text-ice-blue font-mono">SQUADRA</th>
                    <th className="text-center p-3 text-ice-blue font-mono">PARTITE</th>
                    <th className="text-center p-3 text-ice-blue font-mono">KILLS TOT</th>
                    <th className="text-center p-3 text-ice-blue font-mono">PUNTI TOT</th>
                    <th className="text-center p-3 text-ice-blue font-mono">MEDIA</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.team.code} className={`border-b border-ice-blue/10 ${
                      index === 0 ? 'bg-yellow-500/20' :
                      index === 1 ? 'bg-gray-300/20' :
                      index === 2 ? 'bg-orange-600/20' :
                      'hover:bg-ice-blue/5'
                    }`}>
                      <td className="p-3 text-center">
                        <span className={`font-mono font-bold text-lg ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-400' :
                          'text-white'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-white font-mono font-bold">{entry.team.name}</div>
                        <div className="text-ice-blue/60 text-xs font-mono">{entry.team.code}</div>
                      </td>
                      <td className="p-3 text-center text-white font-mono">{entry.matchesPlayed}</td>
                      <td className="p-3 text-center text-blue-400 font-mono font-bold">{entry.totalKills}</td>
                      <td className="p-3 text-center text-green-400 font-mono font-bold text-lg">{entry.totalScore}</td>
                      <td className="p-3 text-center text-purple-400 font-mono">{entry.averageScore.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors font-mono"
          >
            CHIUDI
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
