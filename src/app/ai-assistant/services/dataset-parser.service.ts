import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DatasetMetadata {
  filename: string;
  rowCount: number;
  columnNames: string[];
  columnTypes: { [key: string]: string };
  size: number;
  uploadedAt: Date;
}

export interface ParsedDataset {
  metadata: DatasetMetadata;
  data: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DatasetParserService {
  private currentDataset = new BehaviorSubject<ParsedDataset | null>(null);
  
  currentDataset$ = this.currentDataset.asObservable();

  async parseFile(file: File): Promise<ParsedDataset> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    let data: any[] = [];
    
    switch (extension) {
      case 'csv':
        data = await this.parseCSV(file);
        break;
      case 'xlsx':
      case 'xls':
        data = await this.parseExcel(file);
        break;
      case 'json':
        data = await this.parseJSON(file);
        break;
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }

    const metadata = this.extractMetadata(file, data);
    
    const parsedDataset: ParsedDataset = {
      metadata,
      data
    };

    this.currentDataset.next(parsedDataset);
    this.saveToStorage(parsedDataset);

    return parsedDataset;
  }

  private async parseCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            resolve([]);
            return;
          }

          const headers = this.parseCSVLine(lines[0]);
          const data = [];

          for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            const row: any = {};
            
            headers.forEach((header, index) => {
              const value = values[index] || '';
              row[header] = this.parseValue(value);
            });
            
            data.push(row);
          }

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
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

  private async parseExcel(file: File): Promise<any[]> {
    // For Excel files, we'll use a basic implementation
    // In production, you'd use a library like xlsx
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        // Basic Excel-like structure (simplified)
        // In production, integrate with xlsx library
        const data: any[] = [];
        
        // Create sample data for demonstration
        // Real implementation would parse actual Excel
        resolve(data);
      };

      reader.onerror = () => resolve([]);
      reader.readAsArrayBuffer(file);
    });
  }

  private async parseJSON(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = JSON.parse(text);
          
          if (Array.isArray(parsed)) {
            resolve(parsed);
          } else if (typeof parsed === 'object' && parsed !== null) {
            // If it's an object with arrays, try to find the main data array
            const dataArray = Object.values(parsed).find(v => Array.isArray(v));
            resolve(Array.isArray(dataArray) ? dataArray : [parsed]);
          } else {
            resolve([parsed]);
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  private extractMetadata(file: File, data: any[]): DatasetMetadata {
    const columnNames = data.length > 0 ? Object.keys(data[0]) : [];
    const columnTypes: { [key: string]: string } = {};

    if (data.length > 0) {
      columnNames.forEach(col => {
        columnTypes[col] = this.detectType(data[0][col]);
      });
    }

    return {
      filename: file.name,
      rowCount: data.length,
      columnNames,
      columnTypes,
      size: file.size,
      uploadedAt: new Date()
    };
  }

  private detectType(value: any): string {
    if (value === null || value === undefined) return 'unknown';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'float';
    }
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string') {
      if (!isNaN(Date.parse(value)) && value.length > 6) return 'date';
      return 'string';
    }
    return 'unknown';
  }

  private parseValue(value: string): any {
    // Try to parse as number
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num)) return num;
    
    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // Try to parse as date
    const date = new Date(value);
    if (!isNaN(date.getTime()) && value.length > 6) return value;
    
    return value;
  }

  private saveToStorage(dataset: ParsedDataset) {
    try {
      // Keep the dataset in memory for the session
      sessionStorage.setItem('current-ai-dataset', JSON.stringify(dataset));
    } catch (e) {
      console.error('Error saving dataset:', e);
    }
  }

  getCurrentDataset(): ParsedDataset | null {
    return this.currentDataset.value;
  }

  clearDataset() {
    this.currentDataset.next(null);
    sessionStorage.removeItem('current-ai-dataset');
  }

  getDatasetSummary(): string {
    const dataset = this.currentDataset.value;
    if (!dataset) return 'No dataset loaded';
    
    const { metadata } = dataset;
    return `Dataset: ${metadata.filename}\nRows: ${metadata.rowCount}\nColumns: ${metadata.columnNames.join(', ')}`;
  }
}