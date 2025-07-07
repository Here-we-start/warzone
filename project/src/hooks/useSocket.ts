import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Socket URL configuration with fallback handling
const getSocketUrl = () => {
  // In development, try to connect to backend if available
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_SOCKET_URL || 
           import.meta.env.VITE_API_URL || 
           'http://localhost:5000';
  }
  
  // In production, use environment variables or current origin
  return import.meta.env.VITE_SOCKET_URL || 
         import.meta.env.VITE_API_URL || 
         window.location.origin;
};

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const SOCKET_URL = getSocketUrl();
    
    // Only attempt connection if we have a valid URL
    if (!SOCKET_URL) {
      console.warn('🔌 No socket URL configured, running in offline mode');
      setConnectionError('No backend URL configured');
      return;
    }
    
    console.log('🔌 Attempting socket connection to:', SOCKET_URL);
    
    // Initialize socket connection with enhanced error handling
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 3,
      timeout: 10000,
      forceNew: false,
      upgrade: true,
      rememberUpgrade: true,
      withCredentials: true,
      autoConnect: true
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
      
      // Handle different disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      const errorMsg = `Connection failed: ${error.message || 'Unknown error'}`;
      console.warn('🔌 Socket connection error:', errorMsg);
      console.warn('🔌 Running in offline mode');
      setIsConnected(false);
      setConnectionError(errorMsg);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('reconnect_error', (error) => {
      console.warn('🔌 Socket reconnection error:', error.message);
    });

    socket.on('reconnect_failed', () => {
      console.warn('🔌 Socket reconnection failed, continuing in offline mode');
      setConnectionError('Unable to connect to server');
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const joinTournament = (tournamentId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join-tournament', tournamentId);
      console.log('🏆 Joined tournament:', tournamentId);
    } else {
      console.warn('🔌 Socket not connected, running in offline mode');
    }
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  const emit = (event: string, ...args: any[]) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, ...args);
    } else {
      console.warn('🔌 Socket not connected, event queued for when connection is restored:', event);
    }
  };

  return {
    socket: socketRef.current,
    joinTournament,
    on,
    off,
    emit,
    isConnected,
    connectionError
  };
}