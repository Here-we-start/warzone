import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VideoBackground from './components/VideoBackground';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import TeamDashboard from './components/TeamDashboard';
import PublicView from './components/PublicView';
import StreamingPage from './components/StreamingPage';
import ErrorBoundary from './components/ErrorBoundary';
import { UserType } from './types';
import { isGlobalSystemActive } from './utils/globalSync';

// Chiavi per il localStorage
const USER_TYPE_KEY = 'warzone_user_type';
const USER_ID_KEY = 'warzone_user_id';
const TOURNAMENT_ID_KEY = 'warzone_tournament_id';

function App() {
  const [userType, setUserType] = useState<UserType>(null);
  const [userIdentifier, setUserIdentifier] = useState('');
  const [currentTournament, setCurrentTournament] = useState<string>('');
  const [showLogin, setShowLogin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

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
    
    const initializeApp = async () => {
      console.log('🚀 Inizializzazione Warzone Tournament App...');
      
      try {
        // Verifica sistema globale
        const globalActive = isGlobalSystemActive();
        console.log(`🌍 Sistema globale: ${globalActive ? 'ATTIVO' : 'OFFLINE'}`);
        
        // Verifica connessione di rete
        const isOnline = navigator.onLine;
        setIsOfflineMode(!isOnline);
        
        if (!isOnline) {
          console.log('📱 Avvio in modalità offline');
        }
        
      } catch (error) {
        console.warn('⚠️ Errore durante inizializzazione, continuando in modalità offline:', error);
        setIsOfflineMode(true);
      }
      
      setIsInitialized(true);
    };

    initializeApp();
  }, []);

  // Listener per cambiamenti di connessione
  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineMode(false);
      console.log('🌐 Connessione ripristinata');
    };
    
    const handleOffline = () => {
      setIsOfflineMode(true);
      console.log('📱 Modalità offline attivata');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogin = (type: UserType, identifier: string, tournamentId?: string) => {
    // Salva i dati di sessione nel localStorage
    console.log(`🔑 Saving login data: ${type} - ${identifier} - ${tournamentId || 'no tournament'}`);
    localStorage.setItem(USER_TYPE_KEY, type as string);
    localStorage.setItem(USER_ID_KEY, identifier);
    if (tournamentId) {
      localStorage.setItem(TOURNAMENT_ID_KEY, tournamentId);
    }
    
    setUserType(type);
    setUserIdentifier(identifier);
    if (tournamentId) {
      setCurrentTournament(tournamentId);
      console.log(`🏆 Setting current tournament: ${tournamentId}`);
    }
    
    console.log(`✅ Login successful: ${type} - ${identifier}${isOfflineMode ? ' (offline)' : ''}`);
    setShowLogin(false); // Ensure login screen is hidden after successful login
  };

  const handleLogout = () => {
    // Rimuovi i dati di sessione dal localStorage
    localStorage.removeItem(USER_TYPE_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(TOURNAMENT_ID_KEY);
    
    setUserType(null);
    setUserIdentifier('');
    setCurrentTournament('');
    setShowLogin(false);
    console.log('👋 Logout completed - session data cleared');
    
    // Force reload to clear any cached state
    // window.location.reload();
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <VideoBackground />
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-ice-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white font-mono">
              WARZONE APP
            </h1>
            <p className="text-ice-blue/80 font-mono text-sm mt-2">
              Inizializzazione...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/stream" element={<StreamingPage />} />
          <Route path="/*" element={
            <div className="min-h-screen relative overflow-hidden">
              <VideoBackground />
              
              {!showLogin && !userType && (
                <PublicView onShowLogin={() => setShowLogin(true)} />
              )}
              
              {showLogin && !userType && (
                <LoginScreen 
                  onLogin={handleLogin} 
                  onBackToPublic={() => setShowLogin(false)}
                />
              )}
              
              {userType === 'admin' && (
                <AdminDashboard onLogout={handleLogout} />
              )}
              
              {userType === 'manager' && (
                <ManagerDashboard 
                  managerCode={userIdentifier}
                  tournamentId={currentTournament}
                  onLogout={handleLogout}
                />
              )}
              
              {userType === 'team' && (
                <TeamDashboard 
                  teamCode={userIdentifier}
                  tournamentId={currentTournament}
                  onLogout={handleLogout} 
                />
              )}
            </div>
          } />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;