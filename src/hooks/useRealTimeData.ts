@@ .. @@
   // Carica dati iniziali dal backend
   const fetchData = async () => {
     try {
       setIsLoading(true);
       setError(null);
       
       let result;
       switch (key) {
         case 'tournaments':
           result = await ApiService.getTournaments();
           // Converte array in oggetto con ID come chiave
           const tournamentsObject = result.tournaments?.reduce((acc: any, tournament: any) => {
             acc[tournament._id || tournament.id] = {
               ...tournament,
               id: tournament._id || tournament.id
             };
             return acc;
           }, {}) || {};
           setData(tournamentsObject as T);
+          
+          // Broadcast per sincronizzazione globale
+          if (typeof BroadcastChannel !== 'undefined') {
+            const channel = new BroadcastChannel('warzone-global-sync');
+            Object.values(tournamentsObject).forEach((tournament: any) => {
+              channel.postMessage({
+                type: 'tournament-created',
+                tournamentId: tournament.id,
+                tournament: tournament
+              });
+            });
+            channel.close();
+          }
           break;
           
+        case 'managers':
+          result = await ApiService.getManagers();
+          const managersObject = result.managers?.reduce((acc: any, manager: any) => {
+            acc[manager.code] = {
+              ...manager,
+              id: manager._id || manager.id
+            };
+            return acc;
+          }, {}) || {};
+          setData(managersObject as T);
+          
+          // Salva anche in localStorage per accesso offline
+          localStorage.setItem('managers', JSON.stringify(managersObject));
+          break;
+          
         case 'teams':
-          // Per i team, usa localStorage come fallback per mantenere compatibilità
+          result = await ApiService.getTeams('all'); // Carica tutti i team
+          const teamsObject = result.teams?.reduce((acc: any, team: any) => {
+            acc[team.code] = {
+              ...team,
+              id: team._id || team.id
+            };
+            return acc;
+          }, {}) || {};
+          setData(teamsObject as T);
+          
+          // Salva anche in localStorage
+          localStorage.setItem('teams', JSON.stringify(teamsObject));
+          
+          // Fallback a localStorage se API fallisce
           const localTeams = localStorage.getItem('teams');
-          if (localTeams) {
+          if (localTeams && Object.keys(teamsObject).length === 0) {
             setData(JSON.parse(localTeams));
           }
           break;
           
         case 'matches':
+          result = await ApiService.getMatches('all'); // Carica tutte le partite
+          setData((result.matches || []) as T);
+          
+          // Fallback a localStorage
           const localMatches = localStorage.getItem('matches');
-          if (localMatches) {
+          if (localMatches && (!result.matches || result.matches.length === 0)) {
             setData(JSON.parse(localMatches));
           }
           break;
           
-        case 'managers':
-          result = await ApiService.getManagers();
-          const managersObject = result.managers?.reduce((acc: any, manager: any) => {
-            acc[manager.code] = {
-              ...manager,
-              id: manager._id || manager.id
-            };
-            return acc;
-          }, {}) || {};
-          setData(managersObject as T);
-          break;
-          
         case 'auditLogs':
           result = await ApiService.getAuditLogs();
           setData((result.auditLogs || []) as T);
           break;
           
         default:
           // Fallback a localStorage per altri dati
           const localData = localStorage.getItem(key);
           if (localData) {
             setData(JSON.parse(localData));
           }
           break;
       }
     } catch (err) {
       console.error(`❌ Errore caricamento ${key}:`, err);
       setError(err instanceof Error ? err.message : 'Errore di caricamento');
       
       // Fallback a localStorage in caso di errore
       try {
         const localData = localStorage.getItem(key);
         if (localData) {
           setData(JSON.parse(localData));
           console.log(`📱 Fallback a localStorage per ${key}`);
         }
       } catch (localError) {
         console.warn(`⚠️ Fallback localStorage fallito per ${key}:`, localError);
       }
     } finally {
       setIsLoading(false);
     }
   };