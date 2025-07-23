@@ .. @@
   useEffect(() => {
     // Recupera i dati di sessione dal localStorage
     const savedUserType = localStorage.getItem(USER_TYPE_KEY) as UserType;
     const savedUserId = localStorage.getItem(USER_ID_KEY);
     const savedTournamentId = localStorage.getItem(TOURNAMENT_ID_KEY);
     
     // Se ci sono dati salvati, ripristina la sessione
     if (savedUserType && savedUserId) {
       console.log('🔄 Ripristino sessione da localStorage:', savedUserType);
       setUserType(savedUserType);
       setUserIdentifier(savedUserId);
       if (savedTournamentId) {
         setCurrentTournament(savedTournamentId);
       }
       setShowLogin(false); // Ensure login screen is not shown when session is restored
     }
     
+    // Debug: mostra dati disponibili all'avvio
+    setTimeout(() => {
+      const teams = localStorage.getItem('teams');
+      const managers = localStorage.getItem('managers');
+      const tournaments = localStorage.getItem('tournaments');
+      
+      console.log('🔍 [APP] Dati disponibili all\'avvio:');
+      console.log('- Teams:', teams ? Object.keys(JSON.parse(teams)).length : 0);
+      console.log('- Managers:', managers ? Object.keys(JSON.parse(managers)).length : 0);
+      console.log('- Tournaments:', tournaments ? Object.keys(JSON.parse(tournaments)).length : 0);
+    }, 1000);
+    
     const initializeApp = async () => {