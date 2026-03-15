import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, forkJoin, of } from 'rxjs';
import { catchError, map, take, timeout, first } from 'rxjs/operators';
import { DatasetAggregatorService } from '../../../services/dataset-aggregator.service';
import { Dataset, DatasetSource, PaginationState } from '../../../services/dataset-search.model';
import { DatasetValidatorService } from '../../../services/dataset-validator.service';
import { DatasetFetchService } from '../../../services/dataset-fetch.service';
import { DatasetParserService, ParsedDataset } from '../../../services/dataset-parser.service';
import { DatasetStorageService } from '../../../services/dataset-storage.service';
import { DataAnalysisService } from '../../../services/data-analysis.service';

interface DatasetResult {
  dataset: Dataset;
  validated: boolean;
  processedUrl?: string;
  preview?: ParsedDataset;
  error?: string;
}

@Component({
  selector: 'app-dataset-search-results',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dataset-search-results.component.html',
  styleUrls: ['./dataset-search-results.component.css']
})
export class DatasetSearchResultsComponent implements OnInit, OnDestroy {
  // Search state
  searchQuery: string = '';
  results: DatasetResult[] = [];
  loading: boolean = false;
  error: string | null = null;
  
  // Loading states for skeleton UI
  loadingProviders: Set<string> = new Set();
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 12;
  pagination: PaginationState = {
    page: 1,
    pageSize: 12,
    totalItems: 0,
    totalPages: 0
  };

  // UI state
  showFilters: boolean = false;
  
  // Fallback state
  usingFallback: boolean = false;
  
  // Infinite scrolling
  hasMoreResults: boolean = false;
  allResults: DatasetResult[] = [];
  
