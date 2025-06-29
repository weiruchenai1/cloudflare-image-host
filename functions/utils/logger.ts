// functions/utils/logger.ts
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  operation?: string;
  [key: string]: any;
}

export class Logger {
  private level: LogLevel;
  
  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }
  
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (level > this.level) return;
    
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level: LogLevel[level],
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };
    
    console.log(JSON.stringify(logData));
  }
  
  error(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error);
  }
  
  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }
  
  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }
  
  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }
}

export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
);