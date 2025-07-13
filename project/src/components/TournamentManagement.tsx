import React, { useState } from 'react';
import { Users, Trophy, Settings, Download, Image, RotateCcw, Sliders, Clock, AlertTriangle, X, UserPlus, CheckCircle, XCircle, Plus, Minus } from 'lucide-react';
import GlassPanel from './GlassPanel';
import MultiplierSettings from './MultiplierSettings';
import PendingSubmissions from './PendingSubmissions';
import ManualSubmission from './ManualSubmission';
import TeamCodeDisplay from './TeamCodeDisplay';
import PenaltiesRewards from './PenaltiesRewards';
import { Team, Match, PendingSubmission, ScoreAdjustment, Manager, AuditLog, Tournament, TeamStats } from '../types';
import { generateUniqueTeamCode } from '../utils/teamCodeGenerator';
import { logAction } from '../utils/auditLogger';
import html2canvas from 'html2canvas';

interface TournamentManagementProps {
  tournamentId: string;
  onClose: () => void;
  tournaments: Record<string, Tournament>;
  setTournaments: (tournaments: Record<string, Tournament> | ((prev: Record<string, Tournament>) => Record<string, Tournament>)) => void;
  teams: Record<string, Team>;
  setTeams: (teams: Record<string, Team> | ((prev: Record<string, Team>) => Record<string, Team>)) => void;
  matches: Match[];
  setMatches: (matches: Match[] | ((prev: Match[]) => Match[])) => void;
  pendingSubmissions: PendingSubmission[];
  setPendingSubmissions: (submissions: PendingSubmission[] | ((prev: PendingSubmission[]) => PendingSubmission[])) => void;
  scoreAdjustments: ScoreAdjustment[];
  setScoreAdjustments: (adjustments: ScoreAdjustment[] | ((prev: ScoreAdjustment[]) => ScoreAdjustment[])) => void;
  managers: Record<string, Manager>;
  setManagers: (managers: Record<string, Manager> | ((prev: Record<string, Manager>) => Record<string, Manager>)) => void;
  auditLogs: AuditLog[];
  setAuditLogs: (logs: AuditLog[] | ((prev: AuditLog[]) => AuditLog[])) => void;
  multipliers: Record<number, number>;
}

