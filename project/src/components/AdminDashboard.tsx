import React, { useState } from 'react';
import { Users, Trophy, Settings, Download, Image, RotateCcw, Sliders, Clock, Key, Bell, AlertTriangle, Menu, X, Archive, UserPlus, Eye, Shield, Plus, Play, Copy, Tv, Upload } from 'lucide-react';
import GlassPanel from './GlassPanel';
import TournamentCreator from './TournamentCreator';
import MultiplierSettings from './MultiplierSettings';
import ManualSubmission from './ManualSubmission';
import PendingSubmissions from './PendingSubmissions';
import TeamCodeDisplay from './TeamCodeDisplay';
import PenaltiesRewards from './PenaltiesRewards';
import ManagerManagement from './ManagerManagement';
import AuditLogViewer from './AuditLogViewer';
import TournamentArchive from './TournamentArchive';
import TournamentManagement from './TournamentManagement';
import OBSPluginManager from './OBSPluginManager';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { Team, Match, TeamStats, PendingSubmission, ScoreAdjustment, Manager, AuditLog, Tournament } from '../types';
import { generateUniqueTeamCode } from '../utils/teamCodeGenerator';
import { logAction } from '../utils/auditLogger';
import html2canvas from 'html2canvas';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'tournaments' | 'teams' | 'scores' | 'pending' | 'adjustments' | 'managers' | 'audit' | 'archive'>('tournaments');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [showTournamentCreator, setShowTournamentCreator] = useState(false);
  const [teams, setTeams] = useRealTimeData<Record<string, Team>>('teams', {});
  const [matches, setMatches] = useRealTimeData<Match[]>('matches', []);
  const [pendingSubmissions, setPendingSubmissions] = useRealTimeData<PendingSubmission[]>('pendingSubmissions', []);
  const [scoreAdjustments, setScoreAdjustments] = useRealTimeData<ScoreAdjustment[]>('scoreAdjustments', []);
  const [managers, setManagers] = useRealTimeData<Record<string, Manager>>('managers', {});
  const [auditLogs, setAuditLogs] = useRealTimeData<AuditLog[]>('auditLogs', []);
  const [tournaments, setTournaments] = useRealTimeData<Record<string, Tournament>>('tournaments', {});
  const [multipliers, setMultipliers] = useRealTimeData('multipliers', {
    1: 2.0, 2: 1.8, 3: 1.8, 4: 1.6, 5: 1.6, 6: 1.6,
    7: 1.4, 8: 1.4, 9: 1.4, 10: 1.4, 11: 1.0, 12: 1.0,
    13: 1.0, 14: 1.0, 15: 1.0, 16: 1.0, 17: 1.0, 18: 1.0,
    19: 1.0, 20: 1.0
  });
  const [showMultiplierSettings, setShowMultiplierSettings] = useState(false);
  const [showTeamCode, setShowTeamCode] = useState<{ name: string; code: string } | null>(null);
  const [showLoginCodes, setShowLoginCodes] = useState(false);
  const [showOBSPlugin, setShowOBSPlugin] = useState(false);
  const [showManualSubmission, setShowManualSubmission] = useState(false);

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
      tournamentId: submission.tournamentId
    };

    setMatches(prev => [...prev, newMatch]);
    setPendingSubmissions(prev => prev.filter(s => s.id !== submissionId));

    // Log action
    logAction(
      auditLogs,
      setAuditLogs,
      'SUBMISSION_APPROVED',
      `Sottomissione approvata per ${submission.teamName}: ${submission.position}° posto, ${submission.kills} kills`,
      'admin',
      'admin',
      { teamCode: submission.teamCode, submissionId, tournamentId: submission.tournamentId }
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
      'admin',
      'admin',
      { teamCode: submission.teamCode, submissionId, tournamentId: submission.tournamentId }
    );
  };

  // Raggruppa le submission pendenti per team
  const pendingByTeam = pendingSubmissions.reduce((acc, submission) => {
    if (!acc[submission.teamCode]) {
      acc[submission.teamCode] = [];
    }
    acc[submission.teamCode].push(submission);
    return acc;
  }, {} as Record<string, PendingSubmission[]>);

  // Conta i team con submission pendenti
  const teamsWithPendingCount = Object.keys(pendingByTeam).length;

  const activeTournaments = Object.values(tournaments).filter(t => t.status === 'active');
  const completedTournaments = Object.values(tournaments).filter(t => t.status === 'completed');

  // Get pending submissions count
  const totalPendingCount = pendingSubmissions.length;

  const createBlackCrowDemo = () => {
    const demoId = `blackcrow-${Date.now()}`;
    const now = new Date();
    
    // Create the Black Crow Scrim tournament
    const blackCrowTournament: Tournament = {
      id: demoId,
      name: 'Black Crow Scrim',
      type: 'Ritorno',
      status: 'active',
      startTime: '20:00',
      startDate: now.toISOString().split('T')[0],
      createdAt: Date.now(),
      createdBy: 'admin',
      assignedManagers: ['Overwatch2025'],
      settings: { lobbies: 1, slotsPerLobby: 15, totalMatches: 4, countedMatches: 3 },
      isDemo: true
    };

    setTournaments(prev => ({ ...prev, [demoId]: blackCrowTournament }));

    // Create demo manager
    const demoManager: Manager = {
      id: 'mgr-overwatch',
      name: 'Gestore Demo',
      code: 'Overwatch2025',
      permissions: ['scores', 'pending', 'adjustments', 'multipliers'],
      createdAt: Date.now(),
      createdBy: 'admin',
      isActive: true
    };

    setManagers(prev => ({ ...prev, ['Overwatch2025']: demoManager }));

    // All 15 Black Crow team names from JSON
    const blackCrowTeams = [
      'BlackCrow Sayan', 'BlackCrow Slide', 'BlackCrow Omega', 'BlackCrow Eclipse',
      'BlackCrow Beta', 'BlackCrow Alpha', 'BlackCrow Hydra', 'BlackCrow Shadow',
      'BlackCrow Storm', 'BlackCrow Neo', 'BlackCrow Nova', 'BlackCrow Venom',
      'BlackCrow Ghost', 'BlackCrow Prime', 'BlackCrow Joker'
    ];

    // Create teams with codes
    const teamCodes: Record<string, string> = {};
    blackCrowTeams.forEach((teamName, index) => {
      const code = generateUniqueTeamCode(teams);
      const key = `${demoId}-Lobby1-Slot${index + 1}`;
      
      const team: Team = {
        id: key,
        name: teamName,
        code,
        lobby: key,
        lobbyNumber: 1,
        createdAt: Date.now(),
        tournamentId: demoId,
        clanName: teamName,
        playerName: teamName.replace('BlackCrow ', '')
      };

      setTeams(prev => ({ ...prev, [key]: team }));
      teamCodes[teamName] = code;
    });

    // Complete match data from JSON with ALL teams and their exact scores
    const matchData = [
      {
        match_number: 1,
        scores: {
          'BlackCrow Sayan': 38, 'BlackCrow Slide': 34, 'BlackCrow Omega': 33,
          'BlackCrow Eclipse': 30, 'BlackCrow Ghost': 27, 'BlackCrow Neo': 24,
          'BlackCrow Storm': 0,
          // Adding scores for remaining teams (realistic distribution)
          'BlackCrow Beta': 22, 'BlackCrow Alpha': 20, 'BlackCrow Hydra': 18,
          'BlackCrow Shadow': 16, 'BlackCrow Nova': 14, 'BlackCrow Venom': 12,
          'BlackCrow Prime': 10, 'BlackCrow Joker': 8
        }
      },
      {
        match_number: 2,
        scores: {
          'BlackCrow Sayan': 32, 'BlackCrow Slide': 30, 'BlackCrow Omega': 28,
          'BlackCrow Ghost': 25, 'BlackCrow Eclipse': 24, 'BlackCrow Neo': 22,
          'BlackCrow Storm': 0,
          // Match 2 scores for remaining teams
          'BlackCrow Alpha': 20, 'BlackCrow Beta': 19, 'BlackCrow Hydra': 17,
          'BlackCrow Shadow': 15, 'BlackCrow Nova': 13, 'BlackCrow Prime': 11,
          'BlackCrow Venom': 9, 'BlackCrow Joker': 7
        }
      },
      {
        match_number: 3,
        scores: {
          'BlackCrow Sayan': 28, 'BlackCrow Slide': 27, 'BlackCrow Ghost': 26,
          'BlackCrow Eclipse': 22, 'BlackCrow Omega': 21, 'BlackCrow Neo': 23,
          'BlackCrow Storm': 0,
          // Match 3 scores for remaining teams
          'BlackCrow Alpha': 19, 'BlackCrow Beta': 18, 'BlackCrow Hydra': 16,
          'BlackCrow Nova': 14, 'BlackCrow Shadow': 13, 'BlackCrow Prime': 12,
          'BlackCrow Venom': 10, 'BlackCrow Joker': 9
        }
      }
    ];

    // Create matches for completed games with exact scores for ALL teams
    matchData.forEach((matchInfo, matchIndex) => {
      Object.entries(matchInfo.scores).forEach(([teamName, score]) => {
        if (teamCodes[teamName]) {
          // For BlackCrow Storm (disqualified), create matches with 0 score
          if (teamName === 'BlackCrow Storm') {
            const match: Match = {
              id: `blackcrow-${teamCodes[teamName]}-${matchIndex + 1}`,
              position: 20, // Last position
              kills: 0,
              score: 0,
              teamCode: teamCodes[teamName],
              photos: [`demo-photo-${matchIndex + 1}-1.jpg`, `demo-photo-${matchIndex + 1}-2.jpg`],
              status: 'approved',
              submittedAt: Date.now() - ((3 - matchIndex) * 3600000),
              reviewedAt: Date.now() - ((3 - matchIndex) * 3600000),
              reviewedBy: 'Overwatch2025',
              tournamentId: demoId
            };
            setMatches(prev => [...prev, match]);
          } else if (score > 0) {
            // Calculate realistic position and kills from exact score
            let position: number;
            let kills: number;
            
            // Reverse engineer position and kills from score using multipliers
            if (score >= 30) {
              position = Math.floor(Math.random() * 3) + 1; // 1-3rd place
              kills = Math.round(score / (multipliers[position] || 2));
            } else if (score >= 20) {
              position = Math.floor(Math.random() * 5) + 4; // 4-8th place
              kills = Math.round(score / (multipliers[position] || 1.4));
            } else if (score >= 10) {
              position = Math.floor(Math.random() * 5) + 9; // 9-13th place
              kills = Math.round(score / (multipliers[position] || 1));
            } else {
              position = Math.floor(Math.random() * 3) + 14; // 14-16th place
              kills = Math.round(score / (multipliers[position] || 1));
            }
            
            const match: Match = {
              id: `blackcrow-${teamCodes[teamName]}-${matchIndex + 1}`,
              position,
              kills,
              score,
              teamCode: teamCodes[teamName],
              photos: [`demo-photo-${matchIndex + 1}-1.jpg`, `demo-photo-${matchIndex + 1}-2.jpg`],
              status: 'approved',
              submittedAt: Date.now() - ((3 - matchIndex) * 3600000),
              reviewedAt: Date.now() - ((3 - matchIndex) * 3600000),
              reviewedBy: 'Overwatch2025',
              tournamentId: demoId
            };

            setMatches(prev => [...prev, match]);
          }
        }
      });
    });

    // Add exact bonuses and penalties from JSON
    const adjustments = [
      {
        teamName: 'BlackCrow Ghost',
        points: 3,
        reason: 'Ucciso con arma vietata',
        type: 'reward' as const
      },
      {
        teamName: 'BlackCrow Neo',
        points: -7,
        reason: '1ª infrazione',
        type: 'penalty' as const
      }
    ];

    adjustments.forEach(adj => {
      if (teamCodes[adj.teamName]) {
        const adjustment: ScoreAdjustment = {
          id: `blackcrow-adj-${teamCodes[adj.teamName]}`,
          teamCode: teamCodes[adj.teamName],
          teamName: adj.teamName,
          points: adj.points,
          reason: adj.reason,
          type: adj.type,
          appliedAt: Date.now() - 1800000, // 30 minutes ago
          appliedBy: 'Overwatch2025',
          tournamentId: demoId
        };

        setScoreAdjustments(prev => [...prev, adjustment]);
      }
    });

    // Add pending submissions for the 4th match (more teams waiting for approval)
    const pendingTeams = [
      { name: 'BlackCrow Sayan', position: 2, kills: 15 },
      { name: 'BlackCrow Slide', position: 3, kills: 12 },
      { name: 'BlackCrow Ghost', position: 1, kills: 18 },
      { name: 'BlackCrow Eclipse', position: 5, kills: 10 },
      { name: 'BlackCrow Omega', position: 4, kills: 11 },
      { name: 'BlackCrow Alpha', position: 6, kills: 9 },
      { name: 'BlackCrow Beta', position: 7, kills: 8 },
      { name: 'BlackCrow Hydra', position: 8, kills: 7 },
      { name: 'BlackCrow Nova', position: 9, kills: 6 },
      { name: 'BlackCrow Prime', position: 10, kills: 5 }
    ];

    pendingTeams.forEach(team => {
      if (teamCodes[team.name]) {
        const pendingSubmission: PendingSubmission = {
          id: `blackcrow-pending-${teamCodes[team.name]}-4`,
          teamCode: teamCodes[team.name],
          teamName: team.name,
          position: team.position,
          kills: team.kills,
          photos: [`pending-match4-1.jpg`, `pending-match4-2.jpg`],
          submittedAt: Date.now() - (Math.random() * 900000), // Last 15 minutes
          tournamentId: demoId
        };

        setPendingSubmissions(prev => [...prev, pendingSubmission]);
      }
    });

    // Add realistic audit log entries from JSON
    const auditEntries = [
      {
        action: 'TOURNAMENT_CREATED',
        details: 'Torneo demo "Black Crow Scrim" creato con tutte le 15 squadre BlackCrow',
        performedBy: 'admin',
        performedByType: 'admin' as const,
        timestamp: Date.now() - 14400000 // 4 hours ago
      },
      {
        action: 'MANAGER_ASSIGNED',
        details: 'Gestore Demo (Overwatch2025) assegnato al torneo Black Crow Scrim',
        performedBy: 'admin',
        performedByType: 'admin' as const,
        timestamp: Date.now() - 14000000
      },
      {
        action: 'TEAMS_REGISTERED',
        details: 'Registrate tutte le 15 squadre BlackCrow: Sayan, Slide, Omega, Eclipse, Beta, Alpha, Hydra, Shadow, Storm, Neo, Nova, Venom, Ghost, Prime, Joker',
        performedBy: 'admin',
        performedByType: 'admin' as const,
        timestamp: Date.now() - 13800000
      },
      {
        action: 'SUBMISSION_APPROVED',
        details: 'Approvato punteggi Match 1 per tutte le 15 squadre - BlackCrow Sayan in testa con 38 punti',
        performedBy: 'Overwatch2025',
        performedByType: 'manager' as const,
        timestamp: Date.now() - 10800000 // 3 hours ago
      },
      {
        action: 'SUBMISSION_APPROVED',
        details: 'Approvato punteggi Match 2 per tutte le 15 squadre - BlackCrow Sayan mantiene il comando',
        performedBy: 'Overwatch2025',
        performedByType: 'manager' as const,
        timestamp: Date.now() - 7200000 // 2 hours ago
      },
      {
        action: 'SUBMISSION_APPROVED',
        details: 'Approvato punteggi Match 3 per tutte le 15 squadre - Classifica sempre più serrata',
        performedBy: 'Overwatch2025',
        performedByType: 'manager' as const,
        timestamp: Date.now() - 3600000 // 1 hour ago
      },
      {
        action: 'SCORE_ADJUSTMENT',
        details: 'Ricompensa applicata a BlackCrow Ghost: +3 punti - Ucciso con arma vietata',
        performedBy: 'Overwatch2025',
        performedByType: 'manager' as const,
        timestamp: Date.now() - 1800000 // 30 minutes ago
      },
      {
        action: 'SCORE_ADJUSTMENT',
        details: 'Penalità applicata a BlackCrow Neo: -7 punti - 1ª infrazione',
        performedBy: 'Overwatch2025',
        performedByType: 'manager' as const,
        timestamp: Date.now() - 1200000 // 20 minutes ago
      },
      {
        action: 'TEAM_DISQUALIFIED',
        details: 'BlackCrow Storm squalificato per 2ª infrazione - 0 punti in tutte le partite',
        performedBy: 'Overwatch2025',
        performedByType: 'manager' as const,
        timestamp: Date.now() - 600000 // 10 minutes ago
      },
      {
        action: 'MATCH_4_SUBMISSIONS',
        details: '10 squadre hanno già inviato i punteggi per la 4ª partita - In attesa di approvazione',
        performedBy: 'system',
        performedByType: 'admin' as const,
        timestamp: Date.now() - 300000 // 5 minutes ago
      }
    ];

    auditEntries.forEach((entry, index) => {
      const auditLog: AuditLog = {
        id: `blackcrow-audit-${index}`,
        action: entry.action,
        details: entry.details,
        performedBy: entry.performedBy,
        performedByType: entry.performedByType,
        timestamp: entry.timestamp,
        tournamentId: demoId
      };

      setAuditLogs(prev => [auditLog, ...prev]);
    });

    setSelectedTournament(demoId);
    setActiveTab('tournaments');
  };

  const stopDemo = () => {
    const demoTournaments = Object.values(tournaments).filter(t => t.isDemo);
    
    demoTournaments.forEach(demo => {
      // Remove demo tournament
      setTournaments(prev => {
        const newTournaments = { ...prev };
        delete newTournaments[demo.id];
        return newTournaments;
      });

      // Remove demo teams
      const demoTeams = Object.values(teams).filter(team => team.tournamentId === demo.id);
      demoTeams.forEach(team => {
        setTeams(prev => {
          const newTeams = { ...prev };
          delete newTeams[team.id];
          return newTeams;
        });
      });

      // Remove demo matches
      setMatches(prev => prev.filter(match => match.tournamentId !== demo.id));

      // Remove demo adjustments
      setScoreAdjustments(prev => prev.filter(adj => adj.tournamentId !== demo.id));

      // Remove demo pending submissions
      setPendingSubmissions(prev => prev.filter(sub => sub.tournamentId !== demo.id));

      // Remove demo managers
      setManagers(prev => {
        const newManagers = { ...prev };
        delete newManagers['Overwatch2025'];
        return newManagers;
      });

      // Remove demo audit logs
      setAuditLogs(prev => prev.filter(log => log.tournamentId !== demo.id));
    });

    setSelectedTournament('');
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const tabItems = [
    { id: 'tournaments', label: 'TORNEI', icon: Trophy },
    { id: 'pending', label: 'APPROVAZIONI', icon: Clock, badge: teamsWithPendingCount, count: totalPendingCount },
    { id: 'audit', label: 'AUDIT LOG', icon: Eye },
    { id: 'archive', label: 'ARCHIVIO', icon: Archive }
  ];

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
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-ice-blue/20 to-ice-blue-dark/20 relative">
                <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-ice-blue animate-float" />
                <div className="absolute inset-0 rounded-full bg-ice-blue/10 animate-ping" />
              </div>
              <div>
                <h1 className="text-lg sm:text-3xl font-bold text-white font-mono tracking-wider animate-glow">
                  ADMIN CONTROL
                </h1>
                <p className="text-ice-blue/80 font-mono text-xs sm:text-base">
                  Sistema di Gestione Tornei
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setShowLoginCodes(true)}
                className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-mono text-xs sm:text-sm"
              >
                <Key className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">CODICI</span>
              </button>
              <button
                onClick={() => setShowOBSPlugin(true)}
                className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors font-mono text-xs sm:text-sm"
              >
                <Tv className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">OBS</span>
              </button>
              <button
                onClick={() => setShowTournamentCreator(true)}
                className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">CREA TORNEO</span>
              </button>
              <button
                onClick={() => selectedTournament ? setShowManualSubmission(true) : alert('Seleziona prima un torneo')}
                className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors font-mono text-xs sm:text-sm"
              >
                <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">INSERIMENTO MANUALE</span>
              </button>
              <button
                onClick={createBlackCrowDemo}
                className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors font-mono text-xs sm:text-sm"
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">BLACK CROW</span>
              </button>
              {Object.values(tournaments).some(t => t.isDemo) && (
                <button
                  onClick={stopDemo}
                  className="hidden sm:flex items-center space-x-2 px-3 sm:px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-mono text-xs sm:text-sm"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">STOP DEMO</span>
                </button>
              )}
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
            <div className="grid grid-cols-2 gap-2 mb-3">
              {tabItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-center space-x-2 px-3 py-3 rounded-xl font-mono transition-all duration-300 relative ${
                    activeTab === item.id
                      ? 'bg-ice-blue/20 text-ice-blue border border-ice-blue/50'
                      : 'text-ice-blue/60 hover:text-ice-blue hover:bg-ice-blue/10'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => setShowLoginCodes(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-mono text-xs"
              >
                <Key className="w-4 h-4" />
                <span>CODICI ACCESSO</span>
              </button>
              <button
                onClick={() => setShowTournamentCreator(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>CREA TORNEO</span>
              </button>
              <button
                onClick={() => setShowOBSPlugin(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors font-mono text-xs"
              >
                <Tv className="w-4 h-4" />
                <span>OBS STREAMING</span>
              </button>
              <button
                onClick={() => selectedTournament ? setShowManualSubmission(true) : alert('Seleziona prima un torneo')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors font-mono text-xs"
              >
                <Upload className="w-4 h-4" />
                <span>INSERIMENTO MANUALE</span>
              </button>
              <button
                onClick={createBlackCrowDemo}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors font-mono text-xs"
              >
                <Play className="w-4 h-4" />
                <span>BLACK CROW DEMO</span>
              </button>
              {Object.values(tournaments).some(t => t.isDemo) && (
                <button
                  onClick={stopDemo}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-mono text-xs"
                >
                  <X className="w-4 h-4" />
                  <span>INTERROMPI DEMO</span>
                </button>
              )}
            </div>
          </GlassPanel>
        )}

        {/* Desktop Navigation Tabs */}
        <GlassPanel className="hidden sm:block p-6 mb-6">
          <div className="flex space-x-4 overflow-x-auto">
            {tabItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-mono transition-all duration-300 relative whitespace-nowrap ${
                  activeTab === item.id
                    ? 'bg-ice-blue/20 text-ice-blue border border-ice-blue/50'
                    : 'text-ice-blue/60 hover:text-ice-blue hover:bg-ice-blue/10'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label} {item.count ? `(${item.count})` : ''}</span>
              </button>
            ))}
          </div>
        </GlassPanel>

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <GlassPanel className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 font-mono">TORNEI ATTIVI</h2>
                <div className="space-y-3">
                  {activeTournaments.length === 0 ? (
                    <div className="text-center text-ice-blue/60 font-mono py-8">
                      <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nessun torneo attivo</p>
                    </div>
                  ) : (
                    activeTournaments.map(tournament => (
                      <div key={tournament.id} className={`p-4 border rounded-lg relative ${
                        tournament.isDemo 
                          ? 'bg-purple-500/10 border-purple-500/30' 
                          : 'bg-black/20 border-ice-blue/20'
                      }`}>
                        {tournament.isDemo && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded text-xs font-mono">
                            DEMO
                          </div>
                        )}
                        {tournament.name === 'Black Crow Scrim' && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded text-xs font-mono animate-pulse">
                            ⚠️ In attesa della 4ª partita
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-bold font-mono">{tournament.name}</div>
                            <div className="text-ice-blue/60 text-sm font-mono">
                              {tournament.type} • {tournament.startDate} {tournament.startTime}
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedTournament(tournament.id)}
                            className="px-3 py-1 bg-ice-blue/20 border border-ice-blue/50 text-ice-blue rounded text-sm font-mono hover:bg-ice-blue/30 transition-colors"
                          >
                            GESTISCI
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassPanel>

              <GlassPanel className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 font-mono">AZIONI RAPIDE</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowTournamentCreator(true)}
                    className="w-full flex items-center space-x-3 p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors font-mono"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Crea Nuovo Torneo</span>
                  </button>
                  <button
                    onClick={createBlackCrowDemo}
                    className="w-full flex items-center space-x-3 p-4 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors font-mono"
                  >
                    <Play className="w-5 h-5" />
                    <span>Avvia Black Crow Demo</span>
                  </button>
                  {Object.values(tournaments).some(t => t.isDemo) && (
                    <button
                      onClick={stopDemo}
                      className="w-full flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors font-mono"
                    >
                      <X className="w-5 h-5" />
                      <span>Interrompi Dimostrazione</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowLoginCodes(true)}
                    className="w-full flex items-center space-x-3 p-4 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors font-mono"
                  >
                    <Key className="w-5 h-5" />
                    <span>Visualizza Codici Accesso</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('managers')}
                    className="w-full flex items-center space-x-3 p-4 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors font-mono"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Gestisci Gestori</span>
                  </button>
                  <button
                    onClick={() => setShowOBSPlugin(true)}
                    className="w-full flex items-center space-x-3 p-4 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors font-mono"
                  >
                    <Tv className="w-5 h-5" />
                    <span>OBS PLUGIN</span>
                  </button>
                </div>
              </GlassPanel>
            </div>

            {/* Tournament Management */}
            {selectedTournament && (
              <TournamentManagement
                tournamentId={selectedTournament}
                onClose={() => setSelectedTournament('')}
                tournaments={tournaments}
                setTournaments={setTournaments}
                teams={teams}
                setTeams={setTeams}
                matches={matches}
                setMatches={setMatches}
                pendingSubmissions={pendingSubmissions}
                setPendingSubmissions={setPendingSubmissions}
                scoreAdjustments={scoreAdjustments}
                setScoreAdjustments={setScoreAdjustments}
                managers={managers}
                setManagers={setManagers}
                auditLogs={auditLogs}
                setAuditLogs={setAuditLogs}
                multipliers={multipliers}
              />
            )}
          </div>
        )}

        {/* Pending Submissions Tab */}
        {activeTab === 'pending' && (
          <PendingSubmissions
            isAdmin={true}
            submissions={pendingSubmissions}
            onApprove={approveSubmission}
            onReject={rejectSubmission}
            onManualSubmit={() => selectedTournament ? setShowManualSubmission(true) : alert('Seleziona prima un torneo')}
          />
        )}

        {/* Manager Management Tab */}
        {activeTab === 'managers' && (
          <ManagerManagement
            managers={managers}
            setManagers={setManagers}
            auditLogs={auditLogs}
            setAuditLogs={setAuditLogs}
          />
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <AuditLogViewer 
            auditLogs={auditLogs} 
            setAuditLogs={setAuditLogs}
            isAdmin={true}
          />
        )}

        {/* Tournament Archive Tab */}
        {activeTab === 'archive' && (
          <TournamentArchive
            tournaments={completedTournaments}
            setTournaments={setTournaments}
            auditLogs={auditLogs}
            setAuditLogs={setAuditLogs}
          />
        )}

        {/* Copyright */}
        <div className="mt-8 text-center">
          <div className="text-xs text-ice-blue/40 font-mono">
            © 2025 BM Solution - Sviluppo Applicazioni
          </div>
          <div className="text-xs text-ice-blue/30 font-mono mt-1">
            Advanced Tournament Management System v4.0
          </div>
        </div>
      </div>

      <TournamentCreator
        isOpen={showTournamentCreator}
        onClose={() => setShowTournamentCreator(false)}
        auditLogs={auditLogs}
        setAuditLogs={setAuditLogs}
      />

      <MultiplierSettings 
        isOpen={showMultiplierSettings}
        onClose={() => setShowMultiplierSettings(false)}
      />

      <OBSPluginManager
        isOpen={showOBSPlugin}
        onClose={() => setShowOBSPlugin(false)}
      />

      {/* Manual Submission Modal */}
      {showManualSubmission && selectedTournament && (
        <ManualSubmission
          isOpen={showManualSubmission}
          onClose={() => setShowManualSubmission(false)}
          teams={Object.values(teams).filter(team => team.tournamentId === selectedTournament)}
          tournament={tournaments[selectedTournament]}
          onSubmit={handleManualSubmission}
          submitterName="Admin"
          submitterType="admin"
        />
      )}

      {showTeamCode && (
        <TeamCodeDisplay
          teamName={showTeamCode.name}
          teamCode={showTeamCode.code}
          onClose={() => setShowTeamCode(null)}
        />
      )}

      {/* Login Codes Modal */}
      {showLoginCodes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassPanel className="w-full max-w-2xl p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
                <Key className="w-5 h-5 text-ice-blue" />
                <span>CODICI DI ACCESSO</span>
              </h2>
              <button
                onClick={() => setShowLoginCodes(false)}
                className="text-ice-blue/60 hover:text-ice-blue transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Admin Codes */}
              <div className="p-4 bg-ice-blue/10 border border-ice-blue/30 rounded-lg">
                <h3 className="text-ice-blue font-mono font-bold mb-3">CODICI AMMINISTRATORE</h3>
                <div className="space-y-2">
                  {['********', '********'].map((code, index) => (
                    <div key={code} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                      <span className="text-white font-mono text-lg">{code}</span>
                      <button
                        onClick={() => copyToClipboard(code)}
                        className="flex items-center space-x-1 px-3 py-1 bg-ice-blue/20 border border-ice-blue/50 text-ice-blue rounded text-sm font-mono hover:bg-ice-blue/30 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copied === `admin-${index}` ? 'COPIATO!' : 'COPIA'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manager Codes */}
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <h3 className="text-purple-400 font-mono font-bold mb-3">CODICI GESTORI</h3>
                <div className="space-y-2">
                  {Object.values(managers).filter(m => m.isActive).map((manager) => (
                    <div key={manager.code} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                      <div>
                        <span className="text-white font-mono text-lg">{manager.code}</span>
                        <div className="text-purple-400/60 text-sm font-mono">{manager.name}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(manager.code)}
                        className="flex items-center space-x-1 px-3 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded text-sm font-mono hover:bg-purple-500/30 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>COPIA</span>
                      </button>
                    </div>
                  ))}
                  {Object.values(managers).filter(m => m.isActive).length === 0 && (
                    <div className="text-center text-purple-400/60 font-mono py-4">
                      Nessun gestore attivo
                    </div>
                  )}
                </div>
              </div>

              {/* Team Codes */}
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <h3 className="text-green-400 font-mono font-bold mb-3">CODICI SQUADRE ATTIVE</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.values(teams).filter(team => {
                    const tournament = tournaments[team.tournamentId];
                    return tournament && tournament.status === 'active';
                  }).map((team) => (
                    <div key={team.code} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                      <div>
                        <span className="text-white font-mono text-lg">{team.code}</span>
                        <div className="text-green-400/60 text-sm font-mono">{team.name}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(team.code)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-sm font-mono hover:bg-green-500/30 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>COPIA</span>
                      </button>
                    </div>
                  ))}
                  {Object.values(teams).filter(team => {
                    const tournament = tournaments[team.tournamentId];
                    return tournament && tournament.status === 'active';
                  }).length === 0 && (
                    <div className="text-center text-green-400/60 font-mono py-4">
                      Nessuna squadra attiva
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowLoginCodes(false)}
                className="px-6 py-3 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors font-mono"
              >
                CHIUDI
              </button>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}