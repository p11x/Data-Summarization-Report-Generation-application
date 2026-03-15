import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Dataset } from '../../../services/dataset-search.model';
import { DataAnalysisService } from '../../../services/data-analysis.service';
import { DatasetStorageService } from '../../../services/dataset-storage.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-search-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './search-report.component.html',
  styleUrls: ['./search-report.component.css']
})
export class SearchReportComponent implements OnInit {
  // Dataset info
  dataset: Dataset | null = null;
  datasetUrl: string = '';
  datasetTitle: string = '';

  // Report state
  loading: boolean = false;
  error: string | null = null;
  reportGenerated: boolean = false;

  // Analysis results
  analysisResults: any[] = [];
  visualizations: any[] = [];
  insights: string[] = [];

  // Export options
  exportFormat: string = 'pdf';

  // Unsupported dataset sources that don't provide direct CSV access
  private readonly UNSUPPORTED_SOURCES = [
    'kaggle.com',
    'drive.google.com',
    'dropbox.com',
    'docs.google.com'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataAnalysisService: DataAnalysisService,
    private datasetStorage: DatasetStorageService,
    private http: HttpClient,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Get dataset from query params
    this.route.queryParams.subscribe(params => {
      if (params['dataset']) {
        this.datasetUrl = params['dataset'];
        this.datasetTitle = params['title'] || 'Selected Dataset';
        
        // Try to get dataset from session storage
        const storedDataset = sessionStorage.getItem('selectedDataset');
        if (storedDataset) {
          try {
            this.dataset = JSON.parse(storedDataset);
          } catch (e) {
            console.error('Error parsing stored dataset:', e);
          }
        }
        
        // Automatically fetch and redirect to report page
        this.fetchDataset();
      } else {
        // No dataset selected, redirect back to search
        this.router.navigate(['/dataset-search-results']);
      }
    });
  }

