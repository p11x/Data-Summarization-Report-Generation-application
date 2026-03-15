/**
 * Sentry Error Tracking Service
 * 
 * Integrates Sentry for production error tracking.
 * Get your DSN from https://sentry.io
 */

import { Injectable, ErrorHandler, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import * as Sentry from '@sentry/angular';
import { environment } from '../../environments/environment';

// Replace with your actual Sentry DSN
const SENTRY_DSN = 'https://d12f1a82168144c49b4b011646f84412@o4508294796462080.ingest.sentry.io/4508294796462080';

@Injectable({
  providedIn: 'root'
})
export class SentryService {
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.initSentry();
  }

  private initSentry(): void {
    // Only initialize in browser and production
    if (isPlatformBrowser(this.platformId) && environment.production) {
      if (SENTRY_DSN && SENTRY_DSN !== 'YOUR_SENTRY_DSN_HERE') {
        Sentry.init({
          dsn: SENTRY_DSN,
          environment: 'production',
          // Performance monitoring
          tracesSampleRate: 0.1,
          // Release tracking
          release: `app3@${environment.appVersion}`,
          // Ignore common non-critical errors
          ignoreErrors: [
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications',
          ],
          // Angular integration
          integrations: [
            Sentry.browserTracingIntegration(),
          ]
        });

        console.log('Sentry initialized for production');
      } else {
        console.warn('Sentry DSN not configured. Add your DSN to src/app/services/sentry.service.ts');
      }
    }
  }

  /**
   * Capture a custom message
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
    if (isPlatformBrowser(this.platformId) && environment.production) {
      Sentry.captureMessage(message, level);
    }
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: Record<string, unknown>): void {
    if (isPlatformBrowser(this.platformId) && environment.production) {
      if (context) {
        Sentry.setContext('additional', context);
      }
      Sentry.captureException(error);
    }
  }

  /**
   * Set user context
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    if (isPlatformBrowser(this.platformId)) {
      Sentry.setUser(user);
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUser(): void {
    if (isPlatformBrowser(this.platformId)) {
      Sentry.setUser(null);
    }
  }

  /**
   * Add breadcrumb for tracking user actions
   */
  addBreadcrumb(
    message: string,
    category: string = 'action',
    level: Sentry.SeverityLevel = 'info'
  ): void {
    if (isPlatformBrowser(this.platformId) && environment.production) {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        timestamp: Date.now() / 1000
      });
    }
  }
}
