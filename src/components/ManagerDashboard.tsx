@@ .. @@
   const [activeTab, setActiveTab] = useState<'scores' | 'pending' | 'adjustments'>('scores');
+  const [activeTab, setActiveTab] = useState<'scores' | 'assignment' | 'pending' | 'adjustments'>('scores');
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
@@ .. @@
 import MultiplierSettings from './MultiplierSettings';
 import PendingSubmissions from './PendingSubmissions';
 import ManualSubmission from './ManualSubmission';
 import PenaltiesRewards from './PenaltiesRewards';
+import ScoreAssignment from './ScoreAssignment';
 import { useRealTimeData } from '../hooks/useRealTimeData';
@@ .. @@
   const tabItems = [
     { id: 'scores', label: 'PUNTEGGI', icon: Trophy },
+    { id: 'assignment', label: 'ASSEGNA', icon: Target },
     { id: 'pending', label: 'APPROVAZIONI', icon: Clock, badge: tournamentPending.length },
@@ .. @@
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
@@ .. @@
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

+        {/* Score Assignment Tab */}
+        {activeTab === 'assignment' && (
+          <ScoreAssignment
+            teams={tournamentTeams}
+            matches={matches}
+            setMatches={setMatches}
+            tournament={currentTournament}
+            auditLogs={auditLogs}
+            setAuditLogs={setAuditLogs}
+            userRole="manager"
+            userName={managerName}
+            multipliers={multipliers}
+          />
+        )}
+
         {/* Penalties & Rewards Tab */}