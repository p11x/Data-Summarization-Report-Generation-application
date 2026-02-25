import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  WebsiteConnectorService, 
  WebsiteFetchResult, 
  ParsedTable,
  WebsiteSource 
} from '../services/website-connector.service';
import { DataAnalysisService } from '../services/data-analysis.service';

@Component({
  selector: 'app-website-connector',
  templateUrl: './website-connector.component.html',
  styleUrls: ['./website-connector.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class WebsiteConnectorComponent implements OnInit {
  // State
  activeTab: 'fetch' | 'saved' = 'fetch';
  isLoading: boolean = false;
  showPreview: boolean = false;
  showSaveModal: boolean = false;
  
  // Form
  websiteUrl: string = '';
  websiteName: string = '';
  
  // Results
  fetchResult: WebsiteFetchResult | null = null;
  selectedTableIndex: number = 0;
  
  // Saved websites
  savedWebsites: WebsiteSource[] = [];
  
  // Analysis data
  analysisData: any[] = [];
  columnAnalysis: any[] = [];
  dataSummary: any = null;

  constructor(
    private websiteService: WebsiteConnectorService,
    private dataAnalysisService: DataAnalysisService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSavedWebsites();
  }

  // Tab navigation
  setActiveTab(tab: 'fetch' | 'saved') {
    this.activeTab = tab;
  }

  // Fetch website
  fetchWebsite() {
    if (!this.websiteUrl) return;
    
    this.isLoading = true;
    this.showPreview = false;
    this.fetchResult = null;
    
    this.websiteService.fetchWebsite(this.websiteUrl).subscribe(result => {
      // If fetch failed, generate sample data for demo
      if (!result.success) {
        this.fetchResult = this.websiteService.generateSampleData(this.websiteUrl);
      } else {
        this.fetchResult = result;
      }
      
      this.showPreview = true;
      this.isLoading = false;
      
      // Analyze the data if tables found
      if (this.fetchResult.tables && this.fetchResult.tables.length > 0) {
        this.analyzeData();
      }
    });
  }

  // Analyze fetched data
  analyzeData() {
    if (!this.fetchResult?.tables || this.fetchResult.tables.length === 0) return;
    
    const table = this.fetchResult.tables[this.selectedTableIndex];
    const csv = this.websiteService.tableToCSV(table);
    
    // Parse and analyze
    this.analysisData = this.parseCSV(csv);
    this.columnAnalysis = this.analyzeColumns(this.analysisData, table.headers);
    this.dataSummary = this.generateSummary(this.analysisData, this.columnAnalysis);
  }

  // Parse CSV data
  private parseCSV(csv: string): any[] {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = this.parseCSVLine(lines[0]);
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        data.push(row);
      }
    }
    
    return data;
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    return values;
  }

  // Analyze columns
  private analyzeColumns(data: any[], headers: string[]): any[] {
    return headers.map(header => {
      const values = data.map(row => row[header]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      const numericValues = nonNullValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
      
      const isNumeric = numericValues.length > nonNullValues.length * 0.5;
      
      if (isNumeric && numericValues.length > 0) {
        const sorted = [...numericValues].sort((a, b) => a - b);
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length;
        const stdDev = Math.sqrt(variance);
        
        return {
          name: header,
          type: 'Numeric',
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          mean,
          median,
          stdDev,
          nullCount: values.length - numericValues.length,
          nullPercentage: ((values.length - numericValues.length) / values.length) * 100,
          values: numericValues
        };
      } else {
        const valueCounts: { [key: string]: number } = {};
        nonNullValues.forEach(v => {
          const key = String(v);
          valueCounts[key] = (valueCounts[key] || 0) + 1;
        });
        
        const sorted = Object.entries(valueCounts).sort((a, b) => b[1] - a[1]);
        
        return {
          name: header,
          type: 'Text',
          unique: Object.keys(valueCounts).length,
          top: sorted[0]?.[0] || '',
          topFrequency: sorted[0]?.[1] || 0,
          nullCount: values.length - nonNullValues.length,
          nullPercentage: ((values.length - nonNullValues.length) / values.length) * 100,
          values: nonNullValues
        };
      }
    });
  }

  // Generate summary
  private generateSummary(data: any[], columns: any[]): any {
    return {
      totalRows: data.length,
      totalColumns: columns.length,
      numericColumns: columns.filter(c => c.type === 'Numeric').length,
      textColumns: columns.filter(c => c.type === 'Text').length,
      missingValues: columns.reduce((sum, c) => sum + c.nullCount, 0),
      missingPercentage: (columns.reduce((sum, c) => sum + c.nullCount, 0) / (data.length * columns.length)) * 100
    };
  }

  // Table selection
  selectTable(index: number) {
    this.selectedTableIndex = index;
    this.analyzeData();
  }

  // Load saved websites
  loadSavedWebsites() {
    this.websiteService.savedWebsites$.subscribe(websites => {
      this.savedWebsites = websites;
    });
  }

  // Save website
  openSaveModal() {
    this.websiteName = '';
    this.showSaveModal = true;
  }

  closeSaveModal() {
    this.showSaveModal = false;
  }

  saveWebsite() {
    this.websiteService.saveWebsiteSource({
      name: this.websiteName || 'Untitled Website',
      url: this.websiteUrl,
      data: this.fetchResult
    }).subscribe(() => {
      this.closeSaveModal();
      this.loadSavedWebsites();
    });
  }

  // Delete saved website
  deleteWebsite(id: string) {
    this.websiteService.deleteWebsiteSource(id);
  }

  // Load saved website
  loadSavedWebsite(website: WebsiteSource) {
    this.websiteUrl = website.url;
    if (website.data) {
      this.fetchResult = website.data;
      this.showPreview = true;
      const tables = this.fetchResult?.tables;
      if (tables && tables.length > 0) {
        this.analyzeData();
      }
    } else {
      this.fetchWebsite();
    }
    this.activeTab = 'fetch';
  }

  // Export as CSV
  exportAsCSV() {
    if (!this.fetchResult?.tables || this.fetchResult.tables.length === 0) return;
    
    const csv = this.websiteService.tableToCSV(this.fetchResult.tables[this.selectedTableIndex]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `website-data-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Use for analysis - navigate to report
  useForAnalysis() {
    if (!this.fetchResult?.tables || this.fetchResult.tables.length === 0) return;
    
    const csv = this.websiteService.tableToCSV(this.fetchResult.tables[this.selectedTableIndex]);
    
    // Navigate to report
    this.router.navigate(['/report']);
  }

  // Navigation
  goBack() {
    this.router.navigate(['/home']);
  }

  // Helper methods
  formatNumber(num: number | undefined): string {
    if (num === undefined) return '-';
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  // Safe getters for template
  get tables(): ParsedTable[] {
    return this.fetchResult?.tables || [];
  }

  get selectedTable(): ParsedTable | null {
    return this.tables[this.selectedTableIndex] || null;
  }

  get resultTitle(): string {
    return this.fetchResult?.title || '';
  }

  get resultMeta(): { [key: string]: string } {
    return this.fetchResult?.meta || {};
  }
}
