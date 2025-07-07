import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Loader } from 'lucide-react';

interface ConnectionStatusProps {
  className?: string;
}

export default function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'disconnected' | 'syncing'>('connected');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setCloudStatus('syncing');
      // Simulate cloud reconnection
      setTimeout(() => setCloudStatus('connected'), 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setCloudStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for sync events
    const handleSync = () => {
      setLastSync(new Date());
      setCloudStatus('connected');
    };

    window.addEventListener('storage', handleSync);

    // Periodic sync status check
    const syncInterval = setInterval(() => {
      if (isOnline) {
        setCloudStatus('syncing');
        setTimeout(() => {
          setCloudStatus('connected');
          setLastSync(new Date());
        }, 1000);
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleSync);
      clearInterval(syncInterval);
    };
  }, [isOnline]);

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-4 h-4 text-red-400" />;
    }

    switch (cloudStatus) {
      case 'syncing':
        return <Loader className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'disconnected':
        return <CloudOff className="w-4 h-4 text-red-400" />;
      default:
        return <Cloud className="w-4 h-4 text-green-400" />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    
    switch (cloudStatus) {
      case 'syncing':
        return 'Sincronizzazione...';
      case 'disconnected':
        return 'Cloud disconnesso';
      default:
        return 'Online';
    }
  };

  const getStatusColor = () => {
    if (!isOnline || cloudStatus === 'disconnected') {
      return 'text-red-400 bg-red-500/10 border-red-500/30';
    }
    if (cloudStatus === 'syncing') {
      return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    }
    return 'text-green-400 bg-green-500/10 border-green-500/30';
  };

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg border font-mono text-xs ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {lastSync && cloudStatus === 'connected' && (
        <span className="text-xs opacity-60">
          {lastSync.toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      )}
    </div>
  );
}