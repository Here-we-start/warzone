const [activeTab, setActiveTab] = useState<'tournaments' | 'teams' | 'scores' | 'pending' | 'adjustments' | 'managers' | 'archive' | 'audit'>('tournaments');
  const [copied, setCopied] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showManualSubmission, setShowManualSubmission] = useState(false);

  // Raggruppa le submission pendenti per team
  const pendingByTeam = pendingSubmissions.reduce((acc, submission) => {
  }
  )

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
    }
  }

import TournamentArchive from './TournamentArchive';
import AuditLogViewer from './AuditLogViewer';
import OBSPluginManager from './OBSPluginManager';
import ScoreAssignment from './ScoreAssignment';
import { exportLeaderboardImage, exportLeaderboardCSV } from '../utils/exportUtils';
import { useRealTimeData } from '../hooks/useRealTimeData';

          { id: 'tournaments', label: 'TORNEI', icon: Trophy },
          { id: 'teams', label: 'SQUADRE', icon: Users },
          { id: 'scores', label: 'PUNTEGGI', icon: Target },
          { id: 'pending', label: 'APPROVAZIONI', icon: Clock, badge: pendingSubmissions.length },

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
                  {item.badge && item.badge > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {item.badge}
                    </div>
                  )}
                </button>
              ))}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <TeamManagement
            teams={teams}
            setTeams={setTeams}
            tournaments={tournaments}
            auditLogs={auditLogs}
            setAuditLogs={setAuditLogs}
          />
        )}

        {/* Score Assignment Tab */}
        {activeTab === 'scores' && activeTournament && (
          <ScoreAssignment
            teams={Object.values(teams).filter(team => team.tournamentId === activeTournament.id)}
            matches={matches}
            setMatches={setMatches}
            tournament={activeTournament}
            auditLogs={auditLogs}
            setAuditLogs={setAuditLogs}
            userRole="admin"
            userName="admin"
            multipliers={multipliers}
          />
        )}

        {/* Pending Submissions Tab */

        {!activeTournament && activeTab === 'scores' && (
          <GlassPanel className="p-8 text-center">
            <div className="text-ice-blue/60 font-mono">
              <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">Seleziona un torneo attivo per assegnare punteggi</p>
            </div>
          </GlassPanel>
        )}

        {!activeTournament && activeTab === 'pending' && (

                      <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                        <div className="text-white font-mono text-lg">{code}</div>
                        <div>
                          <button
                            onClick={() => copyToClipboard(code)}
                            className="flex items-center space-x-1 px-3 py-1 bg-ice-blue/20 border border-ice-blue/50 text-ice-blue rounded text-sm font-mono hover:bg-ice-blue/30 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copied === `admin-${index}` ? 'COPIATO!' : 'COPIA'}</span>
                          </button>
                        </div>
                        <div className="text-white font-mono text-lg">{manager.code}</div>
                        <div className="text-purple-400/60 text-sm font-mono">{manager.name}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(manager.code)}
                        className="flex items-center space-x-1 px-3 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded text-sm font-mono hover:bg-purple-500/30 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copied === manager.code ? 'COPIATO!' : 'COPIA'}</span>
                      </button>

                        <div className="text-green-400/60 text-sm font-mono">{team.name}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(team.code)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-sm font-mono hover:bg-green-500/30 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copied === team.code ? 'COPIATO!' : 'COPIA'}</span>
                      </button>

  const exportImage = async () => {
    const element = document.getElementById('leaderboard-table');
    if (!element) return;

    try {
      await exportLeaderboardImage(
        'leaderboard-table',
        `classifica_${activeTournament?.name || 'tournament'}.png`,
        {
          backgroundColor: '#000000',
          theme: 'dark',
          includeTimestamp: true,
          customStyles: `
            border: 2px solid #a1e0ff !important;
            box-shadow: 0 0 30px rgba(161, 224, 255, 0.3) !important;
          `
        }
      );

      // Log action

  const exportCSV = () => {
    const leaderboard = getLeaderboard();
    exportLeaderboardCSV(leaderboard, activeTournament?.name || 'tournament', true);

    // Log action