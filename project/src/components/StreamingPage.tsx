import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import StreamingOverlay from './StreamingOverlay';
import { Monitor, Wifi, WifiOff } from 'lucide-react';

export default function StreamingPage() {
  const [searchParams] = useSearchParams();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const tournamentId = searchParams.get('tournament') || '';
  const overlayType = (searchParams.get('overlay') as any) || 'leaderboard';
  const theme = (searchParams.get('theme') as any) || 'dark';
  const showLogos = searchParams.get('logos') === 'true';
  const showStats = searchParams.get('stats') === 'true';
  const refreshRate = parseInt(searchParams.get('refresh') || '5000');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, refreshRate);

    return () => clearInterval(interval);
  }, [refreshRate]);

  // Remove all UI chrome for clean streaming
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.background = 'transparent';

    return () => {
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
      document.body.style.background = '';
    };
  }, []);

  if (!tournamentId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/90 text-white">
        <div className="text-center">
          <Monitor className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold mb-2">Errore Configurazione</h1>
          <p className="text-gray-400">ID torneo mancante nell'URL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-start p-0 m-0" style={{ background: 'transparent' }}>
      {/* Connection Status Indicator (hidden in transparent theme) */}
      {theme !== 'transparent' && (
        <div className="fixed top-2 right-2 z-50">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-mono ${
            isOnline ? 'text-green-400' : 'text-red-400'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>
      )}

      <StreamingOverlay
        tournamentId={tournamentId}
        overlayType={overlayType}
        theme={theme}
        showLogos={showLogos}
        showStats={showStats}
        refreshRate={refreshRate}
      />
    </div>
  );
}