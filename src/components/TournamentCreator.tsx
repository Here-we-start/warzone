@@ .. @@
 import { Tournament, Manager, AuditLog } from '../types';
 import { logAction } from '../utils/auditLogger';
 import ApiService from '../services/api';
+import MultiplierSettings from './MultiplierSettings';

 interface TournamentCreatorProps {
 }
@@ .. @@
   const [lobbies, setLobbies] = useState(2);
   const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
   const [isCreating, setIsCreating] = useState(false);
+  const [showMultiplierSettings, setShowMultiplierSettings] = useState(false);
+  const [customMultipliers, setCustomMultipliers] = useState<Record<number, number> | null>(null);

   const activeManagers = Object.values(managers).filter(m => m.isActive);
@@ .. @@
           {/* Tournament Settings Preview */}
           <div className="p-4 bg-black/20 border border-ice-blue/20 rounded-lg">
             <h3 className="text-ice-blue font-mono text-sm mb-3">CONFIGURAZIONE TORNEO:</h3>
             <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <div className="text-ice-blue/60">Lobby:</div>
                <div className="text-white font-bold">{lobbies}</div>
              </div>
              <div>
                <div className="text-ice-blue/60">Slot per Lobby:</div>
                <div className="text-white font-bold">
                  {tournamentType === 'Ritorno' ? '15' : '50'}
                </div>
              </div>
              <div>
                <div className="text-ice-blue/60">Partite:</div>
                <div className="text-white font-bold">{countedMatches}/{totalMatches}</div>
              </div>
              <div>
                <div className="text-ice-blue/60">Gestori:</div>
                <div className="text-white font-bold">{selectedManagers.length}</div>
              </div>
              <div>
                <div className="text-ice-blue/60">Data:</div>
                <div className="text-white font-bold">{startDate || 'Oggi'}</div>
              </div>
              <div>
                <div className="text-ice-blue/60">Orario:</div>
                <div className="text-white font-bold">{startTime || '20:00'}</div>
              </div>
+              <div className="col-span-2">
+                <div className="text-ice-blue/60">Moltiplicatori:</div>
+                <div className="flex items-center justify-between">
+                  <span className="text-white font-bold">
+                    {customMultipliers ? 'Personalizzati' : 'Standard'}
+                  </span>
+                  <button
+                    onClick={() => setShowMultiplierSettings(true)}
+                    className="text-ice-blue hover:text-white transition-colors text-xs underline"
+                  >
+                    Configura
+                  </button>
+                </div>
+              </div>
            </div>
          </div>
@@ .. @@
           </div>
         </div>
       </GlassPanel>
+
+      {/* Multiplier Settings Modal */}
+      <MultiplierSettings
+        isOpen={showMultiplierSettings}
+        onClose={() => setShowMultiplierSettings(false)}
+        multipliers={customMultipliers || undefined}
+        onSave={(newMultipliers) => setCustomMultipliers(newMultipliers)}
+      />
     </div>