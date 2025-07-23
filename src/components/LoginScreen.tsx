@@ .. @@
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!password.trim()) return;

     setIsLoading(true);
     setError('');

     // Simula autenticazione
     await new Promise(resolve => setTimeout(resolve, 1000));

     const trimmedPassword = password.trim();

     try {
       // Codici admin
       if (['MISOKIETI', 'MISOKIETI8'].includes(trimmedPassword.toUpperCase())) {
         debugLoginAttempt('admin', trimmedPassword, 'success');
         onLogin('admin', 'admin');
         return;
       }

       // Verifica manager
       const manager = Object.values(managers).find(m => {
         const matches = m.code.toLowerCase() === trimmedPassword.toLowerCase() && m.isActive;
         if (matches) debugLoginAttempt('manager', m.code, 'found');
         return matches;
       });

       if (manager) {
         debugLoginAttempt('manager', manager.code, 'success');
         
         // Find assigned tournament for this manager
         const tournament = Object.values(tournaments).find(
           t => t.assignedManagers.includes(manager.code) && t.status === 'active'
         );
         
         if (tournament) {
           debugLoginAttempt('manager', manager.code, `assigned to tournament: ${tournament.id}`);
         } else {
           debugLoginAttempt('manager', manager.code, 'no active tournament found');
         }
         
         onLogin('manager', manager.code, tournament?.id);
         return;
       }

       // Verifica team
       const team = Object.values(teams).find(t => {
         const matches = t.code.toLowerCase() === trimmedPassword.toLowerCase();
         if (matches) debugLoginAttempt('team', t.code, `found with tournamentId: ${t.tournamentId}`);
         return matches;
       });

       if (team) {
         const tournament = tournaments[team.tournamentId];
         
         if (tournament) {
           debugLoginAttempt('team', team.code, `tournament status: ${tournament.status}`);
         } else {
           debugLoginAttempt('team', team.code, 'tournament not found');
         }
         
         if (tournament && tournament.status === 'active') {
           debugLoginAttempt('team', team.code, 'success');
           onLogin('team', team.code, team.tournamentId);
           return;
         } else {
           debugLoginAttempt('team', team.code, 'tournament not active');
           setError('TORNEO NON ATTIVO');
           setIsLoading(false);
           return;
         }
       }

+      // Verifica codici con API backend come fallback
+      try {
+        console.log('🔍 Tentativo login con backend API...');
+        const loginResult = await ApiService.login(trimmedPassword, 'team');
+        if (loginResult.success) {
+          debugLoginAttempt('team', trimmedPassword, 'backend success');
+          onLogin(loginResult.userType, loginResult.identifier, loginResult.tournamentId);
+          return;
+        }
+      } catch (backendError) {
+        console.warn('⚠️ Backend login fallito:', backendError);
+      }
+
       // Login fallito
       debugLoginAttempt('unknown', trimmedPassword, 'invalid code');
       setError('CODICE NON VALIDO');
       setIsLoading(false);
     } catch (error) {
       console.error('❌ Errore login:', error);
       setError('ERRORE DI SISTEMA');
       setIsLoading(false);
     }
   };