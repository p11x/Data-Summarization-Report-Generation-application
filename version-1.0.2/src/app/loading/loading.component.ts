import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService, LoadingState } from '../services/loading.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="loadingState.isLoading" class="loading-overlay">
      <div class="loading-container">
        <!-- Spinner -->
        <div *ngIf="loadingState.type === 'spinner'" class="spinner">
          <div class="spinner-circle"></div>
        </div>
        
        <!-- Progress Bar -->
        <div *ngIf="loadingState.type === 'progress'" class="progress-container">
          <div class="progress-bar"></div>
        </div>
        
        <!-- Loading Message -->
        <p *ngIf="loadingState.message" class="loading-message">
          {{ loadingState.message }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .loading-container {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .spinner {
      width: 50px;
      height: 50px;
      margin: 0 auto;
    }

    .spinner-circle {
      width: 100%;
      height: 100%;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #0078d4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-message {
      margin-top: 1rem;
      color: #333;
      font-size: 14px;
    }

    .progress-container {
      width: 200px;
      height: 8px;
      background: #f3f3f3;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: #0078d4;
      animation: progress 1.5s ease-in-out infinite;
    }

    @keyframes progress {
      0% { width: 0%; }
      50% { width: 70%; }
      100% { width: 100%; }
    }
  `]
})
export class LoadingComponent implements OnInit, OnDestroy {
  loadingState: LoadingState = { isLoading: false };
  private subscription?: Subscription;

  constructor(private loadingService: LoadingService) {}

  ngOnInit(): void {
    this.subscription = this.loadingService.loading$.subscribe(
      state => this.loadingState = state
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
