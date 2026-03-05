import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AdvancedAnalyticsService } from '../services/advanced-analytics.service';
import { DataAnalysisService } from '../services/data-analysis.service';

@Component({
  selector: 'app-forecasting',
  template: `
    <div class="forecast-container">
      <header class="page-header">
        <div class="header-left">
          <button class="back-btn" (click)="goBack()">← Back</button>
          <div class="header-title">
            <h1>📈 Forecasting & Prediction</h1>
            <p class="subtitle">Predict future trends using historical data</p>
          </div>
        </div>
      </header>

      <div class="forecast-content">
        <div class="config-section" *ngIf="!forecastResults">
          <div class="form-card">
            <h2>Configure Forecast</h2>
            
            <div class="form-group">
              <label>Select Column to Forecast:</label>
              <select [(ngModel)]="selectedColumn">
                <option *ngFor="let col of numericColumns" [value]="col">{{ col }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Forecast Model:</label>
              <div class="model-options">
                <label class="radio-card" [class.selected]="modelType === 'moving_average'">
                  <input type="radio" name="model" value="moving_average" [(ngModel)]="modelType" />
                  <span class="model-name">Moving Average</span>
                  <span class="model-desc">Simple trend based on recent values</span>
                </label>
                <label class="radio-card" [class.selected]="modelType === 'linear_regression'">
                  <input type="radio" name="model" value="linear_regression" [(ngModel)]="modelType" />
                  <span class="model-name">Linear Regression</span>
                  <span class="model-desc">Linear trend projection</span>
                </label>
                <label class="radio-card" [class.selected]="modelType === 'exponential_smoothing'">
                  <input type="radio" name="model" value="exponential_smoothing" [(ngModel)]="modelType" />
                  <span class="model-name">Exp. Smoothing</span>
                  <span class="model-desc">Weighted average forecast</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>Forecast Horizon: {{ horizon }} periods</label>
              <input type="range" [(ngModel)]="horizon" min="3" max="24" />
            </div>

            <div class="form-group" *ngIf="modelType === 'moving_average'">
              <label>Window Size: {{ windowSize }}</label>
              <input type="range" [(ngModel)]="windowSize" min="2" max="10" />
            </div>

            <button class="forecast-btn" (click)="generateForecast()" [disabled]="!selectedColumn || isForecasting">
              {{ isForecasting ? 'Forecasting...' : '🔮 Generate Forecast' }}
            </button>
          </div>
        </div>

        <div class="results-section" *ngIf="forecastResults">
          <div class="results-header">
            <h3>📊 Forecast Results</h3>
            <button class="new-btn" (click)="clearResults()">🔄 New Forecast</button>
          </div>

          <div class="metrics-grid">
            <div class="metric-card" *ngFor="let key of getMetricKeys()">
              <span class="metric-label">{{ key }}</span>
              <span class="metric-value">{{ forecastResults.metrics[key] }}</span>
            </div>
          </div>

          <div class="chart-section">
            <h4>📈 Forecast Visualization</h4>
            <div class="chart-container">
              <div class="chart">
                <div class="historical-line">
                  <div *ngFor="let val of forecastResults.historicalData; let i = index" 
                    class="data-point"
                    [style.height.%]="getChartHeight(val)"
                    [style.left.%]="(i / forecastResults.historicalData.length) * 50">
                  </div>
                </div>
                <div class="forecast-line">
                  <div *ngFor="let pred of forecastResults.predictions; let i = index" 
                    class="data-point forecast"
                    [style.height.%]="getChartHeight(pred.predicted)"
                    [style.left.%]="50 + (i / forecastResults.predictions.length * 50)">
                  </div>
                </div>
              </div>
              <div class="chart-legend">
                <span class="legend-item"><span class="dot historical"></span> Historical</span>
                <span class="legend-item"><span class="dot forecast"></span> Forecast</span>
              </div>
            </div>
          </div>

          <div class="predictions-table">
            <h4>📋 Predictions</h4>
            <div class="table-header">
              <span>Period</span>
              <span>Predicted Value</span>
              <span>Confidence</span>
            </div>
            <div *ngFor="let pred of forecastResults.predictions" class="table-row">
              <span>{{ pred.period }}</span>
              <span>{{ pred.predicted | number:'1.2-2' }}</span>
              <span>{{ (pred.confidence * 100) | number:'1.0-0' }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forecast-container { min-height: 100vh; background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%); }
    .page-header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 1.5rem 2rem; }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .back-btn { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }
    .header-title h1 { margin: 0; font-size: 1.5rem; }
    .subtitle { margin: 0.25rem 0 0 0; color: rgba(255,255,255,0.7); font-size: 0.85rem; }
    .forecast-content { padding: 2rem; max-width: 1000px; margin: 0 auto; }
    .form-card { background: white; padding: 2rem; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .form-card h2 { margin: 0 0 1.5rem 0; color: #1a1a2e; text-align: center; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; font-weight: 500; color: #374151; margin-bottom: 0.5rem; }
    .form-group select { width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem; }
    .model-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
    .radio-card { display: flex; flex-direction: column; padding: 1rem; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
    .radio-card:hover, .radio-card.selected { border-color: #667eea; background: #f0f1ff; }
    .radio-card input { display: none; }
    .model-name { font-weight: 600; color: #1a1a2e; }
    .model-desc { font-size: 0.85rem; color: #6b7280; }
    input[type="range"] { width: 100%; }
    .forecast-btn { display: block; width: 100%; padding: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-size: 1.1rem; font-weight: 600; cursor: pointer; }
    .forecast-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102,126,234,0.4); }
    .forecast-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .results-header h3 { margin: 0; color: #1a1a2e; }
    .new-btn { padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .metric-card { background: white; padding: 1.25rem; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .metric-label { display: block; color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .metric-value { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; }
    .chart-section { background: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; }
    .chart-section h4 { margin: 0 0 1rem 0; color: #1a1a2e; }
    .chart-container { position: relative; height: 250px; background: #f8f9fa; border-radius: 8px; padding: 1rem; }
    .chart { position: relative; height: 100%; }
    .data-point { position: absolute; width: 8px; height: 8px; border-radius: 50%; transform: translate(-50%, 50%); }
    .data-point.historical { background: #667eea; }
    .data-point.forecast { background: #10b981; }
    .chart-legend { display: flex; justify-content: center; gap: 2rem; margin-top: 1rem; }
    .legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #6b7280; }
    .dot { width: 12px; height: 12px; border-radius: 50%; }
    .dot.historical { background: #667eea; }
    .dot.forecast { background: #10b981; }
    .predictions-table { background: white; border-radius: 12px; overflow: hidden; }
    .predictions-table h4 { margin: 0; padding: 1rem; background: #f3f4f6; color: #1a1a2e; }
    .table-header, .table-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; padding: 0.75rem 1rem; }
    .table-header { background: #f3f4f6; font-weight: 600; color: #374151; }
    .table-row { border-bottom: 1px solid #e5e7eb; }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ForecastingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  data: any[] = [];
  numericColumns: string[] = [];
  selectedColumn: string = '';
  modelType: string = 'moving_average';
  horizon: number = 12;
  windowSize: number = 3;
  
  isForecasting: boolean = false;
  forecastResults: any = null;

  constructor(
    private router: Router,
    private analyticsService: AdvancedAnalyticsService,
    private dataService: DataAnalysisService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    const fileData = this.dataService.getFileData();
    if (fileData && fileData.parsedData && fileData.parsedData.length > 0) {
      this.data = fileData.parsedData;
      this.numericColumns = Object.keys(this.data[0] || {}).filter(col => {
        const val = parseFloat(this.data[0][col]);
        return !isNaN(val);
      });
      this.selectedColumn = this.numericColumns[0] || '';
    }
  }

  generateForecast() {
    if (!this.selectedColumn) return;
    
    this.isForecasting = true;
    
    const values = this.data
      .map(row => parseFloat(row[this.selectedColumn]))
      .filter(v => !isNaN(v));

    if (values.length < 3) {
      this.isForecasting = false;
      return;
    }

    // Local forecasting
    const predictions: any[] = [];
    
    if (this.modelType === 'moving_average') {
      for (let i = 0; i < this.horizon; i++) {
        const window = values.slice(-this.windowSize);
        const avg = window.reduce((a, b) => a + b, 0) / window.length;
        predictions.push({
          period: values.length + i + 1,
          predicted: avg,
          confidence: Math.max(0.7, 0.95 - (i * 0.02))
        });
      }
    } else if (this.modelType === 'linear_regression') {
      const n = values.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumX2 += i * i;
      }
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      for (let i = 0; i < this.horizon; i++) {
        const x = n + i;
        predictions.push({
          period: x + 1,
          predicted: slope * x + intercept,
          confidence: Math.max(0.7, 0.95 - (i * 0.03))
        });
      }
    } else {
      const alpha = 0.3;
      let smoothed = values[0];
      for (let i = 1; i < values.length; i++) {
        smoothed = alpha * values[i] + (1 - alpha) * smoothed;
      }
      for (let i = 0; i < this.horizon; i++) {
        predictions.push({
          period: values.length + i + 1,
          predicted: smoothed,
          confidence: Math.max(0.6, 0.9 - (i * 0.04))
        });
      }
    }

    this.forecastResults = {
      modelType: this.modelType,
      targetColumn: this.selectedColumn,
      horizon: this.horizon,
      predictions,
      metrics: {
        'Method': this.modelType.replace('_', ' ').toUpperCase(),
        'Data Points': values.length,
        'Last Value': values[values.length - 1].toFixed(2),
        'Average': (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
      },
      historicalData: values.slice(-20)
    };

    this.isForecasting = false;
  }

  getChartHeight(value: number): number {
    if (!this.forecastResults) return 0;
    const allValues = [...this.forecastResults.historicalData, ...this.forecastResults.predictions.map((p: any) => p.predicted)];
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    return ((value - min) / (max - min)) * 100;
  }

  getMetricKeys(): string[] {
    return this.forecastResults ? Object.keys(this.forecastResults.metrics) : [];
  }

  clearResults() {
    this.forecastResults = null;
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
