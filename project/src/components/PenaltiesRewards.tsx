import React, { useState } from 'react';
import { Plus, Minus, AlertTriangle, Award, History, X } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { Team, ScoreAdjustment } from '../types';

interface PenaltiesRewardsProps {
  teams: Team[];
  adjustments: ScoreAdjustment[];
  onAddAdjustment: (adjustment: Omit<ScoreAdjustment, 'id' | 'appliedAt' | 'appliedBy' | 'tournamentId'>) => void;
  currentSection: string;
}

export default function PenaltiesRewards({ 
  teams, 
  adjustments, 
  onAddAdjustment, 
  currentSection 
}: PenaltiesRewardsProps) {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'penalty' | 'reward' | null>(null);
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = () => {
    if (!selectedTeam || !adjustmentType || points <= 0 || !reason.trim()) return;

    const team = teams.find(t => t.code === selectedTeam);
    if (!team) return;

    const adjustmentPoints = adjustmentType === 'penalty' ? -points : points;

    onAddAdjustment({
      teamCode: selectedTeam,
      teamName: team.name,
      points: adjustmentPoints,
      reason: reason.trim(),
      type: adjustmentType
    });

    // Reset form
    setSelectedTeam('');
    setAdjustmentType(null);
    setPoints(0);
    setReason('');
  };

  const getTeamAdjustments = (teamCode: string) => {
    return adjustments.filter(adj => adj.teamCode === teamCode);
  };

  const getTeamAdjustmentTotal = (teamCode: string) => {
    return getTeamAdjustments(teamCode).reduce((sum, adj) => sum + adj.points, 0);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <Award className="w-5 h-5 text-green-400" />
            </div>
            <span>PENALITÀ E RICOMPENSE</span>
          </h3>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-mono text-sm"
          >
            <History className="w-4 h-4" />
            <span>CRONOLOGIA ({adjustments.length})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Adjustment Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-ice-blue mb-2 font-mono">Seleziona Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono"
              >
                <option value="">-- Scegli una squadra --</option>
                {teams.map((team) => (
                  <option key={team.code} value={team.code}>
                    {team.name} ({team.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setAdjustmentType('penalty')}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-mono transition-all duration-300 ${
                  adjustmentType === 'penalty'
                    ? 'bg-red-500/30 border-2 border-red-500/70 text-red-300'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                }`}
              >
                <Minus className="w-4 h-4" />
                <span>PENALITÀ</span>
              </button>
              <button
                onClick={() => setAdjustmentType('reward')}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-mono transition-all duration-300 ${
                  adjustmentType === 'reward'
                    ? 'bg-green-500/30 border-2 border-green-500/70 text-green-300'
                    : 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>RICOMPENSA</span>
              </button>
            </div>

            <div>
              <label className="block text-ice-blue mb-2 font-mono">Punti</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Math.max(0, Number(e.target.value)))}
                min="0"
                step="0.1"
                placeholder="Inserisci punti"
                className="w-full px-4 py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white placeholder-ice-blue/60 focus:outline-none focus:border-ice-blue font-mono"
              />
            </div>

            <div>
              <label className="block text-ice-blue mb-2 font-mono">Motivo</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Es. Fair play, Uso arma vietata, etc."
                className="w-full px-4 py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white placeholder-ice-blue/60 focus:outline-none focus:border-ice-blue font-mono"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selectedTeam || !adjustmentType || points <= 0 || !reason.trim()}
              className="w-full py-3 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-mono"
            >
              APPLICA {adjustmentType === 'penalty' ? 'PENALITÀ' : 'RICOMPENSA'}
            </button>
          </div>

          {/* Team Adjustments Summary */}
          <div className="space-y-4">
            <h4 className="text-white font-bold font-mono">RIEPILOGO MODIFICHE</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {teams.map((team) => {
                const teamAdjustments = getTeamAdjustments(team.code);
                const total = getTeamAdjustmentTotal(team.code);
                
                if (teamAdjustments.length === 0) return null;

                return (
                  <div key={team.code} className="p-3 bg-black/20 border border-ice-blue/20 rounded-lg animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-white font-bold font-mono">{team.name}</div>
                      <div className={`font-mono font-bold ${
                        total > 0 ? 'text-green-400' : total < 0 ? 'text-red-400' : 'text-ice-blue'
                      }`}>
                        {total > 0 ? '+' : ''}{total.toFixed(1)} pt
                      </div>
                    </div>
                    <div className="text-xs text-ice-blue/60 font-mono">
                      {teamAdjustments.length} modifica{teamAdjustments.length !== 1 ? 'he' : ''}
                    </div>
                  </div>
                );
              })}
              
              {adjustments.length === 0 && (
                <div className="text-center text-ice-blue/60 font-mono py-8">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nessuna modifica applicata</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
                  <History className="w-5 h-5 text-ice-blue" />
                  <span>CRONOLOGIA MODIFICHE - {currentSection.toUpperCase()}</span>
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-ice-blue/60 hover:text-ice-blue transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {adjustments
                  .sort((a, b) => b.appliedAt - a.appliedAt)
                  .map((adjustment) => (
                    <div
                      key={adjustment.id}
                      className={`p-4 rounded-lg border animate-fade-in ${
                        adjustment.type === 'penalty'
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-green-500/10 border-green-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            adjustment.type === 'penalty'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {adjustment.type === 'penalty' ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-white font-bold font-mono">{adjustment.teamName}</div>
                            <div className="text-ice-blue/60 text-sm font-mono">{adjustment.teamCode}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono font-bold text-lg ${
                            adjustment.type === 'penalty' ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {adjustment.points > 0 ? '+' : ''}{adjustment.points.toFixed(1)} pt
                          </div>
                          <div className="text-ice-blue/60 text-xs font-mono">
                            {formatTime(adjustment.appliedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-ice-blue/80 font-mono text-sm bg-black/20 rounded p-2">
                        "{adjustment.reason}"
                      </div>
                    </div>
                  ))}

                {adjustments.length === 0 && (
                  <div className="text-center text-ice-blue/60 font-mono py-12">
                    <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Nessuna modifica nella cronologia</p>
                    <p className="text-sm">Le penalità e ricompense applicate appariranno qui</p>
                  </div>
                )}
              </div>
            </GlassPanel>
          </div>
        </div>
      )}
    </>
  );
}