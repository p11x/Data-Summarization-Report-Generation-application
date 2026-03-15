import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Analytics Service
 * 
 * Provides Google Analytics integration for the application.
 * Tracks page views, events, and user interactions.
 * 
 * To use:
 * 1. Add your GA_MEASUREMENT_ID to environment.prod.ts
 * 2. Initialize in app.component.ts
 * 3. Use trackEvent() to track custom events
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private measurementId: string = '';
  private isInitialized: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Load measurement ID from environment
    this.measurementId = this.getMeasurementId();
  }

  private getMeasurementId(): string {
    // Check for measurement ID in environment or window
    if (typeof window !== 'undefined') {
      const envId = (window as any).__env_measurement_id;
      if (envId) return envId;
    }
    // Default - replace with your GA Measurement ID
    return 'G-XXXXXXXXXX';
  }

  /**
   * Initialize Google Analytics
   * Should be called in app.component.ts after app initialization
   */
  init(): void {
    if (!isPlatformBrowser(this.platformId) || this.isInitialized) {
      return;
    }

    // Load gtag script
    this.loadGtagScript();
    this.isInitialized = true;
  }

  private loadGtagScript(): void {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if ((window as any).gtag) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).gtag = function() {
      (window as any).dataLayer.push(arguments);
    };
    (window as any).gtag('js', new Date());
    (window as any).gtag('config', this.measurementId, {
      page_path: window.location.pathname,
      debug_mode: window.location.hostname === 'localhost'
    });
  }

  /**
   * Track a page view
   */
  trackPageView(pagePath: string, pageTitle?: string): void {
    if (!isPlatformBrowser(this.platformId) || !(window as any).gtag) return;

    (window as any).gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title
    });
  }

  /**
   * Track a custom event
   */
  trackEvent(eventName: string, eventParams?: Record<string, any>): void {
    if (!isPlatformBrowser(this.platformId) || !(window as any).gtag) return;

    (window as any).gtag('event', eventName, eventParams);
  }

  /**
   * Track file upload events
   */
  trackFileUpload(fileName: string, fileSize: number, fileType: string): void {
    this.trackEvent('file_upload', {
      event_category: 'engagement',
      event_label: fileName,
      value: fileSize,
      file_type: fileType
    });
  }

  /**
   * Track report generation
   */
  trackReportGeneration(reportType: string, success: boolean): void {
    this.trackEvent('report_generation', {
      event_category: 'engagement',
      event_label: reportType,
      success: success
    });
  }

  /**
   * Track navigation to features
   */
  trackFeatureNavigation(featureName: string): void {
    this.trackEvent('feature_navigation', {
      event_category: 'navigation',
      event_label: featureName
    });
  }

  /**
   * Track data processing
   */
  trackDataProcessing(action: string, rowCount: number): void {
    this.trackEvent('data_processing', {
      event_category: 'data',
      event_label: action,
      value: rowCount
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!isPlatformBrowser(this.platformId) || !(window as any).gtag) return;

    (window as any).gtag('set', 'user_properties', properties);
  }
}
