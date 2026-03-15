import { Injectable } from '@angular/core';
import { Observable, of, catchError, map } from 'rxjs';

export interface ParsedDataset {
  data: any[];
  headers: string[];
  rowCount: number;
  columnCount: number;
  format: string;
  parseTime: number;
  errors?: string[];
}

export interface ParseOptions {
  delimiter?: string;
  hasHeader?: boolean;
  skipEmptyRows?: boolean;
  maxRows?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DatasetParserService {
  
  // Supported formats
  readonly SUPPORTED_FORMATS = ['csv', 'json', 'tsv'];
  
  // Default delimiters
  private readonly DELIMITERS = {
    csv: ',',
    tsv: '\t',
    json: ''
  };

  constructor() {}

  /**
   * Parse a dataset based on its format
   */
  parse(content: string, format: string, options?: ParseOptions): Observable<ParsedDataset> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    const normalizedFormat = format.toLowerCase().replace('.', '');
    
    try {
      switch (normalizedFormat) {
        case 'csv':
        case 'tsv':
        case 'txt':
          return this.parseDelimited(content, normalizedFormat === 'tsv' ? '\t' : (options?.delimiter || ','), options);
        
        case 'json':
          return this.parseJSON(content, options);
        
        default:
          // Try CSV as fallback
          return this.parseDelimited(content, ',', options);
      }
    } catch (error) {
      return of({
        data: [],
        headers: [],
        rowCount: 0,
        columnCount: 0,
        format: normalizedFormat,
        parseTime: Date.now() - startTime,
        errors: [`Parse error: ${error}`]
      });
    }
  }

  /**
   * Parse CSV/TSV content
   */
  parseDelimited(content: string, delimiter: string = ',', options?: ParseOptions): Observable<ParsedDataset> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    const hasHeader = options?.hasHeader !== false;
    const skipEmptyRows = options?.skipEmptyRows !== false;
    const maxRows = options?.maxRows;
    
    const lines = content.split(/\r?\n/);
    
    // Filter empty lines
    const nonEmptyLines = skipEmptyRows ? lines.filter(line => line.trim()) : lines;
    
    if (nonEmptyLines.length === 0) {
      return of({
        data: [],
        headers: [],
        rowCount: 0,
        columnCount: 0,
        format: delimiter === '\t' ? 'tsv' : 'csv',
        parseTime: Date.now() - startTime,
        errors: ['No data found in file']
      });
    }
    
    // Parse header
    let headers: string[];
    let dataStartIndex = 0;
    
    if (hasHeader) {
      headers = this.parseCSVLine(nonEmptyLines[0], delimiter);
      dataStartIndex = 1;
    } else {
      // Generate column names
      const firstRow = this.parseCSVLine(nonEmptyLines[0], delimiter);
      headers = firstRow.map((_, i) => `Column_${i + 1}`);
    }
    
    // Parse data rows
    const data: any[] = [];
    let rowCount = 0;
    
