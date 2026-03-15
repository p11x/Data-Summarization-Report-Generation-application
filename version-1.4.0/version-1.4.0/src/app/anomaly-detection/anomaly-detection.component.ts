import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AdvancedAnalyticsService } from '../services/advanced-analytics.service';
import { DataAnalysisService } from '../services/data-analysis.service';

interface Anomaly {
  id: number;
  row_index: number;
  value: number;
  anomaly_type: string;
  severity: string;
  score: number;
  expected_value: number;
  deviation: number;
  description: string;
}

interface DatasetInfo {
  id: number;
  name: string;
  row_count: number;
  column_count: number;
}

@Component({
  selector: 'app-anomaly-detection',
  templateUrl: './anomaly-detection.component.html',
  styleUrls: ['./anomaly-detection.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AnomalyDetectionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  datasets: DatasetInfo[] = [];
  selectedDataset: DatasetInfo | null = null;
  columns: string[] = [];
  data: any[] = [];
  
  selectedColumn: string = '';
  method: string = 'zscore';
  threshold: number = 2;
  
  anomalies: Anomaly[] = [];
  isAnalyzing: boolean = false;
  summary: any = null;
  errorMessage: string = '';
  chartData: any[] = [];
  Math = Math;
  
  constructor(
    private router: Router,
    private analyticsService: AdvancedAnalyticsService,
    private dataService: DataAnalysisService
  ) {}

  ngOnInit() {
    this.loadDatasets();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDatasets() {
    const fileData = this.dataService.getFileData();
    if (fileData && fileData.parsedData && fileData.parsedData.length > 0) {
      this.data = fileData.parsedData;
      this.columns = Object.keys(this.data[0] || {});
      this.selectedColumn = this.columns[0] || '';
    }

    this.analyticsService.getDatasets()
      .pipe(takeUntil(this.destroy$))
      .subscribe(datasets => {
        if (datasets && datasets.length > 0) {
          this.datasets = datasets;
        }
      });
  }

  onDatasetChange() {
    if (this.selectedDataset) {
      this.analyticsService.getDataset(this.selectedDataset.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(dataset => {
          if (dataset && dataset.data) {
            this.data = dataset.data;
            this.columns = Object.keys(this.data[0] || {});
            this.selectedColumn = this.columns[0] || '';
          }
        });
    }
  }

  detectAnomalies() {
    if (!this.selectedColumn) {
      this.errorMessage = 'Please select a column to analyze';
      return;
    }

    this.isAnalyzing = true;
    this.errorMessage = '';
    this.anomalies = [];
    this.summary = null;

    if (this.data && this.data.length > 0) {
      this.detectLocally();
    }
  }

  detectLocally() {
    const values = this.data
      .map((row: any, index: number) => ({ value: parseFloat(row[this.selectedColumn]), index }))
      .filter((item: any) => !isNaN(item.value));

    if (values.length === 0) {
      this.errorMessage = 'No numeric data in selected column';
      this.isAnalyzing = false;
      return;
    }

    const numericValues = values.map((v: any) => v.value);
    const anomalies: Anomaly[] = [];

    if (this.method === 'zscore') {
      const mean = numericValues.reduce((a: number, b: number) => a + b, 0) / numericValues.length;
      const std = Math.sqrt(
        numericValues.reduce((sq: number, n: number) => sq + Math.pow(n - mean, 2), 0) / numericValues.length
      );

      values.forEach((item: any) => {
        const zscore = std > 0 ? (item.value - mean) / std : 0;
        if (Math.abs(zscore) > this.threshold) {
          anomalies.push({
            id: item.index,
            row_index: item.index,
            value: item.value,
            anomaly_type: zscore > 0 ? 'spike' : 'drop',
            severity: Math.abs(zscore) > 3 ? 'high' : Math.abs(zscore) > 2.5 ? 'medium' : 'low',
            score: Math.abs(zscore),
            expected_value: mean,
            deviation: item.value - mean,
            description: `Value ${zscore > 0 ? 'above' : 'below'} expected by ${Math.abs(zscore).toFixed(2)} std dev`
          });
        }
      });
    } else if (this.method === 'iqr') {
      const sorted = [...numericValues].sort((a: number, b: number) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - this.threshold * iqr;
      const upperBound = q3 + this.threshold * iqr;

      values.forEach((item: any) => {
        if (item.value < lowerBound || item.value > upperBound) {
          const deviation = item.value < lowerBound ? lowerBound - item.value : item.value - upperBound;
          anomalies.push({
            id: item.index,
            row_index: item.index,
            value: item.value,
            anomaly_type: item.value < lowerBound ? 'drop' : 'spike',
            severity: deviation > iqr * 1.5 ? 'high' : deviation > iqr ? 'medium' : 'low',
            score: deviation / iqr,
            expected_value: (q1 + q3) / 2,
            deviation: item.value - (q1 + q3) / 2,
            description: `Value outside IQR bounds [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]`
          });
        }
      });
    }

    this.anomalies = anomalies;
    this.summary = {
      total: anomalies.length,
      high: anomalies.filter(a => a.severity === 'high').length,
      medium: anomalies.filter(a => a.severity === 'medium').length,
      low: anomalies.filter(a => a.severity === 'low').length
    };
    
    this.isAnalyzing = false;
    this.prepareChartData();
  }

  prepareChartData() {
    this.chartData = this.data.slice(0, 100).map((row: any, index: number) => ({
      index,
      value: parseFloat(row[this.selectedColumn]),
      isAnomaly: this.anomalies.some(a => a.row_index === index),
      anomalyType: this.anomalies.find(a => a.row_index === index)?.anomaly_type
    }));
  }

  getAnomalyRows(): any[] {
    return this.anomalies.map(anomaly => ({
      ...anomaly,
      rowData: this.data[anomaly.row_index]
    })).slice(0, 50);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  clearResults() {
    this.anomalies = [];
    this.summary = null;
    this.chartData = [];
  }

  getMaxValue(): number {
    const values = this.chartData.map(p => Math.abs(p.value));
    return Math.max(...values);
  }
}
