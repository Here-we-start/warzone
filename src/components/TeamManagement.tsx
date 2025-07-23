import React, { useState } from 'react';
import { Users, Plus, Trash2, Key, Copy, Check, Eye, EyeOff } from 'lucide-react';
import GlassPanel from './GlassPanel';
import TeamCodeDisplay from './TeamCodeDisplay';
import { Team, Tournament, AuditLog } from '../types';
import { generateUniqueTeamCode } from '../utils/teamCodeGenerator';
import { logAction } from '../utils/auditLogger';
import ApiService from '../services/api';

interface TeamManagementProps {
  teams: Record<string, Team>;
  setTeams: (teams: Record<string, Team> | ((prev: Record<string, Team>) => Record<string, Team>)) => void;
  tournaments: Record<string, Tournament>;
  auditLogs: AuditLog[];
  setAuditLogs: (logs: AuditLog[] | ((prev: AuditLog[]) => AuditLog[])) => void;
}

export default function TeamManagement({ 
  teams, 
  setTeams, 
  tournaments, 
  auditLogs, 
  setAuditLogs 
}: TeamManagementProps) {
  const [teamName, setTeamName] = useState('');
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedLobby, setSelectedLobby] = useState('1');
  const [showTeamCode, setShowTeamCode] = useState<{ name: string; code: string } | null>(null);
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const activeTournaments = Object.values(tournaments).filter(t => t.status === 'active');

  const createTeam = async () => {
    if (!teamName.trim() || !selectedTournament) return;

    const tournament = tournaments[selectedTournament];
    if (!tournament) return;

    const code = generateUniqueTeamCode(teams);
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: teamName.trim(),
      code,
      lobby: `Lobby ${selectedLobby}`,
      lobbyNumber: parseInt(selectedLobby),
      createdAt: Date.now(),
      tournamentId: selectedTournament
    };

    console.log('🔍 [TEAM] Creating new team:', {
      name: newTeam.name,
      code: newTeam.code,
      tournamentId: newTeam.tournamentId
    });

    // Usa syncOperation per sincronizzazione robusta
    const syncResult = await ApiService.syncOperation({
      localUpdate: () => {
        setTeams(prev => ({ ...prev, [code]: newTeam }));
        setTeamName('');
        setShowTeamCode({ name: teamName.trim(), code });
        console.log('✅ [TEAM] Local state updated');
      },
      apiCall: () => ApiService.createTeam(newTeam),
      storageKey: 'teams',
      storageData: { ...teams, [code]: newTeam },
      operationName: `Team Creation: ${teamName.trim()}`
    });

    if (syncResult.success) {
      console.log('✅ Team created and synced successfully');
    } else {
      console.warn('⚠️ Team created locally, database sync failed:', syncResult.error);
      console.log('💾 Team salvato localmente, funzionerà ugualmente');
    }

    // Broadcast per sincronizzazione globale
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('warzone-global-sync');
      channel.postMessage({
        type: 'team-created',
        teamId: code,
        team: newTeam,
        tournamentId: selectedTournament
      });
      channel.close();
    }

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'TEAM_REGISTERED',
      `Nuova squadra registrata: ${teamName.trim()} (${code}) per torneo ${tournament.name}`,
      'admin',
      'admin',
      { teamCode: code, teamName: teamName.trim(), tournamentId: selectedTournament, lobby: selectedLobby }
    );
  };

  const deleteTeam = async (teamCode: string) => {
    const team = teams[teamCode];
    if (!team) return;

    if (!confirm(`Sei sicuro di voler eliminare la squadra ${team.name}?`)) return;

    const updatedTeams = { ...teams };
    delete updatedTeams[teamCode];

    // Sincronizza con database
    const syncResult = await ApiService.syncOperation({
      localUpdate: () => {
        setTeams(prev => {
          const newTeams = { ...prev };
          delete newTeams[teamCode];
          return newTeams;
        });
      },
      apiCall: () => ApiService.deleteTeam(team.id),
      storageKey: 'teams',
      storageData: updatedTeams,
      operationName: `Team Deletion: ${team.name}`
    });

    if (!syncResult.success) {
      console.warn('⚠️ Team deleted locally, database sync failed:', syncResult.error);
    }

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'TEAM_REMOVED',
      `Squadra eliminata: ${team.name} (${teamCode})`,
      'admin',
      'admin',
      { teamCode, teamName: team.name, tournamentId: team.tournamentId }
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const toggleShowCode = (teamCode: string) => {
    setShowCodes(prev => ({
      ...prev,
      [teamCode]: !prev[teamCode]
    }));
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const teamsList = Object.values(teams);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Create Team */}
        <GlassPanel className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 font-mono flex items-center space-x-2">
            <Plus className="w-5 h-5 text-ice-blue" />
            <span>REGISTRA NUOVA SQUADRA</span>
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-ice-blue mb-2 font-mono text-sm">Nome Squadra</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Inserisci nome squadra"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white placeholder-ice-blue/60 focus:outline-none focus:border-ice-blue font-mono text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-ice-blue mb-2 font-mono text-sm">Torneo</label>
              <select
                value={selectedTournament}
                onChange={(e) => setSelectedTournament(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono text-sm sm:text-base"
              >
                <option value="">-- Seleziona torneo --</option>
                {activeTournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name} ({tournament.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-ice-blue mb-2 font-mono text-sm">Lobby</label>
              <select
                value={selectedLobby}
                onChange={(e) => setSelectedLobby(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono text-sm sm:text-base"
              >
                {selectedTournament && tournaments[selectedTournament] && 
                  Array.from({ length: tournaments[selectedTournament].settings.lobbies }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num.toString()}>Lobby {num}</option>
                  ))
                }
              </select>
            </div>

            <div className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg">
              <h3 className="text-ice-blue font-mono text-sm mb-2">CODICE GENERATO AUTOMATICAMENTE:</h3>
              <div className="space-y-1 text-xs text-ice-blue/80 font-mono">
                <div>• Formato: ABC-123 (3 lettere + 3 numeri)</div>
                <div>• Unico per ogni squadra</div>
                <div>• Valido per tutto il torneo</div>
                <div>• Necessario per accesso squadra</div>
              </div>
            </div>

            <button
              onClick={createTeam}
              disabled={!teamName.trim() || !selectedTournament}
              className="w-full py-2 sm:py-3 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-mono text-sm sm:text-base"
            >
              REGISTRA SQUADRA
            </button>
          </div>
        </GlassPanel>

        {/* Teams List */}
        <GlassPanel className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 font-mono flex items-center space-x-2">
            <Users className="w-5 h-5 text-ice-blue" />
            <span>SQUADRE REGISTRATE ({teamsList.length})</span>
          </h2>
          
          <div className="space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
            {teamsList.map((team) => {
              const tournament = tournaments[team.tournamentId];
              return (
                <div
                  key={team.code}
                  className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg transition-all duration-300 animate-fade-in hover:bg-ice-blue/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-white font-bold font-mono">{team.name}</div>
                        <div className="text-ice-blue/60 text-sm font-mono">
                          {tournament?.name || 'Torneo sconosciuto'} • {team.lobby}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleShowCode(team.code)}
                        className="p-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                        title={showCodes[team.code] ? 'Nascondi codice' : 'Mostra codice'}
                      >
                        {showCodes[team.code] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteTeam(team.code)}
                        className="p-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        title="Elimina squadra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {showCodes[team.code] && (
                    <div className="mt-3 p-3 bg-black/30 border border-green-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-green-400 font-mono text-sm mb-1">CODICE ACCESSO:</div>
                          <div className="text-white font-bold font-mono text-lg tracking-wider">
                            {team.code}
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(team.code)}
                          className="flex items-center space-x-1 px-3 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-sm font-mono hover:bg-green-500/30 transition-colors"
                        >
                          {copied === team.code ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>COPIATO!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>COPIA</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-ice-blue/60 text-xs font-mono mt-2">
                    Registrata il {formatTime(team.createdAt)}
                  </div>
                </div>
              );
            })}
            
            {teamsList.length === 0 && (
              <div className="text-center text-ice-blue/60 font-mono py-8">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nessuna squadra registrata</p>
                <p className="text-xs mt-2">Registra la prima squadra per iniziare</p>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Team Code Display Modal */}
      {showTeamCode && (
        <TeamCodeDisplay
          teamName={showTeamCode.name}
          teamCode={showTeamCode.code}
          onClose={() => setShowTeamCode(null)}
        />
      )}
    </>
  );
}