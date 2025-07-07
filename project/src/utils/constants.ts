// Application constants and configuration
export const APP_CONFIG = {
  name: 'Warzone Tournament Management System',
  version: '4.0.0',
  author: 'BM Solution',
  description: 'Advanced Tournament Management System for Call of Duty: Warzone',
  
  // API Configuration
  api: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  // Tournament Configuration
  tournament: {
    maxTeams: 100,
    maxMatches: 20,
    maxPhotosPerSubmission: 5,
    defaultMultipliers: {
      1: 2.0, 2: 1.8, 3: 1.8, 4: 1.6, 5: 1.6, 6: 1.6,
      7: 1.4, 8: 1.4, 9: 1.4, 10: 1.4, 11: 1.0, 12: 1.0,
      13: 1.0, 14: 1.0, 15: 1.0, 16: 1.0, 17: 1.0, 18: 1.0,
      19: 1.0, 20: 1.0
    }
  },
  
  // UI Configuration
  ui: {
    animationDuration: 300,
    toastDuration: 5000,
    autoSaveInterval: 30000
  },
  
  // Storage Configuration
  storage: {
    prefix: 'warzone_',
    maxLocalStorageSize: 10 * 1024 * 1024, // 10MB
    compressionThreshold: 1024 // 1KB
  }
};

export const ADMIN_CODES = ['MISOKIETI', 'MISOKIETI8'];

export const TOURNAMENT_TYPES = {
  RITORNO: 'Ritorno',
  BR: 'BR'
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TEAM: 'team'
} as const;

export const MATCH_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export const TOURNAMENT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
} as const;