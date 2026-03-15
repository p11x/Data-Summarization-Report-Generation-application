/**
 * Loading Service
 * 
 * Manages loading states across the application.
 * Use this service to show/hide loading indicators during async operations.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  type?: 'spinner' | 'skeleton' | 'progress';
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<LoadingState>({
    isLoading: false,
    message: '',
    type: 'spinner'
  });

  public loading$ = this.loadingSubject.asObservable();

  private loadingCount = 0;
  private loadingQueue: Map<string, LoadingState> = new Map();

  /**
   * Show loading indicator
   * @param message Optional message to display
   * @param type Type of loading indicator
   * @param key Optional key for multiple loading states
   */
  show(message: string = '', type: LoadingState['type'] = 'spinner', key?: string): void {
    this.loadingCount++;
    
    const state: LoadingState = {
      isLoading: true,
      message,
      type
    };

    if (key) {
      this.loadingQueue.set(key, state);
    }

    this.loadingSubject.next(state);
  }

  /**
   * Hide loading indicator
   * @param key Optional key to hide specific loading state
   */
  hide(key?: string): void {
    if (key) {
      this.loadingQueue.delete(key);
    } else if (this.loadingCount > 0) {
      this.loadingCount--;
    }

    // If there are still items in the queue, show the last one
    if (this.loadingQueue.size > 0) {
      const lastState = Array.from(this.loadingQueue.values()).pop();
      this.loadingSubject.next(lastState || { isLoading: false });
    } else if (this.loadingCount <= 0) {
      this.loadingSubject.next({ isLoading: false, message: '', type: 'spinner' });
      this.loadingCount = 0;
    }
  }

  /**
   * Show a spinner with message
   */
  showSpinner(message: string = 'Loading...'): void {
    this.show(message, 'spinner');
  }

  /**
   * Show skeleton loader
   */
  showSkeleton(message: string = 'Loading...'): void {
    this.show(message, 'skeleton');
  }

  /**
   * Show progress bar
   */
  showProgress(message: string = 'Processing...'): void {
    this.show(message, 'progress');
  }

  /**
   * Hide all loading states
   */
  hideAll(): void {
    this.loadingCount = 0;
    this.loadingQueue.clear();
    this.loadingSubject.next({ isLoading: false, message: '', type: 'spinner' });
  }

  /**
   * Check if currently loading
   */
  get isLoading(): boolean {
    return this.loadingSubject.value.isLoading;
  }

  /**
   * Get current loading state
   */
  get currentState(): LoadingState {
    return this.loadingSubject.value;
  }
}