    for (let i = dataStartIndex; i < nonEmptyLines.length; i++) {
      if (maxRows && rowCount >= maxRows) break;
      
      const values = this.parseCSVLine(nonEmptyLines[i], delimiter);
      
      // Skip rows with different column counts
      if (values.length !== headers.length) {
        if (values.length > 0) {
          errors.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
        }
        continue;
      }
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = this.parseValue(values[index]);
      });
      
      data.push(row);
      rowCount++;
    }
    
    return of({
      data,
      headers,
      rowCount,
      columnCount: headers.length,
      format: delimiter === '\t' ? 'tsv' : 'csv',
      parseTime: Date.now() - startTime,
      errors: errors.length > 0 ? errors : undefined
    });
  }

  /**
   * Parse JSON content
   */
  parseJSON(content: string, options?: ParseOptions): Observable<ParsedDataset> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    const maxRows = options?.maxRows;
    
    try {
      const json = JSON.parse(content);
      
      // Handle different JSON structures
      let dataArray: any[] = [];
      
      if (Array.isArray(json)) {
        dataArray = json;
      } else if (typeof json === 'object' && json !== null) {
        // Try to find an array in the object
        const possibleArrayKeys = ['data', 'results', 'records', 'items', 'rows', 'datasets'];
        let foundArray = false;
        
        for (const key of possibleArrayKeys) {
          if (Array.isArray(json[key])) {
            dataArray = json[key];
            foundArray = true;
            break;
          }
        }
        
        if (!foundArray) {
          // Single object, wrap in array
          dataArray = [json];
        }
      } else {
        return of({
          data: [],
          headers: [],
          rowCount: 0,
          columnCount: 0,
          format: 'json',
          parseTime: Date.now() - startTime,
          errors: ['Invalid JSON format']
        });
      }
      
      // Limit rows if needed
      if (maxRows) {
        dataArray = dataArray.slice(0, maxRows);
      }
      
      // Extract headers from first object
      const headers = dataArray.length > 0 ? Object.keys(dataArray[0]) : [];
      
      // Ensure all rows have the same columns
      const data = dataArray.map((item, index) => {
        const row: any = {};
        headers.forEach(header => {
          row[header] = this.parseValue(item[header]);
        });
        return row;
      });
      
      return of({
        data,
        headers,
        rowCount: data.length,
        columnCount: headers.length,
        format: 'json',
        parseTime: Date.now() - startTime,
        errors: errors.length > 0 ? errors : undefined
      });
      
    } catch (error) {
      return of({
        data: [],
        headers: [],
        rowCount: 0,
        columnCount: 0,
        format: 'json',
        parseTime: Date.now() - startTime,
        errors: [`JSON parse error: ${error}`]
      });
    }
  }

  /**
   * Parse a single CSV/TSV line handling quoted values
   */
  private parseCSVLine(line: string, delimiter: string = ','): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        // Handle escaped quotes
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Parse a value to appropriate type
   */
  private parseValue(value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    // Try to parse as number
    if (typeof value === 'string') {
      const num = parseFloat(value);
      if (!isNaN(num) && isFinite(num)) {
        // Check if it's actually a number (not a version number, etc.)
        if (value.trim() === num.toString() || value.trim() === num.toExponential()) {
          return num;
        }
      }
      
      // Try to parse as boolean
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      
      // Try to parse as date
      const date = new Date(value);
      if (!isNaN(date.getTime()) && value.includes('-')) {
        return value; // Keep as string for dates
      }
    }
    
    return value;
  }

  /**
   * Detect delimiter from content
   */
  detectDelimiter(content: string): string {
    const firstLine = content.split('\n')[0];
    
    const delimiters = [',', '\t', ';', '|'];
    const counts = delimiters.map(d => ({
      delimiter: d,
      count: (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length
    }));
    
    const best = counts.reduce((prev, curr) => 
      curr.count > prev.count ? curr : prev
    );
    
    return best.count > 0 ? best.delimiter : ',';
  }

  /**
   * Validate parsed dataset
   */
  validateDataset(parsed: ParsedDataset): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (parsed.rowCount === 0) {
      errors.push('Dataset is empty');
    }
    
    if (parsed.columnCount === 0) {
      errors.push('No columns found');
    }
    
    if (parsed.headers.length === 0) {
      errors.push('No headers found');
    }
    
    // Check for common data quality issues
    const nullCounts = parsed.data.slice(0, 100).map(row => 
      Object.values(row).filter(v => v === null || v === undefined || v === '').length
    );
    
    const avgNulls = nullCounts.reduce((a, b) => a + b, 0) / nullCounts.length;
    const totalCells = parsed.columnCount * 100;
    
    if (avgNulls / totalCells > 0.5) {
      errors.push('High number of null values detected (>50%)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Helper function for filtering empty lines
function skipEmptyLines(line: string): boolean {
  return line.trim().length > 0;
}
