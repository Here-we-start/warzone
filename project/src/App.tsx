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

function App() {
  const [userType, setUserType] = useState<UserType>(null);
  const [userIdentifier, setUserIdentifier] = useState('');
  const [currentTournament, setCurrentTournament] = useState<string>('');
  const [showLogin, setShowLogin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
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
    setUserType(type);
    setUserIdentifier(identifier);
    if (tournamentId) {
      setCurrentTournament(tournamentId);
    }
    
    console.log(`✅ Login: ${type} - ${identifier}${isOfflineMode ? ' (offline)' : ''}`);
  };

  const handleLogout = () => {
    setUserType(null);
    setUserIdentifier('');
    setCurrentTournament('');
    setShowLogin(false);
    
    console.log('👋 Logout completato');
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