import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Settings, Upload, Download, Image, Sliders, Target } from 'lucide-react';
import { Team, Match, AuditLog, Tournament, Submission, Multiplier } from '../types';
import Leaderboard from './Leaderboard';
import MultiplierSettings from './MultiplierSettings';
import PendingSubmissions from './PendingSubmissions';
import ManualSubmission from './ManualSubmission';
import PenaltiesRewards from './PenaltiesRewards';
import ScoreAssignment from './ScoreAssignment';
import { exportLeaderboardImage, exportLeaderboardCSV } from '../utils/exportUtils';
import { useRealTimeData } from '../hooks/useRealTimeData';
import html2canvas from 'html2canvas';

interface ManagerDashboardProps {
  teams: Team[];
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  currentTournament: Tournament | null;
  auditLogs: AuditLog[];
  setAuditLogs: (logs: AuditLog[]) => void;
  managerName: string;
  multipliers: Multiplier[];
  setMultipliers: (multipliers: Multiplier[]) => void;
  submissions: Submission[];
  setSubmissions: (submissions: Submission[]) => void;
}

export default function ManagerDashboard({
  teams,
  matches,
  setMatches,
  currentTournament,
  auditLogs,
  setAuditLogs,
  managerName,
  multipliers,
  setMultipliers,
  submissions,
  setSubmissions
}: ManagerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'scores' | 'assignment' | 'pending' | 'adjustments'>('scores');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMultiplierSettings, setShowMultiplierSettings] = useState(false);
  const [showManualSubmission, setShowManualSubmission] = useState(false);
  const [showPenaltiesRewards, setShowPenaltiesRewards] = useState(false);

  // Filter data for current tournament
  const tournamentTeams = teams.filter(team => team.tournamentId === currentTournament?.id);
  const tournamentMatches = matches.filter(match => match.tournamentId === currentTournament?.id);
  const tournamentPending = submissions.filter(sub => 
    sub.tournamentId === currentTournament?.id && sub.status === 'pending'
  );

  // Use real-time data hook
  useRealTimeData(currentTournament?.id || '');

  const getLeaderboard = () => {
    return tournamentTeams.map(team => {
      const teamMatches = tournamentMatches.filter(match => 
        match.team1Id === team.id || match.team2Id === team.id
      );
      
      let totalScore = 0;
      teamMatches.forEach(match => {
        if (match.team1Id === team.id) {
          totalScore += match.team1Score || 0;
        } else {
          totalScore += match.team2Score || 0;
        }
      });

      // Apply multipliers
      const activeMultiplier = multipliers.find(m => 
        m.tournamentId === currentTournament?.id && 
        m.isActive && 
        new Date() >= new Date(m.startTime) && 
        new Date() <= new Date(m.endTime)
      );

      if (activeMultiplier) {
        totalScore *= activeMultiplier.multiplier;
      }

      const adjustmentTotal = team.adjustments?.reduce((sum, adj) => sum + adj.points, 0) || 0;
      const finalScore = totalScore + adjustmentTotal;

      return {
        ...team,
        totalScore,
        adjustmentTotal,
        finalScore,
        matches: teamMatches,
        rank: 0 // Will be calculated after sorting
      };
    }).sort((a, b) => b.finalScore - a.finalScore)
      .map((team, index) => ({ ...team, rank: index + 1 }));
  };

  const tabItems = [
    { id: 'scores', label: 'PUNTEGGI', icon: Trophy },
    { id: 'assignment', label: 'ASSEGNA', icon: Target },
    { id: 'pending', label: 'APPROVAZIONI', icon: Clock, badge: tournamentPending.length },
    { id: 'adjustments', label: 'PENALITÀ/PREMI', icon: Settings }
  ];

  const approveSubmission = (submissionId: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;

    // Update match with submission data
    const updatedMatches = matches.map(match => {
      if (match.id === submission.matchId) {
        return {
          ...match,
          team1Score: submission.team1Score,
          team2Score: submission.team2Score,
          status: 'completed' as const
        };
      }
      return match;
    });
    setMatches(updatedMatches);

    // Update submission status
    const updatedSubmissions = submissions.map(s =>
      s.id === submissionId ? { ...s, status: 'approved' as const } : s
    );
    setSubmissions(updatedSubmissions);

    // Add audit log
    const newLog: AuditLog = {
      id: Date.now().toString(),
      tournamentId: currentTournament?.id || '',
      action: 'approve_submission',
      details: `Approved submission for match ${submission.matchId}`,
      timestamp: new Date().toISOString(),
      userId: 'manager',
      userName: managerName
    };
    setAuditLogs([...auditLogs, newLog]);
  };

  const rejectSubmission = (submissionId: string) => {
    const updatedSubmissions = submissions.map(s =>
      s.id === submissionId ? { ...s, status: 'rejected' as const } : s
    );
    setSubmissions(updatedSubmissions);

    // Add audit log
    const newLog: AuditLog = {
      id: Date.now().toString(),
      tournamentId: currentTournament?.id || '',
      action: 'reject_submission',
      details: `Rejected submission ${submissionId}`,
      timestamp: new Date().toISOString(),
      userId: 'manager',
      userName: managerName
    };
    setAuditLogs([...auditLogs, newLog]);
  };

  const exportCSV = () => {
    const leaderboard = getLeaderboard();
    exportLeaderboardCSV(leaderboard, currentTournament?.name || 'tournament', true);

    // Log action
    const newLog: AuditLog = {
      id: Date.now().toString(),
      tournamentId: currentTournament?.id || '',
      action: 'export_csv',
      details: 'Exported leaderboard as CSV',
      timestamp: new Date().toISOString(),
      userId: 'manager',
      userName: managerName
    };
    setAuditLogs([...auditLogs, newLog]);
  };

  const exportImage = async () => {
    const element = document.getElementById('leaderboard-table');
    if (!element) return;

    try {
      await exportLeaderboardImage(
        'leaderboard-table',
        `classifica_${currentTournament?.name || 'tournament'}_manager.png`,
        {
          backgroundColor: '#000000',
          theme: 'dark',
          includeTimestamp: true,
          customStyles: `
            border: 2px solid #9333ea !important;
            box-shadow: 0 0 30px rgba(147, 51, 234, 0.3) !important;
          `
        }
      );

      // Log action
      const newLog: AuditLog = {
        id: Date.now().toString(),
        tournamentId: currentTournament?.id || '',
        action: 'export_image',
        details: 'Exported leaderboard as image',
        timestamp: new Date().toISOString(),
        userId: 'manager',
        userName: managerName
      };
      setAuditLogs([...auditLogs, newLog]);
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  };

  if (!currentTournament) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Nessun torneo selezionato</h2>
          <p className="text-gray-400">Seleziona un torneo per continuare</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-purple-400">MANAGER DASHBOARD</h1>
            <p className="text-sm text-gray-400">{currentTournament.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Manager</p>
            <p className="font-mono text-sm text-green-400">{managerName}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="flex overflow-x-auto">
          {tabItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === item.id
                  ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="font-mono text-sm">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Scores Tab */}
        {activeTab === 'scores' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <h2 className="text-2xl font-bold text-purple-400">CLASSIFICA</h2>
              <div className="flex gap-2">
                <button
                  onClick={exportCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors font-mono text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={exportImage}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors font-mono text-sm"
                >
                  <Image className="w-4 h-4" />
                  <span>IMG</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Leaderboard 
                  teams={getLeaderboard()} 
                  showActions={false}
                  userRole="manager"
                />
              </div>
              <div className="space-y-4">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-purple-400 mb-4">AZIONI RAPIDE</h3>
                  <div className="space-y-2">
                    {tabItems.slice(1).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as any)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-mono text-sm"
                      >
                        <div className="flex items-center space-x-2">
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && item.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-purple-400 mb-4">STRUMENTI</h3>
                  <div className="space-y-2">
                    {tournamentTeams.map(team => (
                      <div key={team.id} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                        <span className="font-mono text-sm">{team.teamCode}</span>
                        <span className="text-xs text-gray-400">{team.matches?.length || 0} match</span>
                      </div>
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
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* Score Assignment Tab */}
        {activeTab === 'assignment' && (
          <ScoreAssignment
            teams={tournamentTeams}
            matches={matches}
            setMatches={setMatches}
            tournament={currentTournament}
            auditLogs={auditLogs}
            setAuditLogs={setAuditLogs}
            userRole="manager"
            userName={managerName}
            multipliers={multipliers}
          />
        )}

        {/* Penalties & Rewards Tab */}
        {activeTab === 'adjustments' && (
          <PenaltiesRewards
            teams={tournamentTeams}
            setTeams={(updatedTeams) => {
              // Update teams in parent component
              const allTeams = teams.map(team => {
                const updated = updatedTeams.find(t => t.id === team.id);
                return updated || team;
              });
              // This would need to be passed as a prop
            }}
            auditLogs={auditLogs}
            setAuditLogs={setAuditLogs}
            userRole="manager"
            userName={managerName}
          />
        )}
      </div>

      {/* Modals */}
      {showMultiplierSettings && (
        <MultiplierSettings
          multipliers={multipliers}
          setMultipliers={setMultipliers}
          currentTournament={currentTournament}
          onClose={() => setShowMultiplierSettings(false)}
          auditLogs={auditLogs}
          setAuditLogs={setAuditLogs}
          userRole="manager"
          userName={managerName}
        />
      )}

      {showManualSubmission && (
        <ManualSubmission
          teams={tournamentTeams}
          matches={tournamentMatches}
          setMatches={setMatches}
          currentTournament={currentTournament}
          onClose={() => setShowManualSubmission(false)}
          auditLogs={auditLogs}
          setAuditLogs={setAuditLogs}
          userRole="manager"
          userName={managerName}
          multipliers={multipliers}
        />
      )}
    </div>
  );
}