  /**
   * Check if URL is from an unsupported source
   */
  private isUnsupportedSource(url: string): { unsupported: boolean; source: string } {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      for (const source of this.UNSUPPORTED_SOURCES) {
        if (hostname.includes(source)) {
          return { unsupported: true, source: source };
        }
      }
      
      return { unsupported: false, source: '' };
    } catch {
      return { unsupported: true, source: 'unknown' };
    }
  }

  /**
   * Convert GitHub blob URLs to raw.githubusercontent.com URLs
   * Example: github.com/user/repo/blob/main/data.csv -> raw.githubusercontent.com/user/repo/main/data.csv
   */
  private convertGitHubBlobToRaw(url: string): string {
    try {
      // Check if it's a GitHub blob URL
      const githubBlobPattern = /github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\s\/]+)\/(.+)/;
      const match = url.match(githubBlobPattern);
      
      if (match) {
        const [, owner, repo, branch, filePath] = match;
        // Convert to raw URL
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
        console.log('[SearchReport] Converted GitHub blob URL to raw:', rawUrl);
        return rawUrl;
      }
      
      // Also handle github.com/user/repo/file.csv format (direct file links)
      const githubDirectPattern = /github\.com\/([^\/]+)\/([^\/]+\.csv)/;
      const directMatch = url.match(githubDirectPattern);
      
      if (directMatch) {
        // Try to convert to raw URL
        const rawUrl = url.replace('github.com', 'raw.githubusercontent.com');
        console.log('[SearchReport] Converted GitHub direct URL to raw:', rawUrl);
        return rawUrl;
      }
      
      return url;
    } catch {
      return url;
    }
  }

  /**
   * Fetch and process the dataset - then redirect to report page
   */
  async fetchDataset(): Promise<void> {
    if (!this.datasetUrl) return;

    this.loading = true;
    this.error = null;

    try {
      // Step 1: Check if URL is from unsupported source
      const unsupportedCheck = this.isUnsupportedSource(this.datasetUrl);
      if (unsupportedCheck.unsupported) {
        throw new Error(
          `Unsupported dataset source: ${unsupportedCheck.source}. ` +
          `Please use direct CSV file URLs from sources like GitHub Raw, UCI ML Repository, or OpenML. ` +
          `Websites like Kaggle, Google Drive, and Dropbox require authentication and cannot be accessed directly.`
        );
      }

      // Step 2: Convert GitHub blob URLs to raw URLs
      let processedUrl = this.convertGitHubBlobToRaw(this.datasetUrl);

      // Step 3: Validate URL format
      try {
        new URL(processedUrl);
      } catch {
        throw new Error('Invalid URL format. Please provide a valid dataset URL.');
      }

      // Step 4: Fetch the CSV data with content-type validation
      console.log('[SearchReport] Fetching from URL:', processedUrl);
      
      // Use observe: 'response' to get headers and validate content-type
      const response = await this.http.get(processedUrl, { 
        observe: 'response',
        responseType: 'text'
      }).toPromise();

      if (!response || !response.body) {
        throw new Error('No data received from URL');
      }

      // Step 5: Validate content-type is text/csv or similar
      const contentType = response.headers.get('content-type') || '';
      const isCSV = contentType.includes('text/csv') || 
                    contentType.includes('text/plain') || 
                    contentType.includes('application/vnd.ms-excel');
      
      if (!isCSV && contentType.includes('text/html')) {
        throw new Error(
          'The URL returned HTML instead of CSV. This usually means the URL points to a webpage '
          + '(like a dataset listing page) rather than a direct CSV file. Please provide a direct '
          + 'CSV file URL from supported sources.'
        );
      }

      if (!isCSV) {
        console.warn('[SearchReport] Content-Type warning:', contentType);
      }

      const csvData = response.body;

      // Check if the response looks like HTML (error page)
      if (csvData.trim().startsWith('<!DOCTYPE') || csvData.trim().startsWith('<html')) {
        throw new Error(
          'The URL returned an HTML page instead of CSV data. Please ensure you are using '
          + 'a direct CSV file URL (not a dataset listing page).'
        );
      }
      
      // Parse CSV
      const { parsedData, headers } = this.parseCSV(csvData);
      
      if (parsedData.length === 0 || headers.length === 0) {
        throw new Error(
          'Could not parse CSV data from the URL. The file may be empty or in an unsupported format.'
        );
      }
      
      console.log('[SearchReport] Parsed dataset:', { rows: parsedData.length, columns: headers.length });
      
      // Store in shared storage
      this.datasetStorage.setDatasetFromSearch(
        this.datasetTitle || 'Searched Dataset',
        parsedData,
        headers,
        processedUrl
      );
      
      // Also process through data analysis service for full analysis
      await this.runAnalysis(parsedData, headers);
      
      // Redirect to report page
      this.ngZone.run(() => {
        this.router.navigate(['/report'], {
          queryParams: {
            dataset: processedUrl,
            name: this.datasetTitle,
            rows: parsedData.length,
            source: 'search'
          }
        });
      });
      
    } catch (err: any) {
      this.error = err.message || 'Failed to fetch and analyze dataset. Please try again.';
      console.error('Error fetching dataset:', err);
      this.loading = false;
    }
  }

  /**
   * Parse CSV string to array of objects
   */
  private parseCSV(content: string): { parsedData: any[], headers: string[] } {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { parsedData: [], headers: [] };
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
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

  /**
   * Parse a single CSV line handling quoted values
   */
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

  /**
   * Run analysis on the dataset
   */
  private async runAnalysis(parsedData: any[], headers: string[]): Promise<void> {
    // Set file data in data analysis service
    const fileData = {
      name: this.datasetTitle || 'Searched Dataset',
      size: 0,
      type: 'text/csv',
      content: '',
      parsedData,
      headers,
      uploadDate: new Date(),
      processingTime: 0
    };
    
    this.dataAnalysisService.setFileData(fileData);
    
    // Manually trigger analysis
    this.dataAnalysisService['analyzeData'](parsedData, headers);
    
    // Update report config
    this.dataAnalysisService.setReportConfig({
      title: `Analysis Report - ${this.datasetTitle}`,
      description: `Automated analysis of ${this.datasetTitle} containing ${parsedData.length} records and ${headers.length} columns.`,
      generatedBy: 'Data Analysis System v1.0',
      reportId: 'RPT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase()
    });
    
    console.log('[SearchReport] Analysis complete');
  }

  /**
   * Export report
   */
  exportReport(): void {
    // In a real implementation, this would generate the actual report
    // For demo, we'll show an alert
    alert(`Exporting report in ${this.exportFormat.toUpperCase()} format...`);
    
    // Navigate to download or show download options
    this.router.navigate(['/download']);
  }

  /**
   * Regenerate analysis
   */
  regenerateAnalysis(): void {
    this.reportGenerated = false;
    this.fetchDataset();
  }

  /**
   * Go back to search
   */
  goToSearch(): void {
    this.router.navigate(['/dataset-search-results']);
  }

  /**
   * Go to home
   */
  goToHome(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Format number with commas
   */
  formatNumber(num: number | string): string {
    if (typeof num === 'string') return num;
    return num.toLocaleString();
  }
}
