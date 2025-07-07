export interface Team {
  id: string;
  name: string;
  code: string;
  lobby: string;
  lobbyNumber?: number;
  createdAt: number;
  tournamentId: string;
  playerName?: string;
  clanName?: string;
}

export interface Match {
  id: string;
  position: number;
  kills: number;
  score: number;
  teamCode: string;
  photos: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  tournamentId: string;
  rejectionReason?: string;
}

export interface ScoreAdjustment {
  id: string;
  teamCode: string;
  teamName: string;
  points: number;
  reason: string;
  type: 'penalty' | 'reward' | 'crash';
  appliedAt: number;
  appliedBy: string;
  tournamentId: string;
}

export interface TeamStats {
  teamName: string;
  teamCode: string;
  matches: Match[];
  adjustments: ScoreAdjustment[];
  totalScore: number;
  adjustmentTotal: number;
  finalScore: number;
  rank: number;
  currentPosition?: number;
}

export interface PendingSubmission {
  id: string;
  teamCode: string;
  teamName: string;
  position: number;
  kills: number;
  photos: string[];
  section?: string;
  lobby?: string;
  submittedAt: number;
  tournamentId: string;
}

export interface CrashReport {
  id: string;
  teamCode: string;
  teamName: string;
  photo: string;
  description: string;
  submittedAt: number;
  status: 'pending' | 'approved' | 'rejected';
  compensation?: number;
  tournamentId: string;
}

export interface Report {
  id: string;
  teamCode: string;
  teamName: string;
  reportedPlayer: string;
  video: string;
  description: string;
  submittedAt: number;
  status: 'pending' | 'reviewed' | 'resolved';
  tournamentId: string;
}

export interface Manager {
  id: string;
  name: string;
  code: string;
  permissions: string[];
  createdAt: number;
  createdBy: string;
  isActive: boolean;
  assignedTournaments?: string[];
}

export interface Tournament {
  id: string;
  name: string;
  type: 'Ritorno' | 'BR';
  status: 'active' | 'completed' | 'archived';
  startDate?: string;
  startTime: string;
  createdAt: number;
  endedAt?: number;
  completedAt?: number;
  createdBy: string;
  assignedManagers: string[];
  settings: {
    lobbies: number;
    slotsPerLobby: number;
    totalMatches: number;
    countedMatches: number;
  };
  finalLeaderboard?: TeamStats[];
  isDemo?: boolean;
  teams?: Record<string, Team>;
  matches?: Match[];
  endDate?: number;
  section?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  performedByType: 'admin' | 'manager' | 'team';
  timestamp: number;
  tournamentId?: string;
  targetTeam?: string;
  metadata?: Record<string, any>;
  section?: string;
}

export type UserType = 'admin' | 'manager' | 'team' | null;