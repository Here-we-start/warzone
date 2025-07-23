const [globalStatus, setGlobalStatus] = useState(false);

  useEffect(() => {
    setGlobalStatus(isGlobalSystemActive());
    
    // Debug: mostra i dati disponibili per il login
    console.log('🔍 [LOGIN DEBUG] Dati disponibili per autenticazione:');
    console.log('📊 Teams:', Object.keys(teams).length, 'squadre');
    console.log('👥 Managers:', Object.keys(managers).length, 'gestori');
    console.log('🏆 Tournaments:', Object.keys(tournaments).length, 'tornei');
    
    // Mostra alcuni codici di esempio (senza rivelare tutto)
    const teamCodes = Object.values(teams).map(t => t.code.substring(0, 3) + '***');
    const managerCodes = Object.values(managers).map(m => m.code.substring(0, 3) + '***');
    console.log('🔑 Team codes disponibili:', teamCodes);
    console.log('🔑 Manager codes disponibili:', managerCodes);
  }, []);

  // Debug function to help diagnose login issues
  const debugLoginAttempt = (type: string, code: string, result: string) => {
    console.log(`🔍 [LOGIN] ${type.toUpperCase()} attempt: ${code} -> ${result}`);
  };

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
        console.log('✅ [LOGIN] Admin login successful');
        onLogin('admin', 'admin');
        return;
      }

      // Verifica manager
      console.log('🔍 [LOGIN] Checking managers...', Object.keys(managers).length, 'available');
      const manager = Object.values(managers).find(m => {
        const codeMatch = m.code.toLowerCase() === trimmedPassword.toLowerCase();
        const isActive = m.isActive;
        console.log(`🔍 [LOGIN] Manager ${m.code}: codeMatch=${codeMatch}, isActive=${isActive}`);
        const matches = codeMatch && isActive;
        if (matches) debugLoginAttempt('manager', m.code, 'found');
        return matches;
      });

      if (manager) {
        debugLoginAttempt('manager', manager.code, 'success');
        console.log('✅ [LOGIN] Manager login successful:', manager.name);
        
        // Find assigned tournament for this manager
        const tournament = Object.values(tournaments).find(
          t => t.assignedManagers.includes(manager.code) && t.status === 'active'
        );
        
        if (tournament) {
          debugLoginAttempt('manager', manager.code, `assigned to tournament: ${tournament.id}`);
          console.log('🏆 [LOGIN] Manager assigned to tournament:', tournament.name);
        } else {
          debugLoginAttempt('manager', manager.code, 'no active tournament found');
          console.log('⚠️ [LOGIN] Manager not assigned to any active tournament');
        }
        
        onLogin('manager', manager.code, tournament?.id);
        return;
      }

      // Verifica team
      console.log('🔍 [LOGIN] Checking teams...', Object.keys(teams).length, 'available');
      const team = Object.values(teams).find(t => {
        const codeMatch = t.code.toLowerCase() === trimmedPassword.toLowerCase();
        console.log(`🔍 [LOGIN] Team ${t.code}: codeMatch=${codeMatch}`);
        const matches = codeMatch;
        if (matches) debugLoginAttempt('team', t.code, `found with tournamentId: ${t.tournamentId}`);
        return matches;
      });

      if (team) {
        console.log('✅ [LOGIN] Team found:', team.name);
        const tournament = tournaments[team.tournamentId];
        
        if (tournament) {
          debugLoginAttempt('team', team.code, `tournament status: ${tournament.status}`);
          console.log('🏆 [LOGIN] Team tournament status:', tournament.status);
        } else {
          debugLoginAttempt('team', team.code, 'tournament not found');
          console.log('❌ [LOGIN] Team tournament not found');
        }
        
        if (tournament && tournament.status === 'active') {
          debugLoginAttempt('team', team.code, 'success');
          console.log('✅ [LOGIN] Team login successful');
          onLogin('team', team.code, team.tournamentId);
          return;
        } else {
          debugLoginAttempt('team', team.code, 'tournament not active');
          console.log('❌ [LOGIN] Tournament not active');
          setError('TORNEO NON ATTIVO');
          setIsLoading(false);
          return;
        }
      }

      // Verifica codici con API backend come fallback
      try {
        console.log('🔍 Tentativo login con backend API...');
        const loginResult = await ApiService.login(trimmedPassword, 'team');
        if (loginResult.success) {
          debugLoginAttempt('team', trimmedPassword, 'backend success');
          console.log('✅ [LOGIN] Backend login successful');
          onLogin(loginResult.userType, loginResult.identifier, loginResult.tournamentId);
          return;
        }
      } catch (backendError) {
        console.warn('⚠️ Backend login fallito:', backendError);
      }

      // Login fallito
      debugLoginAttempt('unknown', trimmedPassword, 'invalid code');
      console.log('❌ [LOGIN] All login attempts failed');
      console.log('🔍 [LOGIN] Available data summary:');
      console.log('- Teams:', Object.keys(teams).length);
      console.log('- Managers:', Object.keys(managers).length);
      console.log('- Tournaments:', Object.keys(tournaments).length);
      setError('CODICE NON VALIDO');
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Errore login:', error);
      setError('ERRORE DI SISTEMA');
      setIsLoading(false);
    }
  };