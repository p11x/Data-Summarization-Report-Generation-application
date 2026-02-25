import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FileData {
  name: string;
  size: number;
  type: string;
  content: string;
  parsedData: any[];
  headers: string[];
  uploadDate: Date;
  processingTime: number;
}

export interface RecentFile {
  name: string;
  date: string;
  size: string;
  type: 'uploaded' | 'downloaded';
}

export interface ColumnAnalysis {
  name: string;
  type: 'Numeric' | 'Text' | 'Date';
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  unique?: number;
  top?: string;
  topFrequency?: number;
  nullCount: number;
  nullPercentage: number;
  values: any[];
}

export interface DataSummary {
  totalRows: number;
  totalColumns: number;
  numericColumns: number;
  textColumns: number;
  dateColumns: number;
  missingValues: number;
  missingPercentage: number;
  duplicateRows: number;
}

export interface KeyInsight {
  type: 'trend' | 'anomaly' | 'highlight' | 'comparison';
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
}

export interface ReportConfig {
  title: string;
  description: string;
  generatedBy: string;
  reportId: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataAnalysisService {
  private fileDataSubject = new BehaviorSubject<FileData | null>(null);
  private columnAnalysisSubject = new BehaviorSubject<ColumnAnalysis[]>([]);
  private dataSummarySubject = new BehaviorSubject<DataSummary | null>(null);
  private keyInsightsSubject = new BehaviorSubject<KeyInsight[]>([]);
  private reportConfigSubject = new BehaviorSubject<ReportConfig>({
    title: 'Data Analysis Report',
    description: 'Automated analysis of uploaded data',
    generatedBy: 'Data Analysis System',
    reportId: this.generateReportId()
  });

  // Recent files tracking
  private recentUploadedFilesSubject = new BehaviorSubject<RecentFile[]>([]);
  private recentDownloadedFilesSubject = new BehaviorSubject<RecentFile[]>([]);

  fileData$: Observable<FileData | null> = this.fileDataSubject.asObservable();
  columnAnalysis$: Observable<ColumnAnalysis[]> = this.columnAnalysisSubject.asObservable();
  dataSummary$: Observable<DataSummary | null> = this.dataSummarySubject.asObservable();
  keyInsights$: Observable<KeyInsight[]> = this.keyInsightsSubject.asObservable();
  reportConfig$: Observable<ReportConfig> = this.reportConfigSubject.asObservable();
  recentUploadedFiles$: Observable<RecentFile[]> = this.recentUploadedFilesSubject.asObservable();
  recentDownloadedFiles$: Observable<RecentFile[]> = this.recentDownloadedFilesSubject.asObservable();

  constructor() {}

  private generateReportId(): string {
    return 'RPT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  }

  async processFile(file: File): Promise<void> {
    const startTime = Date.now();
    const content = await this.readFileContent(file);
    const { parsedData, headers } = this.parseCSV(content);
    const processingTime = Date.now() - startTime;
    
    console.log('Processing file:', file.name);
    console.log('Parsed data rows:', parsedData.length);
    console.log('Headers:', headers);
    
    const fileData: FileData = {
      name: file.name,
      size: file.size,
      type: file.type || 'text/csv',
      content: content,
      parsedData: parsedData,
      headers: headers,
      uploadDate: new Date(),
      processingTime: processingTime
    };

    this.fileDataSubject.next(fileData);
    this.analyzeData(parsedData, headers);
    this.generateInsights();
    
    // Update report config
    this.reportConfigSubject.next({
      title: `Analysis Report - ${file.name}`,
      description: `Automated analysis of ${file.name} containing ${parsedData.length} records and ${headers.length} columns.`,
      generatedBy: 'Data Analysis System v1.0',
      reportId: this.generateReportId()
    });
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  private parseCSV(content: string): { parsedData: any[], headers: string[] } {
    const lines = content.trim().split('\n');
    if (lines.length === 0) {
      return { parsedData: [], headers: [] };
    }

    const headers = this.parseCSVLine(lines[0]);
    const parsedData: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        parsedData.push(row);
      }
    }

    return { parsedData, headers };
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  }

  private analyzeData(data: any[], headers: string[]): void {
    const columnAnalysis: ColumnAnalysis[] = [];
    let numericColumns = 0;
    let textColumns = 0;
    let dateColumns = 0;
    let missingValues = 0;

    // Check for duplicate rows
    const rowStrings = data.map(row => JSON.stringify(row));
    const duplicateRows = rowStrings.length - new Set(rowStrings).size;

    console.log('Analyzing data with', data.length, 'rows and', headers.length, 'columns');

    headers.forEach(header => {
      const values = data.map(row => row[header]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      const nullCount = values.length - nonNullValues.length;
      const nullPercentage = (nullCount / values.length) * 100;
      missingValues += nullCount;

      // Check if date
      const dateValues = nonNullValues.filter(v => !isNaN(Date.parse(v)));
      const isDate = dateValues.length > nonNullValues.length * 0.8;

      // Check if numeric
      const numericValues = nonNullValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
      const isNumeric = !isDate && numericValues.length > nonNullValues.length * 0.5;

      console.log(`Column "${header}": isDate=${isDate}, isNumeric=${isNumeric}, nonNullCount=${nonNullValues.length}, numericCount=${numericValues.length}`);

      if (isDate) {
        dateColumns++;
        columnAnalysis.push({
          name: header,
          type: 'Date',
          nullCount,
          nullPercentage,
          values: nonNullValues,
          unique: new Set(nonNullValues).size
        });
      } else if (isNumeric && numericValues.length > 0) {
        numericColumns++;
        const sorted = [...numericValues].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const median = sorted.length % 2 === 0 
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 
          : sorted[Math.floor(sorted.length / 2)];
        const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericValues.length;
        const stdDev = Math.sqrt(variance);

        columnAnalysis.push({
          name: header,
          type: 'Numeric',
          min: Math.round(min * 100) / 100,
          max: Math.round(max * 100) / 100,
          mean: Math.round(mean * 100) / 100,
          median: Math.round(median * 100) / 100,
          stdDev: Math.round(stdDev * 100) / 100,
          nullCount,
          nullPercentage,
          values: numericValues
        });
      } else {
        textColumns++;
        const uniqueValues = [...new Set(nonNullValues)];
        const valueCounts: { [key: string]: number } = {};
        nonNullValues.forEach(v => {
          valueCounts[v] = (valueCounts[v] || 0) + 1;
        });
        const sortedCounts = Object.entries(valueCounts).sort((a, b) => b[1] - a[1]);
        const top = sortedCounts[0]?.[0] || '';
        const topFrequency = sortedCounts[0]?.[1] || 0;

        columnAnalysis.push({
          name: header,
          type: 'Text',
          unique: uniqueValues.length,
          top,
          topFrequency,
          nullCount,
          nullPercentage,
          values: nonNullValues
        });
      }
    });

    const summary: DataSummary = {
      totalRows: data.length,
      totalColumns: headers.length,
      numericColumns,
      textColumns,
      dateColumns,
      missingValues,
      missingPercentage: (missingValues / (data.length * headers.length)) * 100,
      duplicateRows
    };

    console.log('Column analysis complete:', columnAnalysis);
    console.log('Summary:', summary);

    this.columnAnalysisSubject.next(columnAnalysis);
    this.dataSummarySubject.next(summary);
  }

  private generateInsights(): void {
    const insights: KeyInsight[] = [];
    const summary = this.dataSummarySubject.value;
    const analysis = this.columnAnalysisSubject.value;

    if (!summary || analysis.length === 0) return;

    // Data quality insights
    if (summary.missingPercentage > 20) {
      insights.push({
        type: 'anomaly',
        title: 'High Missing Data',
        description: `${summary.missingPercentage.toFixed(1)}% of data is missing. Consider data imputation or cleaning.`,
        importance: 'high'
      });
    }

    if (summary.duplicateRows > 0) {
      insights.push({
        type: 'anomaly',
        title: 'Duplicate Records Found',
        description: `${summary.duplicateRows} duplicate rows detected in the dataset.`,
        importance: 'medium'
      });
    }

    // Numeric column insights
    const numericCols = analysis.filter(c => c.type === 'Numeric');
    numericCols.forEach(col => {
      if (col.mean !== undefined && col.stdDev !== undefined) {
        const coefficient = col.stdDev / col.mean;
        if (coefficient > 1) {
          insights.push({
            type: 'highlight',
            title: `High Variability in ${col.name}`,
            description: `${col.name} shows high variability (CV: ${(coefficient * 100).toFixed(1)}%). Values range from ${col.min} to ${col.max}.`,
            importance: 'medium'
          });
        }
      }
    });

    // Text column insights
    const textCols = analysis.filter(c => c.type === 'Text');
    textCols.forEach(col => {
      if (col.unique && col.top && col.topFrequency) {
        const uniqueness = (col.unique / (summary.totalRows - col.nullCount)) * 100;
        if (uniqueness < 10) {
          insights.push({
            type: 'trend',
            title: `Low Diversity in ${col.name}`,
            description: `Most common value "${col.top}" appears ${col.topFrequency} times (${((col.topFrequency / summary.totalRows) * 100).toFixed(1)}%).`,
            importance: 'low'
          });
        }
      }
    });

    // General insights
    insights.push({
      type: 'comparison',
      title: 'Data Composition',
      description: `Dataset contains ${summary.numericColumns} numeric, ${summary.textColumns} text, and ${summary.dateColumns} date columns.`,
      importance: 'low'
    });

    this.keyInsightsSubject.next(insights);
  }

  getFileData(): FileData | null {
    return this.fileDataSubject.value;
  }

  getColumnAnalysis(): ColumnAnalysis[] {
    return this.columnAnalysisSubject.value;
  }

  getDataSummary(): DataSummary | null {
    return this.dataSummarySubject.value;
  }

  getKeyInsights(): KeyInsight[] {
    return this.keyInsightsSubject.value;
  }

  getReportConfig(): ReportConfig {
    return this.reportConfigSubject.value;
  }

  getSampleData(rows: number = 10): any[] {
    const fileData = this.fileDataSubject.value;
    if (!fileData) return [];
    return fileData.parsedData.slice(0, rows);
  }

  getChartData(columnName: string, chartType: 'bar' | 'pie' | 'line' | 'histogram'): any {
    const analysis = this.columnAnalysisSubject.value.find(a => a.name === columnName);
    if (!analysis) return null;

    const colors = [
      'rgba(102, 126, 234, 0.8)',
      'rgba(118, 75, 162, 0.8)',
      'rgba(237, 100, 166, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(249, 115, 22, 0.8)'
    ];

    if (analysis.type === 'Text') {
      const valueCounts: { [key: string]: number } = {};
      analysis.values.forEach(v => {
        const key = String(v);
        valueCounts[key] = (valueCounts[key] || 0) + 1;
      });

      const sorted = Object.entries(valueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      return {
        labels: sorted.map(([key]) => key.length > 15 ? key.substring(0, 15) + '...' : key),
        data: sorted.map(([, value]) => value),
        colors: colors.slice(0, sorted.length)
      };
    } else if (analysis.type === 'Numeric') {
      const values = analysis.values as number[];
      const min = Math.min(...values);
      const max = Math.max(...values);
      const binCount = 10;
      const binSize = (max - min) / binCount || 1;

      const bins: { label: string; count: number }[] = [];
      for (let i = 0; i < binCount; i++) {
        const binStart = min + i * binSize;
        const binEnd = binStart + binSize;
        const count = values.filter(v => v >= binStart && (i === binCount - 1 ? v <= binEnd : v < binEnd)).length;
        bins.push({
          label: `${Math.round(binStart)}-${Math.round(binEnd)}`,
          count
        });
      }

      return {
        labels: bins.map(b => b.label),
        data: bins.map(b => b.count),
        colors: colors
      };
    }

    return null;
  }

  clearData(): void {
    this.fileDataSubject.next(null);
    this.columnAnalysisSubject.next([]);
    this.dataSummarySubject.next(null);
    this.keyInsightsSubject.next([]);
  }

  // Recent files tracking methods
  addUploadedFile(file: { name: string; size: number }) {
    const currentFiles = this.recentUploadedFilesSubject.value;
    const newFile: RecentFile = {
      name: file.name,
      date: new Date().toLocaleDateString(),
      size: this.formatFileSize(file.size),
      type: 'uploaded'
    };
    // Add to beginning, keep max 5 files
    const updatedFiles = [newFile, ...currentFiles.filter(f => f.name !== file.name)].slice(0, 5);
    this.recentUploadedFilesSubject.next(updatedFiles);
  }

  addDownloadedFile(filename: string) {
    const currentFiles = this.recentDownloadedFilesSubject.value;
    const newFile: RecentFile = {
      name: filename,
      date: new Date().toLocaleDateString(),
      size: 'PDF',
      type: 'downloaded'
    };
    // Add to beginning, keep max 5 files
    const updatedFiles = [newFile, ...currentFiles.filter(f => f.name !== filename)].slice(0, 5);
    this.recentDownloadedFilesSubject.next(updatedFiles);
  }

  getRecentUploadedFiles(): RecentFile[] {
    return this.recentUploadedFilesSubject.value;
  }

  getRecentDownloadedFiles(): RecentFile[] {
    return this.recentDownloadedFilesSubject.value;
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