  // Provider icons mapping
  providerIcons: Record<string, string> = {
    'github': '🐙',
    'datagov': '🇺🇸',
    'kaggle': '📊',
    'openml': '🔬',
    'uci': '🎓'
  };

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private aggregatorService: DatasetAggregatorService,
    private validator: DatasetValidatorService,
    private fetchService: DatasetFetchService,
    private parser: DatasetParserService,
    private datasetStorage: DatasetStorageService,
    private dataAnalysisService: DataAnalysisService
  ) {}

  ngOnInit(): void {
    // Get query parameter
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['q']) {
        this.searchQuery = params['q'];
        this.performSearch();
      }
    });

    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      if (query) {
        this.performSearch();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Perform unified search across all supported providers
   */
  performSearch(): void {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.results = [];
    this.currentPage = 1;

    // Update URL with query
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.searchQuery },
      queryParamsHandling: 'merge'
    });

    // Fetch from all providers in parallel
    this.fetchFromAllProviders();
  }

  /**
   * Fetch datasets from all supported providers
   */
  private fetchFromAllProviders(): void {
    this.loadingProviders = new Set(['github', 'datagov']);
    
    console.log('[DatasetSearch] Starting unified search for:', this.searchQuery);
    
    // Fetch from GitHub and Data.gov (supported providers)
    forkJoin({
      github: this.aggregatorService.getBySource(this.searchQuery, 'github', 30).pipe(
        catchError(err => {
          console.error('[DatasetSearch] GitHub API error:', err);
          return of([]);
        })
      ),
      datagov: this.aggregatorService.getBySource(this.searchQuery, 'datagov', 30).pipe(
        catchError(err => {
          console.error('[DatasetSearch] Data.gov API error:', err);
          return of([]);
        })
      )
    }).subscribe({
      next: (results) => {
        this.loadingProviders.clear();
        
        console.log('[DatasetSearch] Raw results:', results);
        console.log('[DatasetSearch] GitHub results count:', (results.github || []).length);
        console.log('[DatasetSearch] Data.gov results count:', (results.datagov || []).length);
        
        // Combine and filter results
        const allDatasets: Dataset[] = [
          ...(results.github || []),
          ...(results.datagov || [])
        ];
        
        console.log('[DatasetSearch] Combined datasets count:', allDatasets.length);
        
        // Process and validate each dataset
        this.processAndValidateDatasets(allDatasets);
      },
      error: (err) => {
        this.loadingProviders.clear();
        console.error('[DatasetSearch] ForkJoin error:', err);
        this.error = 'Failed to search datasets. Please try again.';
        this.loading = false;
      }
    });
  }

  /**
   * Process and validate datasets
   */
  private processAndValidateDatasets(datasets: Dataset[]): void {
    console.log('[DatasetSearch] Processing datasets:', datasets?.length || 0);
    
    // Ensure datasets is an array
    datasets = datasets || [];
    
    // If no datasets, load fallback datasets
    if (datasets.length === 0) {
      console.log('[DatasetSearch] No datasets found from providers, loading fallback datasets');
      this.usingFallback = true;
      this.aggregatorService.getFallbackDatasets(this.searchQuery, 8).subscribe(fallbackDatasets => {
        console.log('[DatasetSearch] Fallback datasets loaded:', fallbackDatasets.length);
        this.processFallbackDatasets(fallbackDatasets);
      });
      return;
    }
    
    this.usingFallback = false;
    this.processFallbackDatasets(datasets);
  }

  /**
   * Process fallback datasets (without validation)
   */
  private processFallbackDatasets(datasets: Dataset[]): void {
    // Filter out blocked providers
    const validResults: DatasetResult[] = [];
    
    for (const dataset of datasets) {
      // Skip if source is blocked
      if (dataset.source === 'kaggle' || dataset.source === 'google') {
        console.log('[DatasetSearch] Skipping blocked source:', dataset.source);
        continue;
      }
      
      // Get the URL
      const url = dataset.downloadUrl || dataset.datasetUrl;
      
      // For fallback datasets, assume valid
      validResults.push({
        dataset,
        validated: true,
        processedUrl: url
      });
    }
    
    console.log('[DatasetSearch] Results after processing:', validResults.length);
    
    // Sort by relevance
    const sortedResults = this.validator.sortByRelevance(validResults.map(r => ({
      ...r.dataset,
      _processedUrl: r.processedUrl
    })), this.searchQuery).map((dataset: any) => ({
      dataset,
      validated: true,
      processedUrl: dataset._processedUrl
    }));
    
    this.results = sortedResults;
    console.log('[DatasetSearch] Final results to display:', this.results.length);
    this.updatePagination();
    this.loading = false;
  }

  /**
   * Update pagination state
   */
  private updatePagination(): void {
    const totalItems = this.results.length;
    const totalPages = Math.ceil(totalItems / this.pageSize);
    
    this.pagination = {
      page: this.currentPage,
      pageSize: this.pageSize,
      totalItems,
      totalPages
    };
    
    // Set hasMoreResults for infinite scrolling
    this.hasMoreResults = this.currentPage < totalPages;
  }

  /**
   * Handle search input
   */
  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  /**
   * Get paginated results
   */
  get paginatedResults(): DatasetResult[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.results.slice(start, start + this.pageSize);
  }

  /**
   * Load more results for infinite scrolling
   */
  loadMoreResults(): void {
    if (this.hasMoreResults && !this.loading) {
      this.currentPage++;
      this.updatePagination();
      // Scroll to the first new result
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }

  /**
   * Get page numbers for pagination display
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.pagination.totalPages;
    const current = this.currentPage;
    
    if (total === 0) return [];
    
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(total, start + 4);
      } else {
        start = Math.max(1, end - 4);
      }
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Change page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Get provider icon
   */
  getProviderIcon(source: DatasetSource | string): string {
    return this.providerIcons[source] || '📁';
  }

  /**
   * Get provider name
   */
  getProviderName(source: DatasetSource | string): string {
    const names: Record<string, string> = {
      'github': 'GitHub',
      'datagov': 'Data.gov',
      'kaggle': 'Kaggle',
      'openml': 'OpenML',
      'uci': 'UCI ML'
    };
    return names[source] || source;
  }

  /**
   * Format number with commas
   */
  formatNumber(num: number | string): string {
    if (typeof num === 'string') return num;
    return num?.toLocaleString() || '0';
  }

  /**
   * Navigate to home
   */
  goToHome(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Analyze a dataset - fetches, parses, and navigates to report
   */
  async analyzeDataset(result: DatasetResult): Promise<void> {
    const url = result.processedUrl || result.dataset.downloadUrl || result.dataset.datasetUrl;
    const title = result.dataset.title;
    
    try {
      // Fetch the dataset
      const fetchResult = await this.fetchService.fetchDataset(url).toPromise();
      
      if (!fetchResult?.success || !fetchResult.data) {
        throw new Error(fetchResult?.error || 'Failed to fetch dataset');
      }
      
      // Detect format
      const format = this.validator.detectFormat(url);
      
      // Parse the dataset
      const parsed = await this.parser.parse(fetchResult.data, format, { maxRows: 10000 }).toPromise();
      
      if (!parsed || parsed.data.length === 0) {
        throw new Error('Failed to parse dataset or dataset is empty');
      }
      
      // Store in dataset storage
      this.datasetStorage.setDatasetFromSearch(
        title || 'Searched Dataset',
        parsed.data,
        parsed.headers,
        url
      );
      
      // Set file data in data analysis service
      const fileData = {
        name: title || 'Searched Dataset',
        size: fetchResult.data.length,
        type: 'text/csv',
        content: fetchResult.data,
        parsedData: parsed.data,
        headers: parsed.headers,
        uploadDate: new Date(),
        processingTime: parsed.parseTime
      };
      
      this.dataAnalysisService.setFileData(fileData);
      
      // Trigger analysis
      this.dataAnalysisService['analyzeData'](parsed.data, parsed.headers);
      
      // Set report config
      this.dataAnalysisService.setReportConfig({
        title: `Analysis Report - ${title}`,
        description: `Automated analysis of ${title} containing ${parsed.rowCount} records and ${parsed.columnCount} columns.`,
        generatedBy: 'Data Analysis System v1.0',
        reportId: 'RPT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase()
      });
      
      // Navigate to report page
      this.router.navigate(['/report'], {
        queryParams: {
          dataset: url,
          name: title,
          rows: parsed.rowCount,
          source: 'search'
        }
      });
      
    } catch (error: any) {
      console.error('Error analyzing dataset:', error);
      alert(`Failed to analyze dataset: ${error.message}`);
    }
  }
}
