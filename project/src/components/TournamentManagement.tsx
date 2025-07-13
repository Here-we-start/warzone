// 7. Sincronizzazione con il database
try {
  if (typeof ApiService?.syncAllData === 'function') {
    console.log('🔄 Sincronizzando terminazione torneo con database...');
    
    // Prepara tutti i dati aggiornati per la sincronizzazione
    const updatedData = {
      tournaments: {
        ...tournaments,
        [tournamentId]: archivedTournament
      },
      teams: (() => {
        const newTeams = { ...teams };
        tournamentTeamIds.forEach(teamId => {
          delete newTeams[teamId];
        });
        return newTeams;
      })(),
      matches: matches.filter(match => match.tournamentId !== tournamentId),
      pendingSubmissions: pendingSubmissions.filter(sub => sub.tournamentId !== tournamentId),
      scoreAdjustments: scoreAdjustments.filter(adj => adj.tournamentId !== tournamentId),
      managers: managers,
      auditLogs: auditLogs
    };

    // Sincronizza con il database
    await ApiService.syncAllData(updatedData);
    console.log('✅ Terminazione torneo sincronizzata con database');
    
    // Salva anche nel localStorage come backup
    localStorage.setItem('tournaments', JSON.stringify(updatedData.tournaments));
    localStorage.setItem('teams', JSON.stringify(updatedData.teams));
    localStorage.setItem('matches', JSON.stringify(updatedData.matches));
    localStorage.setItem('pendingSubmissions', JSON.stringify(updatedData.pendingSubmissions));
    localStorage.setItem('scoreAdjustments', JSON.stringify(updatedData.scoreAdjustments));
    
  } else {
    console.warn('⚠️ ApiService non disponibile, salvando solo localStorage');
    
    // Solo localStorage se il database non è disponibile
    localStorage.setItem('tournaments', JSON.stringify({
      ...tournaments,
      [tournamentId]: archivedTournament
    }));
    
    const newTeams = { ...teams };
    tournamentTeamIds.forEach(teamId => delete newTeams[teamId]);
    localStorage.setItem('teams', JSON.stringify(newTeams));
    localStorage.setItem('matches', JSON.stringify(matches.filter(match => match.tournamentId !== tournamentId)));
    localStorage.setItem('pendingSubmissions', JSON.stringify(pendingSubmissions.filter(sub => sub.tournamentId !== tournamentId)));
    localStorage.setItem('scoreAdjustments', JSON.stringify(scoreAdjustments.filter(adj => adj.tournamentId !== tournamentId)));
  }
} catch (syncError) {
  console.error('❌ Errore durante la sincronizzazione:', syncError);
  alert('⚠️ Torneo terminato localmente, ma errore nella sincronizzazione con il database. Verifica la connessione.');
}

// 8. Chiudi il modal
onClose();
