import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdvancedAnalyticsService } from '../services/advanced-analytics.service';
import { DataAnalysisService } from '../services/data-analysis.service';

@Component({
  selector: 'app-data-lineage',
  template: `
    <div class="lineage-container">
      <header class="page-header">
        <div class="header-left">
          <button class="back-btn" (click)="goBack()">← Back</button>
          <div class="header-title">
            <h1>🔗 Data Lineage</h1>
            <p class="subtitle">Track data flow from source to insights</p>
          </div>
        </div>
      </header>

      <div class="lineage-content">
        <div class="flow-section">
          <h3>📊 Data Pipeline Flow</h3>
          <div class="pipeline-flow">
            <div class="flow-node source">
              <span class="node-icon">📁</span>
              <span class="node-label">Source Data</span>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-node transform">
              <span class="node-icon">🔄</span>
              <span class="node-label">Transform</span>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-node analysis">
              <span class="node-icon">📈</span>
              <span class="node-label">Analysis</span>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-node visualization">
              <span class="node-icon">📊</span>
              <span class="node-label">Visualization</span>
            </div>
            <div class="flow-arrow">→</div>
            <div class="flow-node report">
              <span class="node-icon">📄</span>
              <span class="node-label">Report</span>
            </div>
          </div>
        </div>

        <div class="tracking-section">
          <div class="form-card">
            <h3>Track New Lineage</h3>
            <div class="form-group">
              <label>Pipeline Name:</label>
              <input type="text" [(ngModel)]="pipelineName" placeholder="e.g., Sales Analysis Pipeline" />
            </div>
            <button class="track-btn" (click)="trackLineage()" [disabled]="!pipelineName">
              🔗 Track Lineage
            </button>
          </div>
        </div>

        <div class="history-section" *ngIf="lineageHistory.length > 0">
          <h3>📜 Lineage History</h3>
          <div class="history-list">
            <div *ngFor="let item of lineageHistory" class="history-card">
              <div class="history-header">
                <span class="history-name">{{ item.name }}</span>
                <span class="history-date">{{ item.date | date:'short' }}</span>
              </div>
              <div class="history-flow">
                <span *ngFor="let step of item.steps" class="step-badge">{{ step }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lineage-container { min-height: 100vh; background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%); }
    .page-header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 1.5rem 2rem; }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .back-btn { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }
    .header-title h1 { margin: 0; font-size: 1.5rem; }
    .subtitle { margin: 0.25rem 0 0 0; color: rgba(255,255,255,0.7); font-size: 0.85rem; }
    .lineage-content { padding: 2rem; max-width: 1000px; margin: 0 auto; }
    .flow-section, .tracking-section, .history-section { margin-bottom: 2rem; }
    .flow-section h3, .history-section h3 { margin: 0 0 1rem 0; color: #1a1a2e; }
    .pipeline-flow { display: flex; align-items: center; justify-content: center; gap: 0.5rem; flex-wrap: wrap; }
    .flow-node { display: flex; flex-direction: column; align-items: center; padding: 1rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); min-width: 100px; }
    .flow-node.source { border-top: 3px solid #667eea; }
    .flow-node.transform { border-top: 3px solid #f59e0b; }
    .flow-node.analysis { border-top: 3px solid #10b981; }
    .flow-node.visualization { border-top: 3px solid #3b82f6; }
    .flow-node.report { border-top: 3px solid #8b5cf6; }
    .node-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .node-label { font-size: 0.85rem; color: #6b7280; font-weight: 500; }
    .flow-arrow { font-size: 1.5rem; color: #9ca3af; }
    .form-card { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .form-card h3 { margin: 0 0 1rem 0; color: #1a1a2e; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-weight: 500; color: #374151; margin-bottom: 0.5rem; }
    .form-group input { width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; }
    .track-btn { width: 100%; padding: 0.75rem; background: #667eea; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .track-btn:disabled { opacity: 0.6; }
    .history-list { display: grid; gap: 1rem; }
    .history-card { background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .history-header { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
    .history-name { font-weight: 600; color: #1a1a2e; }
    .history-date { font-size: 0.85rem; color: #6b7280; }
    .history-flow { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .step-badge { padding: 0.25rem 0.75rem; background: #f3f4f6; border-radius: 20px; font-size: 0.8rem; color: #6b7280; }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DataLineageComponent implements OnInit {
  pipelineName: string = '';
  lineageHistory: any[] = [];

  constructor(
    private router: Router,
    private analyticsService: AdvancedAnalyticsService,
    private dataService: DataAnalysisService
  ) {}

  ngOnInit() {
    // Load lineage history from localStorage
    const saved = localStorage.getItem('lineageHistory');
    if (saved) {
      this.lineageHistory = JSON.parse(saved);
    }
  }

  trackLineage() {
    if (!this.pipelineName) return;

    const newEntry = {
      name: this.pipelineName,
      date: new Date(),
      steps: ['Source', 'Transform', 'Analysis', 'Visualization', 'Report']
    };

    this.lineageHistory.unshift(newEntry);
    localStorage.setItem('lineageHistory', JSON.stringify(this.lineageHistory));
    this.pipelineName = '';
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
