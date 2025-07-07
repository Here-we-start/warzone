// Centralized error handling
export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const ErrorCodes = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCESS_DENIED: 'ACCESS_DENIED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE',
  
  // Tournament errors
  TOURNAMENT_NOT_FOUND: 'TOURNAMENT_NOT_FOUND',
  TOURNAMENT_COMPLETED: 'TOURNAMENT_COMPLETED',
  TEAM_NOT_FOUND: 'TEAM_NOT_FOUND',
  MATCH_LIMIT_EXCEEDED: 'MATCH_LIMIT_EXCEEDED',
  
  // File upload errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED'
};

export function handleApiError(error: any): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error.name === 'ValidationError') {
    return new AppError(
      'Validation failed: ' + error.message,
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }
  
  if (error.code === 11000) {
    return new AppError(
      'Duplicate entry detected',
      ErrorCodes.DUPLICATE_ENTRY,
      409
    );
  }
  
  if (error.name === 'CastError') {
    return new AppError(
      'Invalid ID format',
      ErrorCodes.INVALID_INPUT,
      400
    );
  }
  
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return new AppError(
      'Network connection failed',
      ErrorCodes.NETWORK_ERROR,
      503
    );
  }
  
  return new AppError(
    error.message || 'An unexpected error occurred',
    ErrorCodes.DATABASE_ERROR,
    500
  );
}

export function getErrorMessage(error: any): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

export function logError(error: any, context?: string) {
  const errorInfo = {
    message: getErrorMessage(error),
    code: error.code || 'UNKNOWN',
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  };
  
  console.error('Application Error:', errorInfo);
  
  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    // Send to error tracking service (Sentry, LogRocket, etc.)
  }
}