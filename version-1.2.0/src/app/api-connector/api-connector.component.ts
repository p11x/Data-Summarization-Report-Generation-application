import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  ApiConnectorService, 
  ApiDataSource, 
  ApiConnectionResult,
  PublicDataset 
} from '../services/api-connector.service';
import { DataAnalysisService } from '../services/data-analysis.service';

@Component({
  selector: 'app-api-connector',
  templateUrl: './api-connector.component.html',
  styleUrls: ['./api-connector.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ApiConnectorComponent implements OnInit {
  // View state
  activeTab: 'connect' | 'datasets' | 'saved' | 'history' = 'connect';
  isLoading: boolean = false;
  showPreview: boolean = false;
  showSaveModal: boolean = false;
  
  // Connection form
  connectionForm: Partial<ApiDataSource> = {
    name: '',
    url: '',
    method: 'GET',
    headers: [{ key: '', value: '' }],
    params: [{ key: '', value: '' }],
    authType: 'bearer',
    authToken: '',
    category: 'rest',
    description: ''
  };
  
  // Preview data
  previewResult: ApiConnectionResult | null = null;
  previewDataJson: string = '';
  
  // Saved data sources
  savedSources: ApiDataSource[] = [];
  
  // Public datasets
  publicDatasets: PublicDataset[] = [];
  datasetCategory: string = 'all';
  selectedDataset: PublicDataset | null = null;
  
  // Connection history
  connectionHistory: ApiConnectionResult[] = [];
  
  // Categories
  categories = [
    { value: 'rest', label: 'REST API' },
    { value: 'weather', label: 'Weather' },
    { value: 'finance', label: 'Finance' },
    { value: 'covid', label: 'COVID-19' },
    { value: 'custom', label: 'Custom' }
  ];
  
  authTypes = [
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'api-key', label: 'API Key' },
    { value: 'basic', label: 'Basic Auth' }
  ];
  
  datasetCategories = [
    { value: 'all', label: 'All Datasets' },
    { value: 'weather', label: 'Weather' },
    { value: 'finance', label: 'Finance' },
    { value: 'covid', label: 'COVID-19' },
    { value: 'government', label: 'Government' },
    { value: 'social', label: 'Social' }
  ];

  constructor(
    private apiConnectorService: ApiConnectorService,
    private dataAnalysisService: DataAnalysisService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSavedSources();
    this.loadPublicDatasets();
    this.loadConnectionHistory();
  }

  // Tab navigation
  setActiveTab(tab: 'connect' | 'datasets' | 'saved' | 'history') {
    this.activeTab = tab;
    this.resetPreview();
  }

  // Connection methods
  testConnection() {
    if (!this.connectionForm.url) return;
    
    this.isLoading = true;
    this.resetPreview();
    
    this.apiConnectorService.testConnection(this.connectionForm).subscribe(result => {
      this.previewResult = result;
      this.showPreview = true;
      this.isLoading = false;
      
      if (result.success && result.data) {
        this.previewDataJson = JSON.stringify(result.data, null, 2);
      }
    });
  }

  resetPreview() {
    this.previewResult = null;
    this.previewDataJson = '';
    this.showPreview = false;
  }

  // Header management
  addHeader() {
    if (!this.connectionForm.headers) {
      this.connectionForm.headers = [];
    }
    this.connectionForm.headers.push({ key: '', value: '' });
  }

  removeHeader(index: number) {
    if (this.connectionForm.headers && this.connectionForm.headers.length > 1) {
      this.connectionForm.headers.splice(index, 1);
    }
  }

  // Parameter management
  addParam() {
    if (!this.connectionForm.params) {
      this.connectionForm.params = [];
    }
    this.connectionForm.params.push({ key: '', value: '' });
  }

  removeParam(index: number) {
    if (this.connectionForm.params && this.connectionForm.params.length > 1) {
      this.connectionForm.params.splice(index, 1);
    }
  }

  // Save data source
  openSaveModal() {
    if (!this.connectionForm.url) return;
    this.showSaveModal = true;
  }

  closeSaveModal() {
    this.showSaveModal = false;
  }

  saveDataSource() {
    this.apiConnectorService.saveDataSource(this.connectionForm).subscribe(source => {
      this.closeSaveModal();
      this.loadSavedSources();
      this.resetForm();
    });
  }

  // Load saved sources
  loadSavedSources() {
    this.apiConnectorService.dataSources$.subscribe(sources => {
      this.savedSources = sources;
    });
  }

  // Load public datasets
  loadPublicDatasets() {
    this.publicDatasets = this.apiConnectorService.getPublicDatasetsByCategory(this.datasetCategory);
  }

  onCategoryChange() {
    this.loadPublicDatasets();
  }

  selectDataset(dataset: PublicDataset) {
    this.selectedDataset = dataset;
    this.connectionForm = {
      ...this.connectionForm,
      name: dataset.name,
      url: dataset.url,
      category: dataset.category as any,
      description: dataset.description
    };
    this.activeTab = 'connect';
  }

  // Load connection history
  loadConnectionHistory() {
    this.apiConnectorService.connectionHistory$.subscribe(history => {
      this.connectionHistory = history;
    });
  }

  // Fetch from saved source
  fetchFromSource(source: ApiDataSource) {
    this.isLoading = true;
    this.apiConnectorService.fetchFromSource(source.id).subscribe(result => {
      this.previewResult = result;
      this.showPreview = true;
      this.isLoading = false;
      
      if (result.success && result.data) {
        this.previewDataJson = JSON.stringify(result.data, null, 2);
      }
    });
  }

  // Delete saved source
  deleteSource(id: string) {
    this.apiConnectorService.deleteDataSource(id);
  }

  // Use data for analysis
  useDataForAnalysis() {
    if (!this.previewResult?.success || !this.previewResult.data) return;
    
    // Convert to CSV and process
    const csv = this.apiConnectorService.convertToCSV(this.previewResult.data);
    
    if (csv) {
      // Store the data and navigate to report
      const fileData = {
        name: `${this.connectionForm.name || 'api-data'}.csv`,
        size: csv.length,
        type: 'text/csv',
        content: csv,
        parsedData: this.parseCSV(csv),
        headers: this.extractHeaders(csv),
        uploadDate: new Date(),
        processingTime: this.previewResult.responseTime || 0
      };
      
      // Navigate to report page
      this.router.navigate(['/report']);
    }
  }

  // Export as CSV
  exportAsCSV() {
    if (!this.previewResult?.data) return;
    
    const csv = this.apiConnectorService.convertToCSV(this.previewResult.data);
    if (!csv) return;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.connectionForm.name || 'api-data'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Reset form
  resetForm() {
    this.connectionForm = {
      name: '',
      url: '',
      method: 'GET',
      headers: [{ key: '', value: '' }],
      params: [{ key: '', value: '' }],
      authType: 'bearer',
      authToken: '',
      category: 'rest',
      description: ''
    };
    this.resetPreview();
  }

  // Navigation
  goBack() {
    this.router.navigate(['/home']);
  }

  // Clipboard
  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    });
  }

  // Helper methods
  getStatusClass(success: boolean | undefined): string {
    return success ? 'status-success' : 'status-error';
  }

  formatResponseTime(ms: number | undefined): string {
    if (!ms) return '-';
    return `${ms}ms`;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  }

  getDatasetIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'weather': 'Weather',
      'finance': 'Finance',
      'covid': 'COVID',
      'government': 'Gov',
      'social': 'Social',
      'rest': 'API',
      'custom': 'Custom'
    };
    return icons[category] || 'API';
  }

  private parseCSV(csv: string): any[] {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
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

  private extractHeaders(csv: string): string[] {
    const firstLine = csv.split('\n')[0];
    return firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
  }
}
