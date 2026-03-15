import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataAnalysisService } from '../services/data-analysis.service';

interface DataStats {
  originalRows: number;
  originalColumns: number;
  currentRows: number;
  currentColumns: number;
  duplicatesRemoved: number;
  emptyRowsRemoved: number;
  columnsRemoved: number;
}

@Component({
  selector: 'app-compressor',
  templateUrl: './compressor.component.html',
  styleUrls: ['./compressor.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class CompressorComponent implements OnInit {
  // File state
  selectedFile: File | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Data
  originalData: any[] = [];
  processedData: any[] = [];
  columns: string[] = [];
  hasData: boolean = false;
  
  // Selection states
  selectedColumns: string[] = [];
  selectAll: boolean = false;
  
  // Stats
  stats: DataStats = {
    originalRows: 0,
    originalColumns: 0,
    currentRows: 0,
    currentColumns: 0,
    duplicatesRemoved: 0,
    emptyRowsRemoved: 0,
    columnsRemoved: 0
  };
  
  // Cleaning options
  options = {
    removeDuplicates: true,
    removeEmptyRows: true,
    removeSelectedColumns: false
  };
  
  // UI
  showPreview: boolean = false;
  currentPage: number = 1;
  pageSize: number = 15;

  constructor(
    private router: Router,
    private dataAnalysisService: DataAnalysisService
  ) {}

  ngOnInit() {}

  // File handling
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
      const validExtensions = ['.csv', '.txt'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        this.errorMessage = 'Please upload a CSV file';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
      this.errorMessage = '';
      this.loadFile();
    }
  }

  async loadFile() {
    if (!this.selectedFile) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      const content = await this.readFileContent(this.selectedFile);
      const { parsedData, headers } = this.parseCSV(content);
      
      this.originalData = parsedData;
      this.processedData = [...parsedData];
      this.columns = headers;
      this.selectedColumns = [...headers];
      
      // Calculate initial stats
      this.stats = {
        originalRows: parsedData.length,
        originalColumns: headers.length,
        currentRows: parsedData.length,
        currentColumns: headers.length,
        duplicatesRemoved: 0,
        emptyRowsRemoved: 0,
        columnsRemoved: 0
      };
      
      this.hasData = true;
      this.showPreview = true;
    } catch (error) {
      this.errorMessage = 'Error reading file. Please ensure it is a valid CSV.';
      console.error(error);
    } finally {
      this.isLoading = false;
    }
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

  // Column selection
  toggleColumn(column: string) {
    const index = this.selectedColumns.indexOf(column);
    if (index === -1) {
      this.selectedColumns.push(column);
    } else {
      this.selectedColumns.splice(index, 1);
    }
  }

  isColumnSelected(column: string): boolean {
    return this.selectedColumns.includes(column);
  }

  toggleSelectAll() {
    if (this.selectAll) {
      this.selectedColumns = [...this.columns];
    } else {
      this.selectedColumns = [];
    }
  }

  // Apply compression
  applyCompression() {
    this.isLoading = true;
    
    setTimeout(() => {
      let result = [...this.originalData];
      
      // Remove duplicates
      if (this.options.removeDuplicates) {
        const beforeCount = result.length;
        result = this.removeDuplicates(result);
        this.stats.duplicatesRemoved = beforeCount - result.length;
      }
      
      // Remove empty rows
      if (this.options.removeEmptyRows) {
        const beforeCount = result.length;
        result = this.removeEmptyRows(result);
        this.stats.emptyRowsRemoved = beforeCount - result.length;
      }
      
      // Remove selected columns
      if (this.options.removeSelectedColumns && this.selectedColumns.length < this.columns.length) {
        result = this.removeColumns(result, this.selectedColumns);
        this.stats.columnsRemoved = this.columns.length - this.selectedColumns.length;
      }
      
      this.processedData = result;
      this.stats.currentRows = result.length;
      this.stats.currentColumns = result.length > 0 ? Object.keys(result[0]).length : 0;
      
      this.isLoading = false;
    }, 300);
  }

  private removeDuplicates(data: any[]): any[] {
    const seen = new Set<string>();
    return data.filter(row => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private removeEmptyRows(data: any[]): any[] {
    return data.filter(row => {
      return Object.values(row).some(v => v !== null && v !== undefined && v !== '');
    });
  }

  private removeColumns(data: any[], columnsToKeep: string[]): any[] {
    return data.map(row => {
      const newRow: any = {};
      columnsToKeep.forEach(col => {
        newRow[col] = row[col];
      });
      return newRow;
    });
  }

  // Reset
  reset() {
    this.selectedFile = null;
    this.originalData = [];
    this.processedData = [];
    this.columns = [];
    this.selectedColumns = [];
    this.hasData = false;
    this.showPreview = false;
    this.stats = {
      originalRows: 0,
      originalColumns: 0,
      currentRows: 0,
      currentColumns: 0,
      duplicatesRemoved: 0,
      emptyRowsRemoved: 0,
      columnsRemoved: 0
    };
    this.options = {
      removeDuplicates: true,
      removeEmptyRows: true,
      removeSelectedColumns: false
    };
  }

  // Download
  downloadCompressed() {
    if (this.processedData.length === 0) return;
    
    const headers = Object.keys(this.processedData[0]);
    const csvContent = [
      headers.join(','),
      ...this.processedData.map(row => 
        headers.map(h => {
          const val = row[h] || '';
          return val.includes(',') || val.includes('"') ? `"${val}"` : val;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${this.selectedFile?.name || 'data.csv'}`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Pagination
  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.processedData.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.processedData.length / this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  // Navigation
  goBack() {
    this.router.navigate(['/home']);
  }
}
