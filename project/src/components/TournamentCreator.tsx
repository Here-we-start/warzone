import React, { useState } from 'react';
import { Plus, Calendar, Users, Settings, Trophy, X } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { Tournament, Manager, AuditLog } from '../types';
import { logAction } from '../utils/auditLogger';

interface TournamentCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLog[];
  setAuditLogs: (logs: AuditLog[] | ((prev: AuditLog[]) => AuditLog[])) => void;
}

export default function TournamentCreator({ 
  isOpen, 
  onClose, 
  auditLogs, 
  setAuditLogs 
}: TournamentCreatorProps) {
  const [tournaments, setTournaments] = useRealTimeData<Record<string, Tournament>>('tournaments', {});
  const [managers] = useRealTimeData<Record<string, Manager>>('managers', {});
  
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentType, setTournamentType] = useState<'Ritorno' | 'BR'>('Ritorno');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [totalMatches, setTotalMatches] = useState(5);
  const [countedMatches, setCountedMatches] = useState(4);
  const [lobbies, setLobbies] = useState(2);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const activeManagers = Object.values(managers).filter(m => m.isActive);

  const createTournament = async () => {
    if (!tournamentName.trim()) return;

    setIsCreating(true);
    
    // Cinematic delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const tournamentId = `tournament-${Date.now()}`;
    const slotsPerLobby = tournamentType === 'Ritorno' ? 15 : 50;

    // Use current date if no date is provided
    const finalStartDate = startDate || new Date().toISOString().split('T')[0];
    const finalStartTime = startTime || '20:00';

    const newTournament: Tournament = {
      id: tournamentId,
      name: tournamentName.trim(),
      type: tournamentType,
      status: 'active',
      startDate: finalStartDate,
      startTime: finalStartTime,
      createdAt: Date.now(),
      createdBy: 'admin',
      assignedManagers: selectedManagers,
      settings: { 
        lobbies, 
        slotsPerLobby, 
        totalMatches, 
        countedMatches 
      }
    };

    setTournaments(prev => ({ ...prev, [tournamentId]: newTournament }));

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'TOURNAMENT_CREATED',
      `Nuovo torneo creato: ${tournamentName.trim()} (${tournamentType}) - ${totalMatches} partite totali, ${countedMatches} contate - Data: ${finalStartDate} ${finalStartTime}`,
      'admin',
      'admin',
      { 
        tournamentId, 
        tournamentName: tournamentName.trim(), 
        type: tournamentType,
        startDate: finalStartDate,
        startTime: finalStartTime,
        totalMatches,
        countedMatches,
        lobbies,
        assignedManagers: selectedManagers 
      }
    );

    // Reset form
    setTournamentName('');
    setStartDate('');
    setStartTime('');
    setTotalMatches(5);
    setCountedMatches(4);
    setLobbies(2);
    setSelectedManagers([]);
    setIsCreating(false);
    onClose();
  };

  const toggleManager = (managerCode: string) => {
    setSelectedManagers(prev => 
      prev.includes(managerCode)
        ? prev.filter(code => code !== managerCode)
        : [...prev, managerCode]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassPanel className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center space-x-2">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-ice-blue" />
            <span>CREA NUOVO TORNEO</span>
          </h2>
          <button
            onClick={onClose}
            className="text-ice-blue/60 hover:text-ice-blue transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Tournament Name */}
          <div>
            <label className="block text-ice-blue mb-2 font-mono text-sm sm:text-base">
              Nome Torneo *
            </label>
            <input
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              placeholder="es. Black Crow Scrim"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white placeholder-ice-blue/60 focus:outline-none focus:border-ice-blue font-mono text-sm sm:text-base"
              disabled={isCreating}
            />
          </div>

          {/* Tournament Type */}
          <div>
            <label className="block text-ice-blue mb-2 font-mono text-sm sm:text-base">
              Tipo Torneo *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTournamentType('Ritorno')}
                disabled={isCreating}
                className={`p-3 sm:p-4 rounded-xl font-mono transition-all duration-300 ${
                  tournamentType === 'Ritorno'
                    ? 'bg-ice-blue/30 border-2 border-ice-blue/70 text-ice-blue'
                    : 'bg-ice-blue/10 border border-ice-blue/30 text-ice-blue/60 hover:bg-ice-blue/20'
                }`}
              >
                <div className="font-bold text-sm sm:text-base">RITORNO</div>
                <div className="text-xs sm:text-sm opacity-80">Lobby multiple • 15 slot</div>
              </button>
              <button
                onClick={() => setTournamentType('BR')}
                disabled={isCreating}
                className={`p-3 sm:p-4 rounded-xl font-mono transition-all duration-300 ${
                  tournamentType === 'BR'
                    ? 'bg-ice-blue/30 border-2 border-ice-blue/70 text-ice-blue'
                    : 'bg-ice-blue/10 border border-ice-blue/30 text-ice-blue/60 hover:bg-ice-blue/20'
                }`}
              >
                <div className="font-bold text-sm sm:text-base">BATTLE ROYALE</div>
                <div className="text-xs sm:text-sm opacity-80">Lobby multiple • 50 slot</div>
              </button>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-ice-blue mb-2 font-mono text-sm sm:text-base">
                Data Inizio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono text-sm sm:text-base"
                disabled={isCreating}
              />
            </div>
            <div>
              <label className="block text-ice-blue mb-2 font-mono text-sm sm:text-base">
                Orario Inizio
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono text-sm sm:text-base"
                disabled={isCreating}
              />
            </div>
          </div>

          {/* Number of Lobbies */}
          <div>
            <label className="block text-ice-blue mb-2 font-mono text-sm sm:text-base">
              Numero di Lobby
            </label>
            <select
              value={lobbies}
              onChange={(e) => setLobbies(Number(e.target.value))}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono text-sm sm:text-base"
              disabled={isCreating}
            >
              <option value={1}>1 Lobby</option>
              <option value={2}>2 Lobby</option>
              <option value={3}>3 Lobby</option>
              <option value={4}>4 Lobby</option>
              <option value={5}>5 Lobby</option>
            </select>
          </div>

          {/* Match Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-ice-blue mb-2 font-mono text-sm sm:text-base">
                Partite Totali
              </label>
              <input
                type="number"
                value={totalMatches}
                onChange={(e) => setTotalMatches(Number(e.target.value))}
                min="1"
                max="10"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono text-sm sm:text-base"
                disabled={isCreating}
              />
            </div>
            <div>
              <label className="block text-ice-blue mb-2 font-mono text-sm sm:text-base">
                Partite Contate
              </label>
              <input
                type="number"
                value={countedMatches}
                onChange={(e) => setCountedMatches(Number(e.target.value))}
                min="1"
                max={totalMatches}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono text-sm sm:text-base"
                disabled={isCreating}
              />
            </div>
          </div>

          {/* Assign Managers */}
          <div>
            <label className="block text-ice-blue mb-2 font-mono text-sm sm:text-base">
              Assegna Gestori
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {activeManagers.length === 0 ? (
                <div className="text-ice-blue/60 text-sm font-mono text-center py-4">
                  Nessun gestore disponibile
                </div>
              ) : (
                activeManagers.map((manager) => (
                  <div
                    key={manager.code}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 ${
                      selectedManagers.includes(manager.code)
                        ? 'bg-ice-blue/20 border-ice-blue/50'
                        : 'bg-black/20 border-ice-blue/20 hover:bg-ice-blue/10'
                    }`}
                    onClick={() => toggleManager(manager.code)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-bold font-mono text-sm">
                          {manager.name}
                        </div>
                        <div className="text-ice-blue/60 text-xs font-mono">
                          {manager.code}
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded border-2 transition-all duration-300 ${
                        selectedManagers.includes(manager.code)
                          ? 'bg-ice-blue border-ice-blue'
                          : 'border-ice-blue/40'
                      }`}>
                        {selectedManagers.includes(manager.code) && (
                          <div className="w-full h-full flex items-center justify-center text-black text-xs">
                            ✓
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tournament Settings Preview */}
          <div className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg">
            <h3 className="text-ice-blue font-mono text-sm mb-3">CONFIGURAZIONE TORNEO:</h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <div className="text-ice-blue/60">Lobby:</div>
                <div className="text-white font-bold">{lobbies}</div>
              </div>
              <div>
                <div className="text-ice-blue/60">Slot per Lobby:</div>
                <div className="text-white font-bold">
                  {tournamentType === 'Ritorno' ? '15' : '50'}
                </div>
              </div>
              <div>
                <div className="text-ice-blue/60">Partite:</div>
                <div className="text-white font-bold">{countedMatches}/{totalMatches}</div>
              </div>
              <div>
                <div className="text-ice-blue/60">Gestori:</div>
                <div className="text-white font-bold">{selectedManagers.length}</div>
              </div>
              <div>
                <div className="text-ice-blue/60">Data:</div>
                <div className="text-white font-bold">{startDate || 'Oggi'}</div>
              </div>
              <div>
                <div className="text-ice-blue/60">Orario:</div>
                <div className="text-white font-bold">{startTime || '20:00'}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isCreating}
              className="flex-1 py-2 sm:py-3 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors font-mono text-sm sm:text-base"
            >
              ANNULLA
            </button>
            <button
              onClick={createTournament}
              disabled={!tournamentName.trim() || isCreating}
              className="flex-1 py-2 sm:py-3 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-mono relative overflow-hidden text-sm sm:text-base"
            >
              {isCreating && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              )}
              <div className="flex items-center justify-center space-x-2">
                <Plus className={`w-4 h-4 ${isCreating ? 'animate-spin' : ''}`} />
                <span>{isCreating ? 'CREAZIONE...' : 'CREA TORNEO'}</span>
              </div>
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}