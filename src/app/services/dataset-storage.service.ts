import { Injectable } from '@angular/core';
import { FileData, DataSummary, ColumnAnalysis, KeyInsight, ReportConfig } from './data-analysis.service';

export interface StoredDataset {
  // File info
  name: string;
  size: number;
  type: string;
  
  // Parsed data
  parsedData: any[];
  headers: string[];
  
  // Analysis results
  dataSummary: DataSummary | null;
  columnAnalysis: ColumnAnalysis[];
  keyInsights: KeyInsight[];
  reportConfig: ReportConfig | null;
  
  // Source tracking
  source: 'upload' | 'search' | 'api';
  originalUrl?: string;
  
  // Timestamp
  storedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DatasetStorageService {
  private storageKey = 'app3_dataset_storage';
  private currentDataset: StoredDataset | null = null;

  constructor() {
    // Load from sessionStorage on init (for SSR compatibility)
    this.loadFromStorage();
  }

  /**
   * Store a dataset from file upload
   */
  setDatasetFromUpload(fileData: FileData, dataSummary: DataSummary | null, columnAnalysis: ColumnAnalysis[], keyInsights: KeyInsight[], reportConfig: ReportConfig | null): void {
    this.currentDataset = {
      name: fileData.name,
      size: fileData.size,
      type: fileData.type,
      parsedData: fileData.parsedData,
      headers: fileData.headers,
      dataSummary,
      columnAnalysis,
      keyInsights,
      reportConfig,
      source: 'upload',
      storedAt: new Date()
    };
    
    this.saveToStorage();
    console.log('[DatasetStorage] Stored dataset from upload:', this.currentDataset.name);
  }

  /**
   * Store a dataset from search/API
   */
  setDatasetFromSearch(
    name: string, 
    parsedData: any[], 
    headers: string[],
    originalUrl?: string
  ): void {
    this.currentDataset = {
      name,
      size: 0,
      type: 'text/csv',
      parsedData,
      headers,
      dataSummary: null,
      columnAnalysis: [],
      keyInsights: [],
      reportConfig: null,
      source: 'search',
      originalUrl,
      storedAt: new Date()
    };
    
    this.saveToStorage();
    console.log('[DatasetStorage] Stored dataset from search:', this.currentDataset.name);
  }

  /**
   * Get the current dataset
   */
  getDataset(): StoredDataset | null {
    return this.currentDataset;
  }

  /**
   * Get raw file data structure (for report component compatibility)
   */
  getFileData(): FileData | null {
    if (!this.currentDataset) return null;
    
    return {
      name: this.currentDataset.name,
      size: this.currentDataset.size,
      type: this.currentDataset.type,
      content: '', // Content not stored for search datasets
      parsedData: this.currentDataset.parsedData,
      headers: this.currentDataset.headers,
      uploadDate: this.currentDataset.storedAt,
      processingTime: 0
    };
  }

  /**
   * Get data summary
   */
  getDataSummary(): DataSummary | null {
    return this.currentDataset?.dataSummary || null;
  }

  /**
   * Get column analysis
   */
  getColumnAnalysis(): ColumnAnalysis[] {
    return this.currentDataset?.columnAnalysis || [];
  }

  /**
   * Get key insights
   */
  getKeyInsights(): KeyInsight[] {
    return this.currentDataset?.keyInsights || [];
  }

  /**
   * Get report config
   */
  getReportConfig(): ReportConfig | null {
    return this.currentDataset?.reportConfig || null;
  }

  /**
   * Check if dataset is from search
   */
  isFromSearch(): boolean {
    return this.currentDataset?.source === 'search';
  }

  /**
   * Check if dataset is from upload
   */
  isFromUpload(): boolean {
    return this.currentDataset?.source === 'upload';
  }

  /**
   * Clear the stored dataset
   */
  clearDataset(): void {
    this.currentDataset = null;
    this.clearStorage();
    console.log('[DatasetStorage] Dataset cleared');
  }

  /**
   * Check if dataset exists
   */
  hasDataset(): boolean {
    return this.currentDataset !== null;
  }

  /**
   * Save to sessionStorage (SSR-safe)
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.currentDataset));
    } catch (e) {
      console.error('[DatasetStorage] Error saving to storage:', e);
    }
  }

  /**
   * Load from sessionStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = sessionStorage.getItem(this.storageKey);
      if (stored) {
        this.currentDataset = JSON.parse(stored);
        console.log('[DatasetStorage] Loaded dataset from storage:', this.currentDataset?.name);
      }
    } catch (e) {
      console.error('[DatasetStorage] Error loading from storage:', e);
    }
  }

  /**
   * Clear sessionStorage
   */
  private clearStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.removeItem(this.storageKey);
    } catch (e) {
      console.error('[DatasetStorage] Error clearing storage:', e);
    }
  }
}