export default function TournamentManagement({
  tournamentId,
  onClose,
  tournaments,
  setTournaments,
  teams,
  setTeams,
  matches,
  setMatches,
  pendingSubmissions,
  setPendingSubmissions,
  scoreAdjustments,
  setScoreAdjustments,
  managers,
  setManagers,
  auditLogs,
  setAuditLogs,
  multipliers
}: TournamentManagementProps) {
  const [activeSection, setActiveSection] = useState<'teams' | 'scores' | 'pending' | 'adjustments' | 'managers' | 'audit'>('teams');
  const [showMultiplierSettings, setShowMultiplierSettings] = useState(false);
  const [showTeamCode, setShowTeamCode] = useState<{ name: string; code: string } | null>(null);
  const [showManualSubmission, setShowManualSubmission] = useState(false);
  
  const [selectedLobby, setSelectedLobby] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [teamName, setTeamName] = useState('');

  const tournament = tournaments[tournamentId];
  if (!tournament) return null;

  const tournamentTeams = Object.values(teams).filter(team => team.tournamentId === tournamentId);
  const tournamentMatches = matches.filter(match => match.tournamentId === tournamentId);
  const tournamentPending = pendingSubmissions.filter(sub => sub.tournamentId === tournamentId);
  const tournamentAdjustments = scoreAdjustments.filter(adj => adj.tournamentId === tournamentId);
  const activeManagers = Object.values(managers).filter(m => m.isActive);
  
  // Raggruppa le submission pendenti per team
  const pendingByTeam = tournamentPending.reduce((acc, submission) => {
    if (!acc[submission.teamCode]) {
      acc[submission.teamCode] = [];
    }
    acc[submission.teamCode].push(submission);
    return acc;
  }, {} as Record<string, PendingSubmission[]>);

  // Conta i team con submission pendenti
  const teamsWithPendingCount = Object.keys(pendingByTeam).length;

  const getTeamKey = (lobby: number, slot: number) => {
    return tournament.type === 'Ritorno' 
      ? `${tournamentId}-Lobby${lobby}-Slot${slot}`
      : `${tournamentId}-Slot${slot}`;
  };

  const getLeaderboard = (): TeamStats[] => {
    const teamStats: Record<string, TeamStats> = {};

    // Initialize team stats
    tournamentTeams.forEach(team => {
      teamStats[team.code] = {
        teamName: team.name,
        teamCode: team.code,
        matches: [],
        adjustments: [],
        totalScore: 0,
        adjustmentTotal: 0,
        finalScore: 0,
        rank: 0
      };
    });

    // Add matches
    tournamentMatches.filter(match => match.status === 'approved').forEach(match => {
      if (teamStats[match.teamCode]) {
        teamStats[match.teamCode].matches.push(match);
      }
    });

    // Add adjustments
    tournamentAdjustments.forEach(adjustment => {
      if (teamStats[adjustment.teamCode]) {
        teamStats[adjustment.teamCode].adjustments.push(adjustment);
      }
    });

    // Calculate scores
    Object.values(teamStats).forEach(team => {
      // Calculate match scores (best counted matches)
      const countedMatches = tournament.settings.countedMatches || 3;
      const sortedScores = team.matches
        .map(match => match.score)
        .sort((a, b) => b - a)
        .slice(0, countedMatches);
      team.totalScore = sortedScores.reduce((sum, score) => sum + score, 0);

      // Calculate adjustment total
      team.adjustmentTotal = team.adjustments.reduce((sum, adj) => sum + adj.points, 0);

      // Calculate final score
      team.finalScore = team.totalScore + team.adjustmentTotal;
    });

    // Sort by final score and assign ranks
    const sorted = Object.values(teamStats)
      .filter(team => team.matches.length > 0 || team.adjustments.length > 0)
      .sort((a, b) => b.finalScore - a.finalScore);

    sorted.forEach((team, index) => {
      team.rank = index + 1;
    });

    return sorted;
  };

  const registerTeam = () => {
    if (!teamName.trim()) return;
    
    // Check if team already exists in this slot
    const existingTeam = Object.values(teams).find(t => 
      t.tournamentId === tournamentId && 
      t.lobbyNumber === selectedLobby && 
      t.lobby === getTeamKey(selectedLobby, selectedSlot)
    );
    
    if (existingTeam) {
      if (!confirm(`Slot già occupato da "${existingTeam.name}". Vuoi sovrascrivere?`)) {
        return;
      }
      
      // Remove existing team first
      removeTeam(existingTeam.id);
    }
    
    const key = getTeamKey(selectedLobby, selectedSlot);
    const code = generateUniqueTeamCode(teams);
    
    const newTeam: Team = {
      id: key,
      name: teamName.trim(),
      code,
      lobby: key,
      lobbyNumber: tournament.type === 'Ritorno' ? selectedLobby : undefined,
      createdAt: Date.now(),
      tournamentId
    };

    setTeams(prev => ({ ...prev, [key]: newTeam }));
    setTeamName('');
    
    // Broadcast team creation for real-time updates
    if ('BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('warzone-global-sync');
        channel.postMessage({
          type: 'team-created',
          teamId: key,
          team: newTeam,
          timestamp: Date.now()
        });
        channel.close();
      } catch (error) {
        console.warn('Team broadcast failed:', error);
      }
    }
    
    // Show the generated code
    setShowTeamCode({ name: teamName.trim(), code });

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'TEAM_REGISTERED',
      `Squadra registrata: ${teamName.trim()} (${code}) in ${key}`,
      'admin',
      'admin',
      { teamCode: code, teamName: teamName.trim(), tournamentId, lobby: key }
    );
  };

  const removeTeam = (teamId: string) => {
    const team = teams[teamId];
    if (!team) return;

    if (!confirm(`Sei sicuro di voler rimuovere la squadra ${team.name}?`)) return;

    // Remove team
    setTeams(prev => {
      const newTeams = { ...prev };
      delete newTeams[teamId];
      return newTeams;
    });

    // Remove team matches
    setMatches(prev => prev.filter(match => match.teamCode !== team.code));

    // Remove team pending submissions
    setPendingSubmissions(prev => prev.filter(sub => sub.teamCode !== team.code));

    // Remove team adjustments
    setScoreAdjustments(prev => prev.filter(adj => adj.teamCode !== team.code));

    logAction(
      auditLogs,
      setAuditLogs,
      'TEAM_REMOVED',
      `Squadra rimossa: ${team.name} (${team.code})`,
      'admin',
      'admin',
      { teamCode: team.code, teamName: team.name, tournamentId }
    );
  };

  const approveSubmission = (submissionId: string) => {
    const submission = pendingSubmissions.find(s => s.id === submissionId);
    if (!submission) return;

    const multiplier = multipliers[submission.position] || 1;
    const score = submission.kills * multiplier;

    const newMatch: Match = {
      id: `${submission.teamCode}-${Date.now()}`,
      position: submission.position,
      kills: submission.kills,
      score,
      teamCode: submission.teamCode,
      photos: submission.photos,
      status: 'approved',
      submittedAt: submission.submittedAt,
      reviewedAt: Date.now(),
      reviewedBy: 'admin',
      tournamentId
    };

    setMatches(prev => [...prev, newMatch]);
    setPendingSubmissions(prev => prev.filter(s => s.id !== submissionId));

    logAction(
      auditLogs,
      setAuditLogs,
      'SUBMISSION_APPROVED',
      `Sottomissione approvata per ${submission.teamName}: ${submission.position}° posto, ${submission.kills} kills`,
      'admin',
      'admin',
      { teamCode: submission.teamCode, submissionId, tournamentId }
    );
  };

  const rejectSubmission = (submissionId: string) => {
    const submission = pendingSubmissions.find(s => s.id === submissionId);
    if (!submission) return;

    setPendingSubmissions(prev => prev.filter(s => s.id !== submissionId));

    logAction(
      auditLogs,
      setAuditLogs,
      'SUBMISSION_REJECTED',
      `Sottomissione rifiutata per ${submission.teamName}`,
      'admin',
      'admin',
      { teamCode: submission.teamCode, submissionId, tournamentId }
    );
  };

  const handleManualSubmission = async (submission: Omit<PendingSubmission, 'id' | 'submittedAt'>) => {
    const newSubmission: PendingSubmission = {
      ...submission,
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      submittedAt: Date.now()
    };

    setPendingSubmissions(prev => [...prev, newSubmission]);

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'MANUAL_SUBMISSION',
      `Inserimento manuale per ${submission.teamName}: ${submission.position}° posto, ${submission.kills} kills`,
      'admin',
      'admin',
      { teamCode: submission.teamCode, tournamentId: submission.tournamentId }
    );
  };

  const addScoreAdjustment = (adjustmentData: Omit<ScoreAdjustment, 'id' | 'appliedAt' | 'appliedBy' | 'tournamentId'>) => {
    const newAdjustment: ScoreAdjustment = {
      ...adjustmentData,
      id: `adj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      appliedAt: Date.now(),
      appliedBy: 'admin',
      tournamentId
    };

    setScoreAdjustments(prev => [...prev, newAdjustment]);

    logAction(
      auditLogs,
      setAuditLogs,
      'SCORE_ADJUSTMENT',
      `${adjustmentData.type === 'penalty' ? 'Penalità' : 'Ricompensa'} applicata a ${adjustmentData.teamName}: ${adjustmentData.points > 0 ? '+' : ''}${adjustmentData.points} punti - ${adjustmentData.reason}`,
      'admin',
      'admin',
      { teamCode: adjustmentData.teamCode, type: adjustmentData.type, points: adjustmentData.points, tournamentId }
    );
  };

  const assignManager = (managerCode: string) => {
    const manager = managers[managerCode];
    if (!manager || tournament.assignedManagers.includes(managerCode)) return;

    setTournaments(prev => ({
      ...prev,
      [tournamentId]: {
        ...tournament,
        assignedManagers: [...tournament.assignedManagers, managerCode]
      }
    }));

    logAction(
      auditLogs,
      setAuditLogs,
      'MANAGER_ASSIGNED',
      `Gestore ${manager.name} assegnato al torneo ${tournament.name}`,
      'admin',
      'admin',
      { managerCode, managerName: manager.name, tournamentId }
    );
  };

  const removeManager = (managerCode: string) => {
    const manager = managers[managerCode];
    if (!manager) return;

    setTournaments(prev => ({
      ...prev,
      [tournamentId]: {
        ...tournament,
        assignedManagers: tournament.assignedManagers.filter(code => code !== managerCode)
      }
    }));

    logAction(
      auditLogs,
      setAuditLogs,
      'MANAGER_REMOVED',
      `Gestore ${manager.name} rimosso dal torneo ${tournament.name}`,
      'admin',
      'admin',
      { managerCode, managerName: manager.name, tournamentId }
    );
  };

const completeTournament = () => {
  if (!confirm(`⚠️ ATTENZIONE! Sei sicuro di voler TERMINARE DEFINITIVAMENTE il torneo "${tournament.name}"?\n\nQuesta azione:\n- Terminerà il torneo e lo rimuoverà dai tornei attivi\n- Eliminerà tutte le squadre e le loro sessioni di login\n- Salverà una copia nell'archivio solo per consultazione\n- I team non potranno più accedere o inviare punteggi\n\nQuesta azione NON PUÒ essere annullata!`)) return;

  try {
    console.log('🏁 Terminando torneo completamente:', tournamentId);

    // 1. Calcola la classifica finale prima di terminare
    const finalLeaderboard = getLeaderboard();

    // 2. Crea una copia archiviata del torneo con tutti i dati per consultazione
    const archivedTournament = {
      ...tournament,
      status: 'archived',
      endedAt: Date.now(),
      completedAt: Date.now(),
      finalLeaderboard,
      // Salva snapshot dei dati al momento della terminazione
      archivedData: {
        teams: Object.values(teams).filter(team => team.tournamentId === tournamentId),
        matches: matches.filter(match => match.tournamentId === tournamentId && match.status === 'approved'),
        adjustments: scoreAdjustments.filter(adj => adj.tournamentId === tournamentId),
        totalTeams: Object.values(teams).filter(team => team.tournamentId === tournamentId).length,
        totalMatches: matches.filter(match => match.tournamentId === tournamentId && match.status === 'approved').length
      }
    };

    // 3. Salva nell'archivio
    setTournaments(prev => ({
      ...prev,
      [tournamentId]: archivedTournament
    }));

    // 4. ELIMINA COMPLETAMENTE tutti i dati operativi del torneo

    // Elimina tutte le squadre del torneo (questo termina le loro sessioni)
    const tournamentTeamIds = Object.values(teams)
      .filter(team => team.tournamentId === tournamentId)
      .map(team => team.id);

    setTeams(prev => {
      const newTeams = { ...prev };
      tournamentTeamIds.forEach(teamId => {
        delete newTeams[teamId];
      });
      return newTeams;
    });

    // Elimina tutte le partite operative
    setMatches(prev => prev.filter(match => match.tournamentId !== tournamentId));

    // Elimina tutte le submission pendenti
    setPendingSubmissions(prev => prev.filter(sub => sub.tournamentId !== tournamentId));

    // Elimina tutti gli aggiustamenti operativi
    setScoreAdjustments(prev => prev.filter(adj => adj.tournamentId !== tournamentId));

    // 5. Log dell'eliminazione completa
    logAction(
      auditLogs,
      setAuditLogs,
      'TOURNAMENT_TERMINATED',
      `Torneo terminato definitivamente: ${tournament.name} - ${finalLeaderboard.length} squadre, ${matches.filter(m => m.tournamentId === tournamentId && m.status === 'approved').length} partite. Salvato in archivio per consultazione.`,
      'admin',
      'admin',
      { 
        tournamentId, 
        tournamentName: tournament.name,
        finalTeams: finalLeaderboard.length,
        finalMatches: matches.filter(m => m.tournamentId === tournamentId && m.status === 'approved').length
      }
    );

    // 6. Broadcast per terminare tutte le sessioni attive
    if ('BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('warzone-global-sync');
        channel.postMessage({
          type: 'tournament-terminated',
          tournamentId: tournamentId,
          message: `Il torneo "${tournament.name}" è stato terminato. Tutte le sessioni sono state chiuse.`,
          timestamp: Date.now()
        });
        channel.close();
      } catch (error) {
        console.warn('Tournament termination broadcast failed:', error);
      }
    }

    // 7. Chiudi il modal
    onClose();

    console.log('✅ Torneo terminato completamente e archiviato');
    alert(`✅ Torneo "${tournament.name}" terminato con successo!\n\n📊 Classifica finale salvata con ${finalLeaderboard.length} squadre.\n📁 Disponibile per consultazione nella sezione Archivio.`);

  } catch (error) {
    console.error('❌ Errore durante la terminazione:', error);
    alert('❌ Errore durante la terminazione del torneo');
  }
};
  const exportCSV = () => {
    const leaderboard = getLeaderboard();
    let csv = 'Rank,Team,Code,Match Score,Adjustments,Final Score,Matches Played\n';
    
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

    logAction(
      auditLogs,
      setAuditLogs,
      'EXPORT_CSV',
      `Classifica esportata in CSV per torneo ${tournament.name}`,
      'admin',
      'admin',
      { tournamentId, format: 'CSV' }
    );
  };

  const exportImage = async () => {
    const element = document.getElementById('tournament-leaderboard');
    if (!element) return;

    try {
      const canvas = await html2canvas(element);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tournament.name.toLowerCase().replace(/\s+/g, '_')}_leaderboard.png`;
      a.click();

      logAction(
        auditLogs,
        setAuditLogs,
        'EXPORT_IMAGE',
        `Classifica esportata come immagine per torneo ${tournament.name}`,
        'admin',
        'admin',
        { tournamentId, format: 'PNG' }
      );
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const leaderboard = getLeaderboard();

  const sectionItems = [
    { id: 'teams', label: 'SQUADRE', icon: Users },
    { id: 'pending', label: 'APPROVAZIONI', icon: Clock, badge: teamsWithPendingCount, count: tournamentPending.length },
    { id: 'adjustments', label: 'MODIFICHE', icon: AlertTriangle },
    { id: 'managers', label: 'GESTORI', icon: UserPlus },
    { id: 'scores', label: 'CLASSIFICA', icon: Trophy }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <GlassPanel className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-ice-blue/20 to-ice-blue-dark/20 relative">
                <Trophy className="w-6 h-6 text-ice-blue" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white font-mono">
                  {tournament.name}
                </h2>
                <p className="text-ice-blue/80 font-mono text-sm">
                  {tournament.type} • {tournament.status === 'active' ? 'ATTIVO' : 'COMPLETATO'}
                  {tournament.isDemo && ' • DEMO'}
                  {tournament.startDate && ` • ${tournament.startDate} ${tournament.startTime}`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {tournament.status === 'active' && (
                <button
                  onClick={completeTournament}
                  className="px-4 py-2 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors font-mono text-sm"
                >
                  TERMINA TORNEO
                </button>
              )}
              <button
                onClick={onClose}
                className="text-ice-blue/60 hover:text-ice-blue transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="flex space-x-4 mb-6 overflow-x-auto">
            {sectionItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-mono transition-all duration-300 relative whitespace-nowrap ${
                  activeSection === item.id
                    ? 'bg-ice-blue/20 text-ice-blue border border-ice-blue/50'
                    : 'text-ice-blue/60 hover:text-ice-blue hover:bg-ice-blue/10'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label} {item.count ? `(${item.count})` : ''}</span>
                {item.badge && item.badge > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {item.badge}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Teams Section */}
          {activeSection === 'teams' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-4 font-mono">REGISTRAZIONE SQUADRE</h3>
                
                <div className="space-y-4">
                  {tournament.type === 'Ritorno' && (
                    <div>
                      <label className="block text-ice-blue mb-2 font-mono text-sm">Lobby</label>
                      <select
                        value={selectedLobby}
                        onChange={(e) => setSelectedLobby(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono"
                      >
                        {Array.from({ length: tournament.settings.lobbies }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>Lobby {num}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-ice-blue mb-2 font-mono text-sm">Slot</label>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono"
                    >
                      {Array.from({ length: tournament.settings.slotsPerLobby }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>Slot {num}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-ice-blue mb-2 font-mono text-sm">Nome Squadra</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Inserisci nome squadra"
                      className="w-full px-4 py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white placeholder-ice-blue/60 focus:outline-none focus:border-ice-blue font-mono"
                    />
                  </div>

                  <button
                    onClick={registerTeam}
                    disabled={!teamName.trim()}
                    className="w-full py-3 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-mono"
                  >
                    REGISTRA SQUADRA
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4 font-mono">
                  SQUADRE REGISTRATE ({tournamentTeams.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tournamentTeams.map((team) => (
                    <div key={team.id} className="p-3 bg-black/20 border border-ice-blue/20 rounded-lg animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-ice-blue font-mono text-sm">{team.lobby}</div>
                          <div className="text-white font-bold">{team.name}</div>
                          <div className="text-ice-blue/60 font-mono text-xs">Team ID: ********</div>
                        </div>
                        <button
                          onClick={() => removeTeam(team.id)}
                          className="p-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pending Submissions Section */}
          {activeSection === 'pending' && (
            <PendingSubmissions
              isAdmin={true}
              submissions={tournamentPending}
              onApprove={approveSubmission}
              onReject={rejectSubmission}
              onManualSubmit={() => setShowManualSubmission(true)}
            />
          )}

          {/* Adjustments Section */}
          {activeSection === 'adjustments' && (
            <PenaltiesRewards
              teams={tournamentTeams}
              adjustments={tournamentAdjustments}
              onAddAdjustment={addScoreAdjustment}
              currentSection={tournament.type}
            />
          )}

          {/* Managers Section */}
          {activeSection === 'managers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 font-mono">GESTORI DISPONIBILI</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activeManagers.filter(m => !tournament.assignedManagers.includes(m.code)).map((manager) => (
                      <div key={manager.code} className="p-3 bg-black/20 border border-ice-blue/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-bold font-mono">{manager.name}</div>
                            <div className="text-ice-blue/60 text-sm font-mono">{manager.code}</div>
                          </div>
                          <button
                            onClick={() => assignManager(manager.code)}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-sm font-mono hover:bg-green-500/30 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>ASSEGNA</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {activeManagers.filter(m => !tournament.assignedManagers.includes(m.code)).length === 0 && (
                      <div className="text-center text-ice-blue/60 font-mono py-4">
                        <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Nessun gestore disponibile</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-4 font-mono">
                    GESTORI ASSEGNATI ({tournament.assignedManagers.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tournament.assignedManagers.map((managerCode) => {
                      const manager = managers[managerCode];
                      if (!manager) return null;
                      
                      return (
                        <div key={managerCode} className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-white font-bold font-mono">{manager.name}</div>
                              <div className="text-green-400/60 text-sm font-mono">{manager.code}</div>
                            </div>
                            <button
                              onClick={() => removeManager(managerCode)}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 border border-red-500/50 text-red-400 rounded text-sm font-mono hover:bg-red-500/30 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                              <span>RIMUOVI</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scores/Leaderboard Section */}
          {activeSection === 'scores' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white font-mono">CLASSIFICA TORNEO</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={exportCSV}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>ESPORTA CSV</span>
                  </button>
                  <button
                    onClick={exportImage}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-mono text-sm"
                  >
                    <Image className="w-4 h-4" />
                    <span>ESPORTA IMMAGINE</span>
                  </button>
                </div>
              </div>

              {/* Tournament Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-ice-blue font-mono">{tournamentTeams.length}</div>
                  <div className="text-ice-blue/60 font-mono text-sm">SQUADRE</div>
                </div>
                <div className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-ice-blue font-mono">{tournamentMatches.filter(m => m.status === 'approved').length}</div>
                  <div className="text-ice-blue/60 font-mono text-sm">PARTITE</div>
                </div>
                <div className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-400 font-mono">{tournamentPending.length}</div>
                  <div className="text-ice-blue/60 font-mono text-sm">IN ATTESA</div>
                </div>
                <div className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-400 font-mono">{tournamentAdjustments.length}</div>
                  <div className="text-ice-blue/60 font-mono text-sm">MODIFICHE</div>
                </div>
              </div>

              <div id="tournament-leaderboard" className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ice-blue/30">
                      <th className="text-left py-3 px-4 text-ice-blue font-mono text-sm">RANK</th>
                      <th className="text-left py-3 px-4 text-ice-blue font-mono text-sm">SQUADRA</th>
                      <th className="text-left py-3 px-4 text-ice-blue font-mono text-sm">CODICE</th>
                      <th className="text-right py-3 px-4 text-ice-blue font-mono text-sm">PUNTEGGIO</th>
                      <th className="text-right py-3 px-4 text-ice-blue font-mono text-sm">MODIFICHE</th>
                      <th className="text-right py-3 px-4 text-ice-blue font-mono text-sm">TOTALE</th>
                      <th className="text-right py-3 px-4 text-ice-blue font-mono text-sm">PARTITE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((team, index) => (
                      <tr 
                        key={team.teamCode}
                        className={`border-b border-ice-blue/10 hover:bg-ice-blue/5 transition-all duration-300 animate-fade-in ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400/10 to-transparent' :
                          index === 2 ? 'bg-gradient-to-r from-orange-600/10 to-transparent' : ''
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <td className="py-3 px-4">
                          <div className={`flex items-center space-x-2 ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-300' :
                            index === 2 ? 'text-orange-400' : 'text-white'
                          }`}>
                            <span className="font-bold font-mono">#{team.rank}</span>
                            {index < 3 && <Trophy className="w-4 h-4 animate-pulse" />}
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
                        <td className="py-3 px-4 text-right text-ice-blue/60 font-mono">
                          {team.matches.length}/{tournament.settings.totalMatches}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Manual Submission Modal */}
      <ManualSubmission
        isOpen={showManualSubmission}
        onClose={() => setShowManualSubmission(false)}
        teams={tournamentTeams}
        tournament={tournament}
        onSubmit={handleManualSubmission}
        submitterName="Admin"
        submitterType="admin"
      />

      {showTeamCode && (
        <TeamCodeDisplay
          teamName={showTeamCode.name}
          teamCode={showTeamCode.code}
          onClose={() => setShowTeamCode(null)}
        />
      )}
    </div>
  );
}
