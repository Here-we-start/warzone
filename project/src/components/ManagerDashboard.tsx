import React, { useState } from 'react';
import { Users, Trophy, Settings, Download, Image, RotateCcw, Sliders, Clock, AlertTriangle, Menu, X, Shield } from 'lucide-react';
import GlassPanel from './GlassPanel';
import MultiplierSettings from './MultiplierSettings';
import PendingSubmissions from './PendingSubmissions';
import ManualSubmission from './ManualSubmission';
import PenaltiesRewards from './PenaltiesRewards';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { Team, Match, TeamStats, PendingSubmission, ScoreAdjustment, Manager, AuditLog, Tournament } from '../types';
import { logAction } from '../utils/auditLogger';
import html2canvas from 'html2canvas';

interface ManagerDashboardProps {
  managerCode: string;
  tournamentId: string;
  onLogout: () => void;
}

export default function ManagerDashboard({ managerCode, tournamentId, onLogout }: ManagerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'scores' | 'pending' | 'adjustments'>('scores');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [teams] = useRealTimeData<Record<string, Team>>('teams', {});
  const [tournaments] = useRealTimeData<Record<string, Tournament>>('tournaments', {});
  const [managers] = useRealTimeData<Record<string, Manager>>('managers', {});
  const [matches, setMatches] = useRealTimeData<Match[]>('matches', []);
  const [pendingSubmissions, setPendingSubmissions] = useRealTimeData<PendingSubmission[]>('pendingSubmissions', []);
  const [scoreAdjustments, setScoreAdjustments] = useRealTimeData<ScoreAdjustment[]>('scoreAdjustments', []);
  const [auditLogs, setAuditLogs] = useRealTimeData<AuditLog[]>('auditLogs', []);
  const [multipliers] = useRealTimeData('multipliers', {
    1: 2.0, 2: 1.8, 3: 1.8, 4: 1.6, 5: 1.6, 6: 1.6,
    7: 1.4, 8: 1.4, 9: 1.4, 10: 1.4, 11: 1.0, 12: 1.0,
    13: 1.0, 14: 1.0, 15: 1.0, 16: 1.0, 17: 1.0, 18: 1.0,
    19: 1.0, 20: 1.0
  });
  const [showMultiplierSettings, setShowMultiplierSettings] = useState(false);
  const [showManualSubmission, setShowManualSubmission] = useState(false);

  const currentManager = Object.values(managers).find(m => m.code === managerCode);
  const currentTournament = tournaments[tournamentId];
  const managerName = currentManager?.name || 'Manager';

  // Filter data for current tournament
  const tournamentTeams = Object.values(teams).filter(team => team.tournamentId === tournamentId);
  const tournamentMatches = matches.filter(match => match.tournamentId === tournamentId);
  const tournamentPending = pendingSubmissions.filter(sub => sub.tournamentId === tournamentId);
  const tournamentAdjustments = scoreAdjustments.filter(adj => adj.tournamentId === tournamentId);

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
      reviewedBy: managerCode,
      tournamentId
    };

    setMatches(prev => [...prev, newMatch]);
    setPendingSubmissions(prev => prev.filter(s => s.id !== submissionId));

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'SUBMISSION_APPROVED',
      `Sottomissione approvata per ${submission.teamName}: ${submission.position}° posto, ${submission.kills} kills`,
      managerCode,
      'manager',
      { teamCode: submission.teamCode, submissionId, tournamentId }
    );
  };

  const rejectSubmission = (submissionId: string) => {
    const submission = pendingSubmissions.find(s => s.id === submissionId);
    if (!submission) return;

    setPendingSubmissions(prev => prev.filter(s => s.id !== submissionId));

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'SUBMISSION_REJECTED',
      `Sottomissione rifiutata per ${submission.teamName}`,
      managerCode,
      'manager',
      { teamCode: submission.teamCode, submissionId, tournamentId }
    );
  };

  const addScoreAdjustment = (adjustmentData: Omit<ScoreAdjustment, 'id' | 'appliedAt' | 'appliedBy' | 'tournamentId'>) => {
    const newAdjustment: ScoreAdjustment = {
      ...adjustmentData,
      id: `adj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      appliedAt: Date.now(),
      appliedBy: managerCode,
      tournamentId
    };

    setScoreAdjustments(prev => [...prev, newAdjustment]);

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'SCORE_ADJUSTMENT',
      `${adjustmentData.type === 'penalty' ? 'Penalità' : 'Ricompensa'} applicata a ${adjustmentData.teamName}: ${adjustmentData.points > 0 ? '+' : ''}${adjustmentData.points} punti - ${adjustmentData.reason}`,
      managerCode,
      'manager',
      { teamCode: adjustmentData.teamCode, type: adjustmentData.type, points: adjustmentData.points, tournamentId }
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
      managerCode,
      'manager',
      { teamCode: submission.teamCode, tournamentId: submission.tournamentId }
    );
  };

  const getLeaderboard = (): TeamStats[] => {
    const teamStats: Record<string, TeamStats> = {};

    // Initialize team stats for current tournament
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

    // Add matches to team stats
    tournamentMatches.filter(match => match.status === 'approved').forEach(match => {
      if (teamStats[match.teamCode]) {
        teamStats[match.teamCode].matches.push(match);
      }
    });

    // Add adjustments to team stats
    tournamentAdjustments.forEach(adjustment => {
      if (teamStats[adjustment.teamCode]) {
        teamStats[adjustment.teamCode].adjustments.push(adjustment);
      }
    });

    // Calculate scores
    Object.values(teamStats).forEach(team => {
      // Calculate match scores (best counted matches)
      const countedMatches = currentTournament?.settings.countedMatches || 3;
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
    a.download = `leaderboard_${currentTournament?.name || 'tournament'}_manager.csv`;
    a.click();
    URL.revokeObjectURL(url);

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'EXPORT_CSV',
      `Classifica esportata in CSV per torneo ${currentTournament?.name}`,
      managerCode,
      'manager',
      { tournamentId, format: 'CSV' }
    );
  };

  const exportImage = async () => {
    const element = document.getElementById('leaderboard-table');
    if (!element) return;

    try {
      const canvas = await html2canvas(element);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `leaderboard_${currentTournament?.name || 'tournament'}_manager.png`;
      a.click();

      // Log action
      logAction(
        auditLogs,
        setAuditLogs,
        'EXPORT_IMAGE',
        `Classifica esportata come immagine per torneo ${currentTournament?.name}`,
        managerCode,
        'manager',
        { tournamentId, format: 'PNG' }
      );
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const leaderboard = getLeaderboard();

  const tabItems = [
    { id: 'scores', label: 'PUNTEGGI', icon: Trophy },
    { id: 'pending', label: 'APPROVAZIONI', icon: Clock, badge: tournamentPending.length },
    { id: 'adjustments', label: 'MODIFICHE', icon: AlertTriangle, badge: tournamentAdjustments.length }
  ];

  if (!currentTournament) {
    return (
      <div className="min-h-screen p-4 relative z-10 flex items-center justify-center">
        <GlassPanel className="p-8 text-center">
          <div className="text-ice-blue/60 font-mono">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">Torneo non trovato</p>
            <button
              onClick={() => setShowManualSubmission(true)}
              className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors font-mono text-xs sm:text-sm"
            >
              <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">INSERIMENTO MANUALE</span>
            </button>
            <button
              onClick={onLogout}
              className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-mono"
            >
              LOGOUT
            </button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <GlassPanel className="p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 text-ice-blue hover:bg-ice-blue/10 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 relative">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 animate-float" />
                <div className="absolute inset-0 rounded-full bg-purple-400/10 animate-ping" />
              </div>
              <div className="overflow-hidden">
                <h1 className="text-lg sm:text-3xl font-bold text-white font-mono tracking-wider">
                  {currentTournament.name.toUpperCase()}
                </h1>
                <p className="text-purple-400/80 font-mono text-xs sm:text-base">
                  Manager: <span className="text-purple-400 font-bold">{managerName}</span>
                  {currentTournament.isDemo && (
                    <span className="ml-2 px-2 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded text-xs">
                      DEMO
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setShowMultiplierSettings(true)}
                className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors font-mono text-xs sm:text-sm"
              >
                <Sliders className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">MOLTIPLICATORI</span>
              </button>
              <button
                onClick={onLogout}
                className="px-2 sm:px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-mono text-xs sm:text-sm"
              >
                LOGOUT
              </button>
            </div>
          </div>
        </GlassPanel>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <GlassPanel className="sm:hidden p-4 mb-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-2">
              {tabItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center space-x-2 px-3 py-3 rounded-xl font-mono transition-all duration-300 relative ${
                    activeTab === item.id
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'text-purple-400/60 hover:text-purple-400 hover:bg-purple-500/10'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-xs">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {item.badge}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMultiplierSettings(true)}
              className="w-full mt-2 flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors font-mono text-xs"
            >
              <Sliders className="w-4 h-4" />
              <span>MOLTIPLICATORI</span>
            </button>
            <button
              onClick={() => setShowManualSubmission(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors font-mono text-xs"
            >
              <Upload className="w-4 h-4" />
              <span>INSERIMENTO MANUALE</span>
            </button>
          </GlassPanel>
        )}

        {/* Desktop Navigation Tabs */}
        <GlassPanel className="hidden sm:block p-6 mb-6">
          <div className="flex space-x-4">
            {tabItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-mono transition-all duration-300 relative ${
                  activeTab === item.id
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'text-purple-400/60 hover:text-purple-400 hover:bg-purple-500/10'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>APPROVAZIONI ({teamsWithPendingCount})</span>
                {item.badge && item.badge > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                    {item.badge}
                  </div>
                )}
              </button>
            ))}
          </div>
        </GlassPanel>

        {/* Pending Submissions Tab */}
        {activeTab === 'pending' && (
          <PendingSubmissions
            isAdmin={false}
            submissions={tournamentPending}
            onApprove={approveSubmission}
            onReject={rejectSubmission}
            onManualSubmit={() => setShowManualSubmission(true)}
          />
        )}

        {/* Penalties & Rewards Tab */}
        {activeTab === 'adjustments' && (
          <PenaltiesRewards
            teams={tournamentTeams}
            adjustments={tournamentAdjustments}
            onAddAdjustment={addScoreAdjustment}
            currentSection={currentTournament.type}
          />
        )}

        {/* Scores Tab */}
        {activeTab === 'scores' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <GlassPanel className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 font-mono">CONTROLLI</h2>
                <div className="flex space-x-2 sm:space-x-3 mb-6">
                  <button
                    onClick={exportCSV}
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono text-xs sm:text-sm"
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={exportImage}
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-mono text-xs sm:text-sm"
                  >
                    <Image className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>IMG</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-4 text-center">
                  <div className="p-3 sm:p-4 bg-black/20 border border-purple-400/20 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-purple-400 font-mono">
                      {tournamentTeams.length}
                    </div>
                    <div className="text-purple-400/60 font-mono text-xs sm:text-sm">SQUADRE</div>
                  </div>
                  <div className="p-3 sm:p-4 bg-black/20 border border-purple-400/20 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-purple-400 font-mono">
                      {tournamentMatches.filter(m => m.status === 'approved').length}
                    </div>
                    <div className="text-purple-400/60 font-mono text-xs sm:text-sm">PARTITE</div>
                  </div>
                  <div className="p-3 sm:p-4 bg-black/20 border border-purple-400/20 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-red-400 font-mono">
                      {tournamentPending.length}
                    </div>
                    <div className="text-purple-400/60 font-mono text-xs sm:text-sm">IN ATTESA</div>
                  </div>
                  <div className="p-3 sm:p-4 bg-black/20 border border-purple-400/20 rounded-lg">
                    <div className="text-lg sm:text-2xl font-bold text-orange-400 font-mono">
                      {tournamentAdjustments.length}
                    </div>
                    <div className="text-purple-400/60 font-mono text-xs sm:text-sm">MODIFICHE</div>
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 font-mono">IMPOSTAZIONI TORNEO</h2>
                <div className="space-y-3">
                  <div className="p-3 bg-black/20 border border-purple-400/20 rounded-lg">
                    <div className="text-purple-400/60 font-mono text-sm">Tipo Torneo</div>
                    <div className="text-white font-bold">{currentTournament.type}</div>
                  </div>
                  <div className="p-3 bg-black/20 border border-purple-400/20 rounded-lg">
                    <div className="text-purple-400/60 font-mono text-sm">Partite</div>
                    <div className="text-white font-bold">
                      {currentTournament.settings.countedMatches}/{currentTournament.settings.totalMatches}
                    </div>
                  </div>
                  <div className="p-3 bg-black/20 border border-purple-400/20 rounded-lg">
                    <div className="text-purple-400/60 font-mono text-sm">Lobby</div>
                    <div className="text-white font-bold">
                      {currentTournament.settings.lobbies} x {currentTournament.settings.slotsPerLobby} slot
                    </div>
                  </div>
                </div>
              </GlassPanel>
            </div>

            {/* Leaderboard */}
            <GlassPanel className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 font-mono">
                CLASSIFICA {currentTournament.type.toUpperCase()}
              </h2>
              
              <div id="leaderboard-table" className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-400/30">
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-purple-400 font-mono text-xs sm:text-sm">RANK</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-purple-400 font-mono text-xs sm:text-sm">SQUADRA</th>
                      <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-purple-400 font-mono text-xs sm:text-sm">CODICE</th>
                      <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-purple-400 font-mono text-xs sm:text-sm">PUNTEGGIO</th>
                      <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-purple-400 font-mono text-xs sm:text-sm">MODIFICHE</th>
                      <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-purple-400 font-mono text-xs sm:text-sm">TOTALE</th>
                      <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-purple-400 font-mono text-xs sm:text-sm">PARTITE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((team, index) => (
                      <tr 
                        key={team.teamCode}
                        className={`border-b border-purple-400/10 hover:bg-purple-400/5 transition-all duration-300 animate-fade-in ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400/10 to-transparent' :
                          index === 2 ? 'bg-gradient-to-r from-orange-600/10 to-transparent' : ''
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <td className="py-2 sm:py-4 px-2 sm:px-4">
                          <div className={`flex items-center space-x-1 sm:space-x-2 ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-300' :
                            index === 2 ? 'text-orange-400' : 'text-white'
                          }`}>
                            <span className="font-bold font-mono text-sm sm:text-lg">#{team.rank}</span>
                            {index < 3 && <Trophy className="w-3 h-3 sm:w-5 sm:h-5 animate-pulse" />}
                          </div>
                        </td>
                        <td className="py-2 sm:py-4 px-2 sm:px-4 text-white font-bold font-mono text-xs sm:text-base">{team.teamName}</td>
                        <td className="py-2 sm:py-4 px-2 sm:px-4 text-purple-400 font-mono text-xs sm:text-base">{team.teamCode}</td>
                        <td className="py-2 sm:py-4 px-2 sm:px-4 text-right text-purple-400 font-mono text-sm sm:text-lg font-bold">
                          {team.totalScore.toFixed(1)}
                        </td>
                        <td className="py-2 sm:py-4 px-2 sm:px-4 text-right font-mono text-sm sm:text-lg font-bold">
                          <span className={
                            team.adjustmentTotal > 0 ? 'text-green-400' :
                            team.adjustmentTotal < 0 ? 'text-red-400' : 'text-purple-400/60'
                          }>
                            {team.adjustmentTotal > 0 ? '+' : ''}{team.adjustmentTotal.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2 sm:py-4 px-2 sm:px-4 text-right text-white font-mono text-sm sm:text-xl font-bold">
                          {team.finalScore.toFixed(1)}
                        </td>
                        <td className="py-2 sm:py-4 px-2 sm:px-4 text-right text-purple-400/60 font-mono text-xs sm:text-base">
                          {team.matches.length}/{currentTournament.settings.totalMatches}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassPanel>
          </div>
        )}

        {/* Copyright */}
        <div className="mt-8 text-center">
          <div className="text-xs text-purple-400/40 font-mono">
            © 2025 BM Solution - Sviluppo Applicazioni
          </div>
        </div>
      </div>

      <MultiplierSettings 
        isOpen={showMultiplierSettings}
        onClose={() => setShowMultiplierSettings(false)}
      />
      
      {/* Manual Submission Modal */}
      <ManualSubmission
        isOpen={showManualSubmission}
        onClose={() => setShowManualSubmission(false)}
        teams={tournamentTeams}
        tournament={currentTournament}
        onSubmit={handleManualSubmission}
        submitterName={managerName}
        submitterType="manager"
      />
    </div>
  );
}