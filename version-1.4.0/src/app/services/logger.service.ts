/**
 * Logging Service
 * 
 * Centralized logging utility that provides different log levels
 * and can be easily configured for different environments (dev/prod).
 * 
 * Log Levels:
 * - DEBUG: Detailed information for debugging
 * - INFO: General informational messages
 * - WARN: Warning messages
 * - ERROR: Error messages
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

export class LoggerService {
  private static instance: LoggerService;
  private currentLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 100;

  // Configuration for production mode
  private productionMode: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Set the logging level
   * @param level - Minimum level to log
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Enable/disable production mode (reduces logging in prod)
   * @param enabled - Whether to enable production mode
   */
  setProductionMode(enabled: boolean): void {
    this.productionMode = enabled;
    if (enabled) {
      this.currentLevel = LogLevel.WARN; // Only warn and error in production
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log info message
   */
  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Log error message
   */
  error(message: string, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    // Skip if below current level
    if (level < this.currentLevel) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data
    };

    // Store in memory (limited)
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output based on level
    const prefix = this.getPrefix(level, context);
    const formattedMessage = data ? `${message} ${this.formatData(data)}` : message;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(prefix, formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(prefix, formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(prefix, formattedMessage);
        break;
    }
  }

  /**
   * Get prefix string for log level
   */
  private getPrefix(level: LogLevel, context?: string): string {
    const levelStr = LogLevel[level].padEnd(5);
    const time = new Date().toISOString().split('T')[1].split('.')[0];
    const ctx = context ? `[${context}]` : '';
    return `${time} ${levelStr}${ctx}:`;
  }

  /**
   * Format data for display
   */
  private formatData(data: any): string {
    if (data === null || data === undefined) return '';
    if (typeof data === 'object') {
      try {
        return JSON.stringify(data);
      } catch {
        return '[Object]';
      }
    }
    return String(data);
  }

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const logger = LoggerService.getInstance();

// Helper function to create logger with context
export function createLogger(context: string) {
  return {
    debug: (msg: string, data?: any) => logger.debug(msg, context, data),
    info: (msg: string, data?: any) => logger.info(msg, context, data),
    warn: (msg: string, data?: any) => logger.warn(msg, context, data),
    error: (msg: string, data?: any) => logger.error(msg, context, data)
  };
}
