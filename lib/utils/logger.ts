/**
 * Structured logging utility for production monitoring
 * Helps track issues and performance in African market deployment
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;
    
    const logObject = {
      timestamp,
      level,
      message,
      ...(context && { context }),
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }),
    };

    return JSON.stringify(logObject);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };

    const formattedLog = this.formatLog(entry);

    // In production, log as JSON for log aggregation services
    // In development, use console for readability
    if (this.isDevelopment) {
      const consoleMethod = level === LogLevel.ERROR ? console.error : 
                           level === LogLevel.WARN ? console.warn : 
                           console.log;
      consoleMethod(`[${level.toUpperCase()}] ${message}`, context || '', error || '');
    } else {
      console.log(formattedLog);
    }

    // Send to external logging service if configured (e.g., Sentry)
    if (level === LogLevel.ERROR && process.env.SENTRY_DSN && error) {
      this.sendToSentry(error, context);
    }
  }

  private sendToSentry(error: Error, context?: Record<string, any>): void {
    // Placeholder for Sentry integration
    // In production, you'd use @sentry/nextjs
    try {
      // Sentry.captureException(error, { extra: context });
    } catch (e) {
      console.error('Failed to send to Sentry', e);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Specialized logging for business metrics
  metric(metricName: string, value: number, unit: string = 'count', tags?: Record<string, string>): void {
    this.info(`Metric: ${metricName}`, {
      metric: metricName,
      value,
      unit,
      tags,
    });
  }

  // Track API performance
  apiCall(endpoint: string, duration: number, statusCode: number, userId?: string): void {
    this.info('API Call', {
      endpoint,
      duration,
      statusCode,
      userId,
    });
  }

  // Track user actions for analytics
  userAction(action: string, userId?: string, metadata?: Record<string, any>): void {
    this.info('User Action', {
      action,
      userId,
      ...metadata,
    });
  }
}

export const logger = new Logger();
