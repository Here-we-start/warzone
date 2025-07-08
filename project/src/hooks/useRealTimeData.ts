import { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/api';
import { useSocket } from './useSocket';

// Hook per dati in tempo reale centralizzati sul backend
export function useRealTimeData<T>(key: string, initialValue: T) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastError, setLastError] = useState<string | null>(null);
  
  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { on, off, isConnected } = useSocket();

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
          break;
          
        case 'teams':
          // Per i team, usa localStorage come fallback per mantenere compatibilità
          const localTeams = localStorage.getItem('teams');
          if (localTeams) {
            setData(JSON.parse(localTeams));
          }
          break;
          
        case 'matches':
          const localMatches = localStorage.getItem('matches');
          if (localMatches) {
            setData(JSON.parse(localMatches));
          }
          break;
          
        case 'managers':
          result = await ApiService.getManagers();
          const managersObject = result.managers?.reduce((acc: any, manager: any) => {
            acc[manager.code] = {
              ...manager,
              id: manager._id || manager.id
            };
            return acc;
          }, {}) || {};
          setData(managersObject as T);
          break;
          
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

  // Aggiorna dati (locale + backend)
  const updateData = useCallback(async (value: T | ((val: T) => T)) => {
    const newValue = value instanceof Function ? value(data) : value;
    
    // Aggiornamento ottimistico
    setData(newValue);
    
    // Salva sempre in localStorage come backup
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
      console.log(`💾 ${key} salvato localmente`);
      setLastError(null);
    } catch (error) {
      const errorMsg = `Errore salvataggio ${key}`;
      console.warn(`⚠️ ${errorMsg}:`, error);
      setLastError(errorMsg);
    }

    // Invia al backend se connesso
    if (isConnected) {
      try {
        // TODO: Implementare chiamate API specifiche per ogni tipo di dato
        console.log(`📡 Sincronizzazione ${key} con backend...`);
      } catch (error) {
        console.error(`❌ Errore sincronizzazione backend ${key}:`, error);
      }
    }
  }, [data, key, isConnected]);

  // Caricamento iniziale
  useEffect(() => {
    fetchData();
  }, [key]);

  // Listener per eventi Socket.io in tempo reale
  useEffect(() => {
    if (!isConnected) return;

    const handleCreate = (payload: any) => {
      console.log(`📡 ${key} creato:`, payload);
      if (key === 'tournaments' && payload.tournament) {
        setData(prev => ({
          ...prev as any,
          [payload.tournament.id]: payload.tournament
        }));
      } else if (key === 'teams' && payload.team) {
        setData(prev => ({
          ...prev as any,
          [payload.team.id]: payload.team
        }));
      } else if (key === 'matches' && payload.match) {
        setData(prev => [...(prev as any), payload.match]);
      } else if (key === 'managers' && payload.manager) {
        setData(prev => ({
          ...prev as any,
          [payload.manager.code]: payload.manager
        }));
      } else if (key === 'auditLogs' && payload.auditLog) {
        setData(prev => [payload.auditLog, ...(prev as any)]);
      }
    };

    const handleUpdate = (payload: any) => {
      console.log(`📡 ${key} aggiornato:`, payload);
      if (key === 'tournaments' && payload.tournament) {
        setData(prev => ({
          ...prev as any,
          [payload.tournament.id]: payload.tournament
        }));
      } else if (key === 'teams' && payload.team) {
        setData(prev => ({
          ...prev as any,
          [payload.team.id]: payload.team
        }));
      } else if (key === 'managers' && payload.manager) {
        setData(prev => ({
          ...prev as any,
          [payload.manager.code]: payload.manager
        }));
      }
    };

    const handleDelete = (payload: any) => {
      console.log(`📡 ${key} eliminato:`, payload);
      if (key === 'tournaments' && payload.tournamentId) {
        setData(prev => {
          const newData = { ...prev as any };
          delete newData[payload.tournamentId];
          return newData;
        });
      } else if (key === 'teams' && payload.teamId) {
        setData(prev => {
          const newData = { ...prev as any };
          delete newData[payload.teamId];
          return newData;
        });
      } else if (key === 'matches' && payload.matchId) {
        setData(prev => (prev as any).filter((match: any) => match.id !== payload.matchId));
      } else if (key === 'managers' && payload.managerCode) {
        setData(prev => {
          const newData = { ...prev as any };
          delete newData[payload.managerCode];
          return newData;
        });
      }
    };

    // Registra listener per eventi specifici
    on(`${key}Created`, handleCreate);
    on(`${key}Updated`, handleUpdate);
    on(`${key}Deleted`, handleDelete);

    // Listener generici
    on('tournamentCreated', handleCreate);
    on('tournamentUpdated', handleUpdate);
    on('tournamentDeleted', handleDelete);
    on('teamCreated', handleCreate);
    on('teamUpdated', handleUpdate);
    on('teamDeleted', handleDelete);
    on('matchCreated', handleCreate);
    on('matchUpdated', handleUpdate);
    on('matchDeleted', handleDelete);
    on('managerCreated', handleCreate);
    on('managerUpdated', handleUpdate);
    on('managerDeleted', handleDelete);
    on('auditLogCreated', handleCreate);

    return () => {
      off(`${key}Created`, handleCreate);
      off(`${key}Updated`, handleUpdate);
      off(`${key}Deleted`, handleDelete);
      off('tournamentCreated', handleCreate);
      off('tournamentUpdated', handleUpdate);
      off('tournamentDeleted', handleDelete);
      off('teamCreated', handleCreate);
      off('teamUpdated', handleUpdate);
      off('teamDeleted', handleDelete);
      off('matchCreated', handleCreate);
      off('matchUpdated', handleUpdate);
      off('matchDeleted', handleDelete);
      off('managerCreated', handleCreate);
      off('managerUpdated', handleUpdate);
      off('managerDeleted', handleDelete);
      off('auditLogCreated', handleCreate);
    };
  }, [key, isConnected, on, off]);

  // Listener per sincronizzazione cross-device
  useEffect(() => {
    const handleOnline = () => {
      console.log(`🌐 Online status changed for ${key}: connected`);
      setIsOnline(true);
      setLastError(null);
    };
    
    const handleOffline = () => {
      console.log(`🌐 Online status changed for ${key}: disconnected`);
      setIsOnline(false);
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const newData = JSON.parse(e.newValue);
          setData(newData);
          console.log(`🔄 ${key} sincronizzato da storage`);
        } catch (error) {
          const errorMsg = `Errore sincronizzazione ${key}`;
          console.error(`❌ ${errorMsg}:`, error);
          setLastError(errorMsg);
        }
      }
    };

    // Broadcast Channel per sincronizzazione tra tab
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(`data-sync-${key}`);
      
      // Listen for tournament-specific events
      const tournamentChannel = new BroadcastChannel('warzone-global-sync');
      tournamentChannel.onmessage = (event) => {
        if (event.data.type === 'tournament-created' && key === 'tournaments') {
          try {
            setData(prev => ({
              ...prev as any,
              [event.data.tournamentId]: event.data.tournament
            }));
            console.log(`📡 Nuovo torneo sincronizzato via broadcast:`, event.data.tournament.name);
          } catch (error) {
            console.error(`❌ Errore sincronizzazione torneo:`, error);
          }
        }
      };
      
      channel.onmessage = (event) => {
        if (event.data.type === 'data-update' && event.data.key === key) {
          try {
            const newData = JSON.parse(event.data.value);
            setData(newData);
            console.log(`📡 ${key} sincronizzato via broadcast`);
          } catch (error) {
            const errorMsg = `Errore broadcast ${key}`;
            console.error(`❌ ${errorMsg}:`, error);
            setLastError(errorMsg);
          }
        }
      };
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageChange);
      if (channel) {
        channel.close();
      }
      // Close tournament channel if it exists
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const tournamentChannel = new BroadcastChannel('warzone-global-sync');
          tournamentChannel.close();
        } catch (error) {
          // Ignore errors on close
        }
      }
    };
  }, [key]);

  // Ricarica dati quando la connessione viene ristabilita
  useEffect(() => {
    if (isConnected && error) {
      console.log(`🔄 Reconnected, reloading ${key}...`);
      fetchData();
    }
  }, [isConnected, error]);
  
  // Listen for specific events related to this data type
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      const specificChannel = new BroadcastChannel(`${key}-updates`);
      specificChannel.onmessage = (event) => {
        if (event.data.type === `${key}-update`) {
          console.log(`📡 Received specific update for ${key}:`, event.data.action);
          fetchData();
        }
      };
      
      return () => specificChannel.close();
    }
  }, [key]);

  return [data, updateData, { isLoading, error, refetch: fetchData, isOnline, lastError }] as const;
}