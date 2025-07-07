// Frontend logging utility
interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logLevel = import.meta.env.VITE_LOG_LEVEL || 'info';

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }
    
    return `${prefix} ${message}`;
  }

  private sendToServer(level: string, message: string, data?: any) {
    // In production, send critical logs to server
    if (!this.isDevelopment && (level === 'error' || level === 'warn')) {
      try {
        fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level,
            message,
            data,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
          })
        }).catch(() => {
          // Silently fail if logging endpoint is not available
        });
      } catch (error) {
        // Silently fail
      }
    }
  }

  error(message: string, data?: any) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
      this.sendToServer('error', message, data);
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
      this.sendToServer('warn', message, data);
    }
  }

  info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  debug(message: string, data?: any) {
    if (this.shouldLog('debug') && this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  // Performance logging
  time(label: string) {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // User action logging
  userAction(action: string, data?: any) {
    this.info(`User action: ${action}`, data);
  }

  // API call logging
  apiCall(method: string, endpoint: string, duration?: number, status?: number) {
    const message = `API ${method} ${endpoint}`;
    const logData = { duration, status };
    
    if (status && status >= 400) {
      this.warn(message, logData);
    } else {
      this.debug(message, logData);
    }
  }
}

export const logger = new Logger();
export default logger;