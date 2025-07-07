import { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { useSocket } from './useSocket';

// Hook for backend-synchronized data
export function useBackendData<T>(
  endpoint: string,
  initialValue: T,
  dependencies: string[] = []
) {
  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { on, off } = useSocket();

  // Fetch data from backend
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let result;
      switch (endpoint) {
        case 'tournaments':
          result = await ApiService.getTournaments();
          break;
        case 'managers':
          result = await ApiService.getManagers();
          break;
        case 'audit-logs':
          result = await ApiService.getAuditLogs();
          break;
        default:
          throw new Error(`Unknown endpoint: ${endpoint}`);
      }
      
      setData(result[endpoint] || result.data || initialValue);
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Fallback to localStorage if backend fails
      try {
        const localData = localStorage.getItem(endpoint);
        if (localData) {
          setData(JSON.parse(localData));
        }
      } catch (localError) {
        console.warn('Failed to load from localStorage:', localError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update data function
  const updateData = async (value: T | ((val: T) => T)) => {
    const newValue = value instanceof Function ? value(data) : value;
    
    // Optimistic update
    setData(newValue);
    
    // Save to localStorage as backup
    try {
      localStorage.setItem(endpoint, JSON.stringify(newValue));
    } catch (localError) {
      console.warn('Failed to save to localStorage:', localError);
    }
    
    // TODO: Implement backend update based on endpoint
    // This would involve calling the appropriate API method
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [endpoint, ...dependencies]);

  // Set up real-time listeners
  useEffect(() => {
    const handleCreate = (payload: any) => {
      console.log(`📡 Received ${endpoint} create:`, payload);
      fetchData(); // Refetch data
    };

    const handleUpdate = (payload: any) => {
      console.log(`📡 Received ${endpoint} update:`, payload);
      fetchData(); // Refetch data
    };

    const handleDelete = (payload: any) => {
      console.log(`📡 Received ${endpoint} delete:`, payload);
      fetchData(); // Refetch data
    };

    // Listen for real-time updates
    on(`${endpoint}Created`, handleCreate);
    on(`${endpoint}Updated`, handleUpdate);
    on(`${endpoint}Deleted`, handleDelete);

    return () => {
      off(`${endpoint}Created`, handleCreate);
      off(`${endpoint}Updated`, handleUpdate);
      off(`${endpoint}Deleted`, handleDelete);
    };
  }, [endpoint, on, off]);

  return [data, updateData, { isLoading, error, refetch: fetchData }] as const;
}

// Specialized hooks for different data types
export function useTournaments() {
  return useBackendData('tournaments', {});
}

export function useTeams(tournamentId: string) {
  const [teams, setTeams] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId) return;

    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const result = await ApiService.getTeams(tournamentId);
        
        // Convert array to object with team ID as key
        const teamsObject = result.teams.reduce((acc: any, team: any) => {
          acc[team._id] = team;
          return acc;
        }, {});
        
        setTeams(teamsObject);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch teams');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, [tournamentId]);

  const updateTeams = (value: any) => {
    setTeams(value);
  };

  return [teams, updateTeams, { isLoading, error }] as const;
}

export function useMatches(tournamentId: string) {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tournamentId) return;

    const fetchMatches = async () => {
      try {
        setIsLoading(true);
        const result = await ApiService.getMatches(tournamentId);
        setMatches(result.matches || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [tournamentId]);

  const updateMatches = (value: any) => {
    setMatches(value);
  };

  return [matches, updateMatches, { isLoading, error }] as const;
}