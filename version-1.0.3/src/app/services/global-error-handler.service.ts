/**
 * Global Error Handler Service
 * 
 * Catches unhandled errors across the application and logs them appropriately.
 * In production, this should integrate with error tracking services like Sentry or LogRocket.
 */

import { Injectable, ErrorHandler, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface ErrorLog {
  message: string;
  stack?: string;
  url?: string;
  timestamp: Date;
  userAgent?: string;
  userId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  handleError(error: Error | any): void {
    // Log the error to console in development
    if (environment.enableDebugMode) {
      console.error('Global Error Handler caught:', error);
    }

    // Create error log object
    const errorLog: ErrorLog = {
      message: error?.message || error?.toString() || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date()
    };

    // Add URL if in browser
    if (isPlatformBrowser(this.platformId)) {
      errorLog.url = window.location.href;
      errorLog.userAgent = navigator.userAgent;
    }

    // Log error based on environment
    if (environment.production) {
      this.logToRemote(errorLog);
    } else if (environment.enableLogging) {
      this.logToConsole(errorLog);
    }

    // Show user-friendly error message
    this.showUserError();
  }

  private logToConsole(error: ErrorLog): void {
    console.error(`[${error.timestamp.toISOString()}]`, error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }

  private logToRemote(error: ErrorLog): void {
    // In production, send to error tracking service
    // Example: Sentry.captureException(error);
    
    // For now, we'll store in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      errors.push(error);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.shift();
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(errors));
    } catch (e) {
      // localStorage is full or not available, fail silently
      console.warn('Could not store error log:', e);
    }
  }

  private showUserError(): void {
    // Don't redirect if we're already on an error page
    if (this.router.url.includes('/error')) {
      return;
    }

    // Optionally redirect to error page or show toast notification
    // For a production app, you would typically show a toast/snackbar
    // and not redirect unless it's a critical error
    
    if (isPlatformBrowser(this.platformId)) {
      // Show a simple alert for critical errors (in production, use a toast)
      console.warn('An error occurred. Please try again or contact support.');
    }
  }
}

/**
 * Service to manually log errors from components
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorLoggingService {
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  logError(message: string, error?: any): void {
    const errorLog: ErrorLog = {
      message,
      stack: error?.stack,
      timestamp: new Date()
    };

    if (isPlatformBrowser(this.platformId)) {
      errorLog.url = window.location.href;
      errorLog.userAgent = navigator.userAgent;
    }

    if (environment.enableLogging) {
      if (environment.production) {
        // Send to remote logging service
        const errors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
        errors.push(errorLog);
        localStorage.setItem('errorLogs', JSON.stringify(errors));
      } else {
        console.error(message, error);
      }
    }
  }

  getErrorLogs(): ErrorLog[] {
    return JSON.parse(localStorage.getItem('errorLogs') || '[]');
  }

  clearErrorLogs(): void {
    localStorage.removeItem('errorLogs');
  }
}
