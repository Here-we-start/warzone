import React, { useState, useEffect } from 'react';
import { Monitor, Copy, Eye, Settings, Tv, Users, Trophy, Target, Clock, Zap } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { Tournament, Team, Match, ScoreAdjustment } from '../types';

interface StreamingOverlayProps {
  tournamentId: string;
  overlayType: 'leaderboard' | 'compact' | 'minimal' | 'full';
  theme: 'dark' | 'light' | 'transparent';
  showLogos?: boolean;
  showStats?: boolean;
  refreshRate?: number;
}

export default function StreamingOverlay({ 
  tournamentId, 
  overlayType = 'leaderboard',
  theme = 'dark',
  showLogos = true,
  showStats = true,
  refreshRate = 5000
}: StreamingOverlayProps) {
  const [tournaments] = useRealTimeData<Record<string, Tournament>>('tournaments', {});
  const [teams] = useRealTimeData<Record<string, Team>>('teams', {});
  const [matches] = useRealTimeData<Match[]>('matches', []);
  const [scoreAdjustments] = useRealTimeData<ScoreAdjustment[]>('scoreAdjustments', []);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const tournament = tournaments[tournamentId];
  const tournamentTeams = Object.values(teams).filter(team => team.tournamentId === tournamentId);
  const tournamentMatches = matches.filter(match => 
    match.tournamentId === tournamentId && match.status === 'approved'
  );
  const tournamentAdjustments = scoreAdjustments.filter(adj => adj.tournamentId === tournamentId);

  // Auto-refresh for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, refreshRate);

    return () => clearInterval(interval);
  }, [refreshRate]);

  const getLeaderboard = () => {
    const teamStats: Record<string, any> = {};

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
        rank: 0,
        matchesPlayed: 0
      };
    });

    // Add matches
    tournamentMatches.forEach(match => {
      if (teamStats[match.teamCode]) {
        teamStats[match.teamCode].matches.push(match);
        teamStats[match.teamCode].matchesPlayed++;
      }
    });

    // Add adjustments
    tournamentAdjustments.forEach(adjustment => {
      if (teamStats[adjustment.teamCode]) {
        teamStats[adjustment.teamCode].adjustments.push(adjustment);
      }
    });

    // Calculate scores
    Object.values(teamStats).forEach((team: any) => {
      const countedMatches = tournament?.settings.countedMatches || 3;
      const sortedScores = team.matches
        .map((match: any) => match.score)
        .sort((a: number, b: number) => b - a)
        .slice(0, countedMatches);
      team.totalScore = sortedScores.reduce((sum: number, score: number) => sum + score, 0);
      team.adjustmentTotal = team.adjustments.reduce((sum: number, adj: any) => sum + adj.points, 0);
      team.finalScore = team.totalScore + team.adjustmentTotal;
    });

    // Sort and assign ranks
    const sorted = Object.values(teamStats)
      .filter((team: any) => team.matches.length > 0 || team.adjustments.length > 0)
      .sort((a: any, b: any) => b.finalScore - a.finalScore);

    sorted.forEach((team: any, index) => {
      team.rank = index + 1;
    });

    return sorted;
  };

  const leaderboard = getLeaderboard();

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return 'bg-white/95 text-black border-gray-300';
      case 'transparent':
        return 'bg-transparent text-white border-white/30';
      default:
        return 'bg-black/90 text-white border-ice-blue/30';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!tournament) {
    return (
      <div className={`p-4 rounded-lg border ${getThemeClasses()}`}>
        <div className="text-center">
          <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Torneo non trovato</p>
        </div>
      </div>
    );
  }

  // Minimal Overlay (for corner display)
  if (overlayType === 'minimal') {
    const topTeam = leaderboard[0];
    return (
      <div className={`p-3 rounded-lg border ${getThemeClasses()} min-w-[200px]`}>
        <div className="flex items-center space-x-2 mb-2">
          {showLogos && <Trophy className="w-4 h-4 text-yellow-400" />}
          <span className="font-bold text-sm">{tournament.name}</span>
        </div>
        {topTeam && (
          <div className="text-xs">
            <div className="flex justify-between">
              <span>🥇 {topTeam.teamName}</span>
              <span className="font-bold">{topTeam.finalScore.toFixed(1)}</span>
            </div>
          </div>
        )}
        <div className="text-xs opacity-60 mt-1">
          LIVE • {formatTime(lastUpdate)}
        </div>
      </div>
    );
  }

  // Compact Overlay (for side panel)
  if (overlayType === 'compact') {
    return (
      <div className={`p-4 rounded-lg border ${getThemeClasses()} min-w-[300px]`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {showLogos && <Trophy className="w-5 h-5 text-ice-blue" />}
            <span className="font-bold">{tournament.name}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>LIVE</span>
          </div>
        </div>

        <div className="space-y-2">
          {leaderboard.slice(0, 5).map((team, index) => (
            <div key={team.teamCode} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-black' :
                  index === 2 ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'
                }`}>
                  {team.rank}
                </span>
                <span className="font-medium">{team.teamName}</span>
              </div>
              <span className="font-bold">{team.finalScore.toFixed(1)}</span>
            </div>
          ))}
        </div>

        {showStats && (
          <div className="mt-4 pt-3 border-t border-current/20">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Squadre: {tournamentTeams.length}</div>
              <div>Partite: {tournamentMatches.length}</div>
            </div>
          </div>
        )}

        <div className="text-xs opacity-60 mt-2 text-center">
          Aggiornato: {formatTime(lastUpdate)}
        </div>
      </div>
    );
  }

  // Full Leaderboard Overlay
  return (
    <div className={`p-6 rounded-lg border ${getThemeClasses()} min-w-[500px]`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {showLogos && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ice-blue/20 to-ice-blue-dark/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-ice-blue" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{tournament.name}</h1>
            <p className="text-sm opacity-80">{tournament.type} Tournament</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-bold">LIVE</span>
        </div>
      </div>

      <div className="space-y-3">
        {leaderboard.slice(0, 8).map((team, index) => (
          <div
            key={team.teamCode}
            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
              index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent' :
              index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-transparent' :
              index === 2 ? 'bg-gradient-to-r from-orange-600/20 to-transparent' : 
              'bg-current/5'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                index === 0 ? 'bg-yellow-500 text-black' :
                index === 1 ? 'bg-gray-400 text-black' :
                index === 2 ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'
              }`}>
                {team.rank}
              </div>
              <div>
                <div className="font-bold">{team.teamName}</div>
                <div className="text-xs opacity-60">{team.matchesPlayed} partite</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{team.finalScore.toFixed(1)}</div>
              {team.adjustmentTotal !== 0 && (
                <div className={`text-xs ${team.adjustmentTotal > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {team.adjustmentTotal > 0 ? '+' : ''}{team.adjustmentTotal.toFixed(1)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showStats && (
        <div className="mt-6 pt-4 border-t border-current/20">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{tournamentTeams.length}</div>
              <div className="text-xs opacity-60">Squadre</div>
            </div>
            <div>
              <div className="text-lg font-bold">{tournamentMatches.length}</div>
              <div className="text-xs opacity-60">Partite</div>
            </div>
            <div>
              <div className="text-lg font-bold">{tournament.settings.totalMatches}</div>
              <div className="text-xs opacity-60">Max Partite</div>
            </div>
            <div>
              <div className="text-lg font-bold">{tournament.settings.countedMatches}</div>
              <div className="text-xs opacity-60">Contate</div>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs opacity-60 mt-4 text-center">
        Ultimo aggiornamento: {formatTime(lastUpdate)} • © 2025 BM Solution
      </div>
    </div>
  );
}