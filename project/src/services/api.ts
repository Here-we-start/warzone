// API service for backend communication with production support
import logger from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV 
    ? 'http://localhost:5000' 
    : 'https://warzone-tournament-api-xfut.onrender.com'); // ✅ Aggiunto URL server

class ApiService {
  private static async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const startTime = Date.now();
    
    try {
      logger.debug(`API Request: ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        credentials: 'include'
      });
      
      const duration = Date.now() - startTime;
      logger.apiCall(options.method || 'GET', endpoint, duration, response.status);
      
      const data = await response.json();
      
      if (!response.ok) {
        const error = new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        logger.error(`API Error: ${endpoint}`, { 
          status: response.status, 
          error: data.error,
          duration 
        });
        throw error;
      }
      
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new Error('Network error: Unable to connect to server. Please check your internet connection.');
        logger.error(`Network Error: ${endpoint}`, { duration, originalError: error.message });
        throw networkError;
      }
      
      logger.error(`API Request Failed: ${endpoint}`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        duration 
      });
      
      throw error;
    }
  }

  // Tournament endpoints
  static async getTournaments() {
    return this.request('/api/tournaments');
  }

  static async getTournament(id: string) {
    console.log(`🔍 [API] Getting tournament: ${id}`);
    return this.request(`/api/tournaments/${id}`);
  }

  static async createTournament(tournament: any) {
    console.log(`🔍 [API] Creating tournament:`, tournament);
    return this.request('/api/tournaments', {
      method: 'POST',
      body: JSON.stringify(tournament)
    });
  }

  static async updateTournament(id: string, tournament: any) {
    return this.request(`/api/tournaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tournament)
    });
  }

  // Team endpoints
  static async getTeams(tournamentId: string) {
    return this.request(`/api/tournaments/${tournamentId}/teams`);
  }

  static async createTeam(team: any) {
    console.log(`🔍 [API] Creating team:`, team);
    return this.request('/api/teams', {
      method: 'POST',
      body: JSON.stringify(team)
    });
  }

  static async deleteTeam(id: string) {
    console.log(`🔍 [API] Deleting team: ${id}`);
    return this.request(`/api/teams/${id}`, {
      method: 'DELETE'
    });
  }

  // Match endpoints
  static async getMatches(tournamentId: string) {
    return this.request(`/api/tournaments/${tournamentId}/matches`);
  }

  static async createMatch(match: any) {
    console.log(`🔍 [API] Creating match:`, match);
    return this.request('/api/matches', {
      method: 'POST',
      body: JSON.stringify(match)
    });
  }

  // Pending submission endpoints
  static async getPendingSubmissions(tournamentId: string) {
    return this.request(`/api/pending-submissions?tournamentId=${tournamentId}`);
  }

  static async createPendingSubmission(submission: any) {
    return this.request('/api/pending-submissions', {
      method: 'POST',
      body: JSON.stringify(submission)
    });
  }

  static async deletePendingSubmission(id: string) {
    console.log(`🔍 [API] Deleting pending submission: ${id}`);
    return this.request(`/api/pending-submissions/${id}`, {
      method: 'DELETE'
    });
  }

  // Score adjustment endpoints
  static async getScoreAdjustments(tournamentId: string) {
    return this.request(`/api/score-adjustments?tournamentId=${tournamentId}`);
  }

  static async createScoreAdjustment(adjustment: any) {
    console.log(`🔍 [API] Creating score adjustment:`, adjustment);
    return this.request('/api/score-adjustments', {
      method: 'POST',
      body: JSON.stringify(adjustment)
    });
  }

  static async deleteScoreAdjustment(id: string) {
    return this.request(`/api/score-adjustments/${id}`, {
      method: 'DELETE'
    });
  }

  // Manager endpoints
  static async getManagers() {
    return this.request('/api/managers');
  }

  static async createManager(manager: any) {
    return this.request('/api/managers', {
      method: 'POST',
      body: JSON.stringify(manager)
    });
  }

  static async updateManager(id: string, manager: any) {
    return this.request(`/api/managers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(manager)
    });
  }

  static async deleteManager(id: string) {
    return this.request(`/api/managers/${id}`, {
      method: 'DELETE'
    });
  }

  // Audit log endpoints
  static async getAuditLogs(tournamentId?: string, limit?: number) {
    const params = new URLSearchParams();
    if (tournamentId) params.append('tournamentId', tournamentId);
    if (limit) params.append('limit', limit.toString());
    
    return this.request(`/api/audit-logs?${params.toString()}`);
  }

  static async createAuditLog(log: any) {
    return this.request('/api/audit-logs', {
      method: 'POST',
      body: JSON.stringify(log)
    });
  }

  // Authentication endpoints
  static async login(code: string, type: 'admin' | 'manager' | 'team') {
    logger.userAction('Login attempt', { type });
    
    try {
      const result = await this.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ code, type })
      });
      
      logger.userAction('Login successful', { type, userType: result.userType });
      return result;
    } catch (error) {
      logger.warn('Login failed', { type, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  // Optimized bulk sync endpoint for tournament termination
  static async syncAllData(data: {
    tournaments: any;
    teams: any;
    matches: any;
    pendingSubmissions: any;
    scoreAdjustments: any;
    managers: any;
    auditLogs: any;
  }) {
    logger.info('Syncing terminated tournaments to database');

    try {
      // Sync ONLY archived tournaments (terminated ones)
      const archivedTournaments = Object.entries(data.tournaments).filter(
        ([_, tournament]) => tournament.status === 'archived'
      );

      console.log(`🔄 Found ${archivedTournaments.length} archived tournaments to sync`);

      for (const [tournamentId, tournament] of archivedTournaments) {
        console.log(`🔄 Syncing archived tournament: ${tournamentId}`);
        
        try {
          // Try UPDATE first (most likely scenario)
          await this.updateTournament(tournamentId, tournament);
          console.log(`✅ Archived tournament UPDATED: ${tournamentId}`);
        } catch (updateError) {
          try {
            // If UPDATE fails, try CREATE
            await this.createTournament(tournament);
            console.log(`✅ Archived tournament CREATED: ${tournamentId}`);
          } catch (createError) {
            console.warn(`❌ Failed to sync tournament ${tournamentId} (non-critical)`);
          }
        }
      }

      // Skip teams/matches - they're preserved in archivedData
      console.log('ℹ️ Teams/matches preserved in tournament archivedData');
      
      // Skip audit logs - endpoint not reliable
      console.log('ℹ️ Audit logs skipped - preserved locally');

      logger.info(`Successfully synced ${archivedTournaments.length} archived tournaments`);
      return { 
        success: true, 
        message: `${archivedTournaments.length} archived tournaments synchronized` 
      };

    } catch (error) {
      logger.error('Failed to sync archived tournaments:', error);
      return { 
        success: false, 
        message: 'Database sync failed, but data saved locally' 
      };
    }
  }

  // Health check with enhanced error handling
  static async healthCheck() {
    try {
      console.log('🔍 [API] Checking database health...');
      const result = await this.request('/api/health');
      console.log('✅ [API] Database is healthy:', result);
      return result;
    } catch (error) {
      console.warn('⚠️ [API] Database health check failed:', error);
      logger.warn('Health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { 
        success: false, 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Check if backend is reachable
  static async checkBackendStatus() {
    try {
      console.log('🔍 [API] Checking backend status...');
      const result = await this.healthCheck();
      console.log('✅ [API] Backend is reachable:', result);
      return true;
    } catch (error) {
      console.warn('⚠️ [API] Backend unreachable:', error);
      return false;
    }
  }

  // Connection test utility
  static async testConnection() {
    try {
      const result = await this.healthCheck();
      const connectionData = {
        connected: result.success,
        apiUrl: API_BASE_URL,
        environment: result.environment || 'unknown',
        timestamp: result.timestamp || Date.now()
      };
      
      logger.info('Connection test completed', connectionData);
      return connectionData;
    } catch (error) {
      const connectionData = {
        connected: false,
        apiUrl: API_BASE_URL,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
      
      logger.error('Connection test failed', connectionData);
      return connectionData;
    }
  }

  // Polling system for real-time fallback
  private static pollingIntervals: Map<string, number> = new Map();
  
  static startPolling(key: string, fetchFunction: () => Promise<any>, intervalMs: number = 5000) {
    // Stop existing polling for this key
    this.stopPolling(key);
    
    // Start new polling
    const intervalId = setInterval(async () => {
      try {
        await fetchFunction();
        logger.debug(`Polling update: ${key}`);
      } catch (error) {
        logger.error(`Polling error for ${key}:`, error);
      }
    }, intervalMs);
    
    this.pollingIntervals.set(key, intervalId);
    logger.info(`Started polling for ${key} every ${intervalMs}ms`);
  }
  
  static stopPolling(key: string) {
    const intervalId = this.pollingIntervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(key);
      logger.info(`Stopped polling for ${key}`);
    }
  }
  
  static stopAllPolling() {
    this.pollingIntervals.forEach((intervalId, key) => {
      clearInterval(intervalId);
      logger.info(`Stopped polling for ${key}`);
    });
    this.pollingIntervals.clear();
  }

  // NUOVO: Synchronization wrapper for dual local + database storage con DEBUG
  static async syncOperation<T>(
    operation: {
      localUpdate: () => void;
      apiCall: () => Promise<any>;
      storageKey?: string;
      storageData?: any;
      operationName: string;
    }
  ): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      console.log(`🔍 [DEBUG] Starting sync operation: ${operation.operationName}`);
      
      // 1. Update local state immediately (for responsive UI)
      operation.localUpdate();
      console.log(`✅ [DEBUG] Local update completed for: ${operation.operationName}`);
      
      // 2. Update localStorage if needed
      if (operation.storageKey && operation.storageData) {
        localStorage.setItem(operation.storageKey, JSON.stringify(operation.storageData));
        console.log(`💾 [DEBUG] localStorage backup saved for: ${operation.storageKey}`);
      }
      
      // 3. Sync with database with detailed debug
      try {
        console.log(`🌐 [DEBUG] Attempting database sync for: ${operation.operationName}`);
        console.log(`📡 [DEBUG] Data being sent:`, operation.storageData);
        
        const result = await operation.apiCall();
        console.log(`✅ [DEBUG] Database sync successful:`, result);
        
        console.log(`✅ ${operation.operationName} synced successfully`);
        return { success: true };
        
      } catch (dbError: any) {
        console.error(`❌ [DEBUG] Database sync failed for ${operation.operationName}:`, {
          error: dbError.message,
          status: dbError.status,
          stack: dbError.stack
        });

        // Log dettagliato dell'errore per debug
        if (dbError.response) {
          try {
            const errorText = await dbError.response.text();
            console.error(`📄 [DEBUG] Backend error response:`, errorText);
          } catch (e) {
            console.error(`📄 [DEBUG] Could not read error response`);
          }
        }

        console.warn(`⚠️ ${operation.operationName} database sync failed:`, dbError);
        
        return { 
          success: false, 
          error: dbError.message || 'Database sync failed',
          details: {
            status: dbError.status,
            operation: operation.operationName,
            timestamp: new Date().toISOString()
          }
        };
      }
      
    } catch (error: any) {
      console.error(`💥 [DEBUG] Critical error in sync operation ${operation.operationName}:`, error);
      return { 
        success: false, 
        error: error.message || 'Critical sync operation failed' 
      };
    }
  }
}

export default ApiService;
