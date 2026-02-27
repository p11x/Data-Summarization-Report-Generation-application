/**
 * Advanced Analytics Service
 * 
 * Provides services for:
 * - Anomaly Detection
 * - What-If Analysis
 * - Semantic Search
 * - Forecasting/Prediction
 * - Data Lineage
 * - XAI (Explainable AI)
 * 
 * Uses REST API to communicate with backend
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

const API_BASE = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root'
})
export class AdvancedAnalyticsService {
  
  // Anomaly Detection
  detectAnomalies(datasetId: number, columnName: string, method: string = 'zscore', threshold: number = 2): Observable<any> {
    return this.http.post<any>(`${API_BASE}/anomalies/detect`, {
      datasetId,
      columnName,
      method,
      threshold
    }).pipe(
      tap(response => console.log('Anomaly detection completed:', response)),
      catchError(this.handleError('detectAnomalies', null))
    );
  }

  getAnomalies(datasetId: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/anomalies/${datasetId}`).pipe(
      catchError(this.handleError('getAnomalies', []))
    );
  }

  // What-If Analysis
  createScenario(data: {
    datasetId: number;
    name: string;
    description?: string;
    baseValues: Record<string, number>;
    modifiedValues: Record<string, number>;
    filters?: any[];
  }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/whatif/scenario`, data).pipe(
      tap(response => console.log('Scenario created:', response)),
      catchError(this.handleError('createScenario', null))
    );
  }

  getScenarios(datasetId: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/whatif/scenarios/${datasetId}`).pipe(
      catchError(this.handleError('getScenarios', []))
    );
  }

  compareScenarios(scenarioIds: number[]): Observable<any> {
    return this.http.post<any>(`${API_BASE}/whatif/compare`, { scenarioIds }).pipe(
      catchError(this.handleError('compareScenarios', null))
    );
  }

  // Semantic Search
  semanticSearch(datasetId: number, query: string): Observable<any> {
    return this.http.post<any>(`${API_BASE}/search/semantic`, {
      datasetId,
      query
    }).pipe(
      tap(response => console.log('Search completed:', response)),
      catchError(this.handleError('semanticSearch', null))
    );
  }

  // Forecasting
  generateForecast(data: {
    datasetId: number;
    columnName: string;
    modelType?: string;
    horizon?: number;
    parameters?: any;
  }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/forecast/predict`, data).pipe(
      tap(response => console.log('Forecast generated:', response)),
      catchError(this.handleError('generateForecast', null))
    );
  }

  getForecastModels(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/forecast/models`).pipe(
      catchError(this.handleError('getForecastModels', []))
    );
  }

  // Data Lineage
  trackLineage(data: {
    datasetId: number;
    name: string;
    description?: string;
    nodes: any[];
  }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/lineage/track`, data).pipe(
      tap(response => console.log('Lineage tracked:', response)),
      catchError(this.handleError('trackLineage', null))
    );
  }

  getLineage(datasetId: number): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/lineage/${datasetId}`).pipe(
      catchError(this.handleError('getLineage', []))
    );
  }

  // Data Quality
  validateQuality(datasetId: number): Observable<any> {
    return this.http.post<any>(`${API_BASE}/quality/validate`, { datasetId }).pipe(
      tap(response => console.log('Quality validation completed:', response)),
      catchError(this.handleError('validateQuality', null))
    );
  }

  // Privacy & Security
  applyPrivacyRules(datasetId: number, rules: any[]): Observable<any> {
    return this.http.post<any>(`${API_BASE}/privacy/apply`, {
      datasetId,
      rules
    }).pipe(
      tap(response => console.log('Privacy rules applied:', response)),
      catchError(this.handleError('applyPrivacyRules', null))
    );
  }

  savePrivacyRule(rule: {
    name: string;
    columnName: string;
    ruleType: string;
    parameters?: any;
  }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/privacy/rules`, rule).pipe(
      tap(response => console.log('Privacy rule saved:', response)),
      catchError(this.handleError('savePrivacyRule', null))
    );
  }

  // XAI (Explainable AI)
  explainInsight(data: {
    analysisId?: number;
    insightText: string;
    data: any[];
    targetColumn: string;
  }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/xai/explain`, data).pipe(
      tap(response => console.log('Explanation generated:', response)),
      catchError(this.handleError('explainInsight', null))
    );
  }

  // Model Comparison
  compareModels(data: {
    datasetId: number;
    targetColumn: string;
    models: any[];
  }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/models/compare`, data).pipe(
      tap(response => console.log('Model comparison completed:', response)),
      catchError(this.handleError('compareModels', null))
    );
  }

  // Offline Sync
  queueForSync(data: {
    operation: string;
    tableName: string;
    recordId: number;
    data: any;
  }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/sync/queue`, data).pipe(
      catchError(this.handleError('queueForSync', null))
    );
  }

  getPendingSyncItems(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/sync/pending`).pipe(
      catchError(this.handleError('getPendingSyncItems', []))
    );
  }

  markSynced(ids: number[]): Observable<any> {
    return this.http.post<any>(`${API_BASE}/sync/complete`, { ids }).pipe(
      catchError(this.handleError('markSynced', null))
    );
  }

  // Widgets
  getWidgets(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/widgets`).pipe(
      catchError(this.handleError('getWidgets', []))
    );
  }

  saveLayout(data: {
    name: string;
    widgets: any[];
    isDefault?: boolean;
  }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/widgets/layout`, data).pipe(
      tap(response => console.log('Layout saved:', response)),
      catchError(this.handleError('saveLayout', null))
    );
  }

  getLayouts(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/widgets/layouts`).pipe(
      catchError(this.handleError('getLayouts', []))
    );
  }

  // Plugins
  getPlugins(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/plugins`).pipe(
      catchError(this.handleError('getPlugins', []))
    );
  }

  installPlugin(plugin: {
    name: string;
    version: string;
    description?: string;
    author?: string;
    manifest: any;
  }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/plugins/install`, plugin).pipe(
      tap(response => console.log('Plugin installed:', response)),
      catchError(this.handleError('installPlugin', null))
    );
  }

  togglePlugin(id: number, enabled: boolean): Observable<any> {
    return this.http.post<any>(`${API_BASE}/plugins/${id}/toggle`, { enabled }).pipe(
      catchError(this.handleError('togglePlugin', null))
    );
  }

  // Datasets
  getDatasets(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/datasets`).pipe(
      catchError(this.handleError('getDatasets', []))
    );
  }

  getDataset(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE}/datasets/${id}`).pipe(
      catchError(this.handleError('getDataset', null))
    );
  }

  createDataset(data: {
    name: string;
    description?: string;
    data: any[];
    fileSize?: number;
  }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/datasets`, data).pipe(
      tap(response => console.log('Dataset created:', response)),
      catchError(this.handleError('createDataset', null))
    );
  }

  // Reports
  getReports(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE}/reports`).pipe(
      catchError(this.handleError('getReports', []))
    );
  }

  createReport(data: {
    title: string;
    content: string;
    type?: string;
    datasetId?: number;
  }): Observable<any> {
    return this.http.post<any>(`${API_BASE}/reports`, data).pipe(
      tap(response => console.log('Report created:', response)),
      catchError(this.handleError('createReport', null))
    );
  }

  // Error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }

  constructor(private http: HttpClient) {}
}
