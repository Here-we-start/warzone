import React, { useState, useEffect } from 'react';
import { Trophy, Target, Users, Image as ImageIcon, LogOut, Zap, Clock, CheckCircle, XCircle, AlertTriangle, Award, Menu, X, Upload, Flag } from 'lucide-react';
import GlassPanel from './GlassPanel';
import PhotoUpload from './PhotoUpload';
import CrashReportUpload from './CrashReportUpload';
import ReportUpload from './ReportUpload';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { Match, PendingSubmission, Team, ScoreAdjustment, Tournament } from '../types';
import html2canvas from 'html2canvas';

// Maximum number of pending submissions allowed per team
const MAX_PENDING_SUBMISSIONS = 10;

interface TeamDashboardProps {
  teamCode: string;
  tournamentId: string;
  onLogout: () => void;
}

export default function TeamDashboard({ teamCode, tournamentId, onLogout }: TeamDashboardProps) {
  const [activeTab, setActiveTab] = useState<'matches' | 'crash' | 'report'>('matches');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [teams, setTeams] = useRealTimeData<Record<string, Team>>('teams', {});
  const [tournaments] = useRealTimeData<Record<string, Tournament>>('tournaments', {});
  const [matches] = useRealTimeData<Match[]>('matches', []);
  const [pendingSubmissions, setPendingSubmissions] = useRealTimeData<PendingSubmission[]>('pendingSubmissions', []);
  const [scoreAdjustments] = useRealTimeData<ScoreAdjustment[]>('scoreAdjustments', []);
  const [multipliers] = useRealTimeData('multipliers', {
    1: 2.0, 2: 1.8, 3: 1.8, 4: 1.6, 5: 1.6, 6: 1.6,
    7: 1.4, 8: 1.4, 9: 1.4, 10: 1.4, 11: 1.0, 12: 1.0,
    13: 1.0, 14: 1.0, 15: 1.0, 16: 1.0, 17: 1.0, 18: 1.0,
    19: 1.0, 20: 1.0
  });
  
  const [position, setPosition] = useState(1);
  const [kills, setKills] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clanName, setClanName] = useState('');
  const [showSubmissionForm, setShowSubmissionForm] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false);

  // Find team and tournament
  const currentTeam = Object.values(teams).find(team => team.code === teamCode);
  const currentTournament = tournaments[tournamentId];
  const actualTeamName = currentTeam?.name || teamCode;

  // Check if this is first time login
  useEffect(() => {
    if (currentTeam && (!currentTeam.clanName || !currentTeam.playerName)) {
      setShowFirstTimeSetup(true);
    }
  }, [currentTeam]);

  const teamMatches = matches.filter(match => 
    match.teamCode === teamCode && 
    match.tournamentId === tournamentId && 
    match.status === 'approved'
  );
  const teamPending = pendingSubmissions.filter(sub => 
    sub.teamCode === teamCode && 
    sub.tournamentId === tournamentId
  );
  
  const teamAdjustments = scoreAdjustments.filter(adj => 
    adj.teamCode === teamCode && 
    adj.tournamentId === tournamentId
  );
  
  const totalSubmissions = teamMatches.length + teamPending.length;
  const maxMatches = currentTournament?.settings.totalMatches || 4;
  const canAddMatch = totalSubmissions < maxMatches && teamPending.length < MAX_PENDING_SUBMISSIONS;

  const saveFirstTimeSetup = () => {
    if (!clanName.trim() || !playerName.trim() || !currentTeam) return;

    setTeams(prev => ({
      ...prev,
      [currentTeam.id]: {
        ...currentTeam,
        clanName: clanName.trim(),
        playerName: playerName.trim()
      }
    }));

    setShowFirstTimeSetup(false);
  };

  const addMatch = async () => {
    if (!canAddMatch || kills < 0 || position < 1 || photos.length < 2) return;

    setIsSubmitting(true);
    
    // Cinematic delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));

    const newSubmission: PendingSubmission = {
      id: `${teamCode}-${Date.now()}`,
      teamCode,
      teamName: actualTeamName,
      position,
      kills,
      photos: [...photos],
      submittedAt: Date.now(),
      tournamentId
    };

    setPendingSubmissions(prev => [...prev, newSubmission]);
    setKills(0);
    setPosition(1);
    setPhotos([]);
    setIsSubmitting(false);
  };
  
  // Funzione per creare una nuova submission
  const startNewSubmission = () => {
    setPosition(1);
    setKills(0);
    setPhotos([]);
    setShowSubmissionForm(true);
  };

  const getBestScores = () => {
    const countedMatches = currentTournament?.settings.countedMatches || 3;
    return teamMatches
      .map(match => match.score)
      .sort((a, b) => b - a)
      .slice(0, countedMatches);
  };

  const getTotalScore = () => {
    const bestScores = getBestScores();
    return bestScores.reduce((sum, score) => sum + score, 0);
  };

  const getAdjustmentTotal = () => {
    return teamAdjustments.reduce((sum, adj) => sum + adj.points, 0);
  };

  const getFinalScore = () => {
    return getTotalScore() + getAdjustmentTotal();
  };

  const getCurrentPosition = () => {
    // Calculate current position in tournament leaderboard
    const tournamentTeams = Object.values(teams).filter(team => team.tournamentId === tournamentId);
    const leaderboard = tournamentTeams.map(team => {
      const tMatches = matches.filter(m => m.teamCode === team.code && m.tournamentId === tournamentId && m.status === 'approved');
      const tAdjustments = scoreAdjustments.filter(adj => adj.teamCode === team.code && adj.tournamentId === tournamentId);
      
      const countedMatches = currentTournament?.settings.countedMatches || 3;
      const bestScores = tMatches.map(m => m.score).sort((a, b) => b - a).slice(0, countedMatches);
      const totalScore = bestScores.reduce((sum, score) => sum + score, 0);
      const adjustmentTotal = tAdjustments.reduce((sum, adj) => sum + adj.points, 0);
      const finalScore = totalScore + adjustmentTotal;
      
      return { teamCode: team.code, finalScore };
    }).sort((a, b) => b.finalScore - a.finalScore);

    const position = leaderboard.findIndex(team => team.teamCode === teamCode) + 1;
    return position > 0 ? position : null;
  };

  const exportImage = async () => {
    const element = document.getElementById('team-stats');
    if (!element) return;

    try {
      const canvas = await html2canvas(element);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `stats_${actualTeamName.toLowerCase().replace(/\s+/g, '_')}.png`;
      a.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const getSubmissionStatus = (index: number) => {
    if (index < teamMatches.length) {
      return { status: 'approved', match: teamMatches[index] };
    } else if (index < totalSubmissions) {
      const pendingIndex = index - teamMatches.length;
      return { status: 'pending', submission: teamPending[pendingIndex] };
    }
    return { status: 'empty' };
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentPosition = getCurrentPosition();

  if (!currentTournament) {
    return (
      <div className="min-h-screen p-4 relative z-10 flex items-center justify-center">
        <GlassPanel className="p-8 text-center">
          <div className="text-ice-blue/60 font-mono">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">Torneo non trovato</p>
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

  // First time setup modal
  if (showFirstTimeSetup) {
    return (
      <div className="min-h-screen p-4 relative z-10 flex items-center justify-center">
        <GlassPanel className="w-full max-w-md p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-ice-blue/20 to-ice-blue-dark/20 mb-4 relative">
              <Users className="w-8 h-8 text-ice-blue" />
            </div>
            <h2 className="text-2xl font-bold text-white font-mono">BENVENUTO</h2>
            <p className="text-ice-blue/80 font-mono text-sm mt-2">
              Completa la registrazione per {currentTournament.name}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-ice-blue mb-2 font-mono text-sm">Tag Clan</label>
              <input
                type="text"
                value={clanName}
                onChange={(e) => setClanName(e.target.value)}
                placeholder="Nome della squadra"
                className="w-full px-4 py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white placeholder-ice-blue/60 focus:outline-none focus:border-ice-blue font-mono"
              />
            </div>

            <div>
              <label className="block text-ice-blue mb-2 font-mono text-sm">Nome Giocatore</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Nome in-game o Discord"
                className="w-full px-4 py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white placeholder-ice-blue/60 focus:outline-none focus:border-ice-blue font-mono"
              />
            </div>

            <button
              onClick={saveFirstTimeSetup}
              disabled={!clanName.trim() || !playerName.trim()}
              className="w-full py-3 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-mono"
            >
              CONTINUA
            </button>
          </div>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <GlassPanel className="p-4 sm:p-6 mb-4 sm:mb-6 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-ice-blue/20 to-ice-blue-dark/20 relative">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-ice-blue" />
                <div className="absolute inset-0 rounded-full bg-ice-blue/10 animate-ping" />
              </div> 
              <div className="overflow-hidden">
                <div className="text-ice-blue/80 font-mono text-xs sm:text-sm">
                  {currentTournament.name}
                  {currentTournament.isDemo && (
                    <span className="ml-2 px-2 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded text-xs">
                      DEMO
                    </span>
                  )}
                </div>
                <h1 className="text-lg sm:text-3xl font-bold text-white font-mono tracking-wider">
                  {actualTeamName.toUpperCase()}
                </h1>
                <p className="text-ice-blue/80 font-mono text-xs sm:text-base">
                  Team ID: <span className="text-ice-blue font-bold">********</span>
                  {currentPosition && (
                    <span className="ml-2 text-yellow-400">• #{currentPosition} in classifica</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 text-ice-blue hover:bg-ice-blue/10 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-300 hover:scale-105 font-mono text-xs sm:text-sm"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">LOGOUT</span>
              </button>
            </div>
          </div>
        </GlassPanel>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <GlassPanel className="sm:hidden p-4 mb-4 animate-fade-in">
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                onClick={() => {
                  setActiveTab('matches');
                  setMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center space-y-1 px-3 py-3 rounded-xl font-mono transition-all duration-300 ${
                  activeTab === 'matches'
                    ? 'bg-ice-blue/20 text-ice-blue border border-ice-blue/50'
                    : 'text-ice-blue/60 hover:text-ice-blue hover:bg-ice-blue/10'
                }`}
              >
                <Target className="w-4 h-4" />
                <span className="text-xs">PARTITE</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('crash');
                  setMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center space-y-1 px-3 py-3 rounded-xl font-mono transition-all duration-300 ${
                  activeTab === 'crash'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                    : 'text-orange-400/60 hover:text-orange-400 hover:bg-orange-500/10'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs">CRASH</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('report');
                  setMobileMenuOpen(false);
                }}
                className={`flex flex-col items-center space-y-1 px-3 py-3 rounded-xl font-mono transition-all duration-300 ${
                  activeTab === 'report'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                    : 'text-red-400/60 hover:text-red-400 hover:bg-red-500/10'
                }`}
              >
                <Flag className="w-4 h-4" />
                <span className="text-xs">REPORT</span>
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-mono text-xs"
              >
                <Trophy className="w-4 h-4" />
                <span>{showLeaderboard ? 'NASCONDI' : 'MOSTRA'} CLASSIFICA</span>
              </button>
              <button
                onClick={exportImage}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono text-xs"
              >
                <ImageIcon className="w-4 h-4" />
                <span>ESPORTA STATISTICHE</span>
              </button>
            </div>
          </GlassPanel>
        )}

        {/* Desktop Tabs */}
        <GlassPanel className="hidden sm:block p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('matches')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-mono transition-all duration-300 ${
                  activeTab === 'matches'
                    ? 'bg-ice-blue/20 text-ice-blue border border-ice-blue/50'
                    : 'text-ice-blue/60 hover:text-ice-blue hover:bg-ice-blue/10'
                }`}
              >
                <Target className="w-5 h-5" />
                <span>PARTITE</span>
              </button>
              <button
                onClick={() => setActiveTab('crash')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-mono transition-all duration-300 ${
                  activeTab === 'crash'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                    : 'text-orange-400/60 hover:text-orange-400 hover:bg-orange-500/10'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
                <span>CRASH</span>
              </button>
              <button
                onClick={() => setActiveTab('report')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-mono transition-all duration-300 ${
                  activeTab === 'report'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                    : 'text-red-400/60 hover:text-red-400 hover:bg-red-500/10'
                }`}
              >
                <Flag className="w-5 h-5" />
                <span>SEGNALAZIONI</span>
              </button>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-mono text-sm"
              >
                <Trophy className="w-4 h-4" />
                <span>{showLeaderboard ? 'NASCONDI' : 'MOSTRA'} CLASSIFICA</span>
              </button>
              <button
                onClick={exportImage}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono text-sm"
              >
                <ImageIcon className="w-4 h-4" />
                <span>ESPORTA</span>
              </button>
            </div>
          </div>
        </GlassPanel>

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Score Input */}
            <GlassPanel className="p-4 sm:p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 font-mono flex items-center space-x-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-ice-blue" />
                <span>INSERISCI PUNTEGGIO</span>
                {teamPending.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded text-xs">
                    {teamPending.length} in attesa
                  </span>
                )}
              </h2>

              {!showSubmissionForm && (
                <div className="text-center py-6 sm:py-8 animate-fade-in">
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mb-4">
                      <Clock className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2 font-mono">RICHIESTE IN ATTESA</h3>
                    <p className="text-ice-blue/80 font-mono text-sm sm:text-base">
                      Hai {teamPending.length} {teamPending.length === 1 ? 'richiesta' : 'richieste'} in attesa di approvazione
                    </p>
                  </div>
                  
                  {canAddMatch && (
                    <button
                      onClick={startNewSubmission}
                      className="px-6 py-3 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 font-mono"
                    >
                      INVIA NUOVA PARTITA
                    </button>
                  )}
                  
                  {!canAddMatch && teamPending.length >= MAX_PENDING_SUBMISSIONS && (
                    <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                      <div className="flex items-center space-x-2 text-orange-400 font-mono text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Hai raggiunto il limite di {MAX_PENDING_SUBMISSIONS} richieste in attesa</span>
                      </div>
                    </div>
                  )}
                  
                  {!canAddMatch && totalSubmissions >= maxMatches && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center space-x-2 text-green-400 font-mono text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Hai completato tutte le {maxMatches} partite disponibili</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {canAddMatch && showSubmissionForm ? (
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-ice-blue mb-2 font-mono text-sm">Posizione</label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(Number(e.target.value))}
                      disabled={isSubmitting}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white focus:outline-none focus:border-ice-blue font-mono disabled:opacity-50 text-sm sm:text-base"
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>
                          {num}° posto (x{multipliers[num] || 1})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-ice-blue mb-2 font-mono text-sm">Kills</label>
                    <input
                      type="number"
                      value={kills}
                      onChange={(e) => setKills(Number(e.target.value))}
                      min="0"
                      disabled={isSubmitting}
                      placeholder="Numero di eliminazioni"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border border-ice-blue/40 rounded-xl text-white placeholder-ice-blue/60 focus:outline-none focus:border-ice-blue font-mono disabled:opacity-50 text-sm sm:text-base"
                    />
                  </div>

                  <PhotoUpload
                    photos={photos}
                    onPhotosChange={setPhotos}
                    maxPhotos={2}
                    required={true}
                  />

                  <button
                    onClick={addMatch}
                    disabled={kills < 0 || isSubmitting || photos.length < 2}
                    className="w-full py-3 sm:py-4 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-mono relative overflow-hidden text-sm sm:text-base mb-2"
                  >
                    {isSubmitting && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    )}
                    <div className="flex items-center justify-center space-x-2">
                      <Zap className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                      <span>{isSubmitting ? 'INVIO IN CORSO...' : 'INVIA PER APPROVAZIONE'}</span>
                    </div>
                  </button>
                  
                  {teamPending.length > 0 && (
                    <button
                      onClick={() => setShowSubmissionForm(false)}
                      className="w-full py-2 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors font-mono text-sm"
                    >
                      VISUALIZZA RICHIESTE IN ATTESA ({teamPending.length})
                    </button>
                  )}

                  <div className="text-center text-ice-blue/60 text-xs sm:text-sm font-mono bg-black/20 rounded-lg p-3">
                    <div>Partite rimanenti: <span className="text-ice-blue font-bold">{maxMatches - totalSubmissions}</span></div>
                    <div>Richieste in attesa: <span className="text-yellow-400 font-bold">{teamPending.length}/{MAX_PENDING_SUBMISSIONS}</span></div>
                  </div>
                </div>
              ) : !showSubmissionForm ? null : (
                <div className="text-center py-6 sm:py-8 animate-fade-in">
                  <div className="text-4xl sm:text-6xl mb-4 animate-pulse">🔒</div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 font-mono">MISSIONE COMPLETATA</h3>
                  <p className="text-ice-blue/80 font-mono text-sm sm:text-base">
                    {totalSubmissions >= maxMatches 
                      ? `Hai completato tutte le ${maxMatches} partite disponibili` 
                      : `Hai raggiunto il limite di ${MAX_PENDING_SUBMISSIONS} richieste in attesa`}
                  </p>
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <span className="text-green-400 font-mono text-xs sm:text-sm">STATUS: OPERATIVO</span>
                  </div>
                </div>
              )}
            </GlassPanel>

            {/* Team Stats */}
            <GlassPanel className="p-4 sm:p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-white font-mono flex items-center space-x-2">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-ice-blue" />
                  <span>STATISTICHE</span>
                </h2>
              </div>

              <div id="team-stats" className="space-y-3 sm:space-y-4">
                {/* Score Breakdown */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="p-3 sm:p-4 bg-black/20 border border-ice-blue/20 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-ice-blue font-mono text-sm sm:text-base">Punteggio Partite:</span>
                      <span className="text-ice-blue font-mono text-base sm:text-lg font-bold">{getTotalScore().toFixed(1)}</span>
                    </div>
                  </div>
                  
                  {teamAdjustments.length > 0 && (
                    <div className={`p-3 sm:p-4 border rounded-xl ${
                      getAdjustmentTotal() >= 0 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="text-ice-blue font-mono text-sm sm:text-base">Modifiche Admin:</span>
                        <span className={`font-mono text-base sm:text-lg font-bold ${
                          getAdjustmentTotal() >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {getAdjustmentTotal() > 0 ? '+' : ''}{getAdjustmentTotal().toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-4 sm:p-6 bg-gradient-to-r from-ice-blue/20 to-ice-blue-dark/20 border border-ice-blue/50 rounded-xl text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-ice-blue/5 to-transparent animate-shimmer" 
                         style={{ animationDuration: '3s' }} />
                    <div className="text-2xl sm:text-4xl font-bold text-ice-blue font-mono mb-2">{getFinalScore().toFixed(1)}</div>
                    <div className="text-ice-blue/80 font-mono text-sm sm:text-base">PUNTEGGIO FINALE</div>
                    {currentPosition && (
                      <div className="text-yellow-400 font-mono text-xs sm:text-sm mt-1">
                        #{currentPosition} in classifica
                      </div>
                    )}
                  </div>
                </div>

                {/* Match History */}
                <div className="space-y-2">
                  <h3 className="text-white font-bold font-mono flex items-center space-x-2 text-sm sm:text-base">
                    <span>CRONOLOGIA PARTITE</span>
                    {teamPending.length > 0 && (
                      <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded text-xs">
                        {teamPending.length} in attesa
                      </span>
                    )}
                    <div className="flex-1 h-px bg-gradient-to-r from-ice-blue/50 to-transparent" />
                  </h3>
                  {Array.from({ length: maxMatches }, (_, i) => {
                    const submissionStatus = getSubmissionStatus(i);
                    return (
                      <div
                        key={i}
                        className={`p-2 sm:p-3 rounded-lg border transition-all duration-300 animate-fade-in ${
                          submissionStatus.status === 'approved'
                            ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/15'
                            : submissionStatus.status === 'pending'
                            ? 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/15'
                            : 'bg-black/20 border-ice-blue/10 opacity-50'
                        }`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {submissionStatus.status === 'approved' && submissionStatus.match ? (
                          <div className="flex justify-between items-center">
                            <div className="font-mono text-white flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                              <span className="text-green-400">Partita {i + 1}:</span> 
                              <span>{submissionStatus.match.position}° posto</span>
                            </div>
                            <div className="text-right font-mono">
                              <div className="text-green-400 font-bold text-xs sm:text-sm">{submissionStatus.match.score.toFixed(1)} pt</div>
                              <div className="text-green-400/60 text-xs">{submissionStatus.match.kills} kills</div>
                            </div>
                          </div>
                        ) : submissionStatus.status === 'pending' && submissionStatus.submission ? (
                          <div className="flex justify-between items-center">
                            <div className="font-mono text-white flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 animate-spin" />
                              <span className="text-yellow-400">Partita {i + 1}:</span> 
                              <span>In attesa</span>
                            </div>
                            <div className="text-right font-mono">
                              <div className="text-yellow-400 font-bold text-xs sm:text-sm">{submissionStatus.submission.position}° posto</div>
                              <div className="text-yellow-400/60 text-xs">{submissionStatus.submission.kills} kills</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-ice-blue/50 font-mono text-center text-xs sm:text-sm">
                            Partita {i + 1} - In attesa
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Progress */}
                <div className="pt-3 sm:pt-4">
                  <div className="flex justify-between text-xs sm:text-sm font-mono text-ice-blue/80 mb-2">
                    <span>Progresso Missione</span>
                    <span>{teamMatches.length} completate + {teamPending.length} in attesa = {totalSubmissions}/{maxMatches}</span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-2 sm:h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-ice-blue to-ice-blue-dark h-2 sm:h-3 rounded-full transition-all duration-1000 relative overflow-hidden"
                      style={{ width: `${(totalSubmissions / maxMatches) * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      {teamPending.length > 0 && (
                        <div 
                          className="absolute top-0 right-0 h-full bg-yellow-400/50"
                          style={{ width: `${(teamPending.length / maxMatches) * 100}%` }}
                        ></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>
        )}

        {/* Crash Tab */}
        {activeTab === 'crash' && (
          <CrashReportUpload
            teamCode={teamCode}
            teamName={actualTeamName}
            tournamentId={tournamentId}
          />
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <ReportUpload
            teamCode={teamCode}
            teamName={actualTeamName}
            tournamentId={tournamentId}
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
    </div>
  );
}