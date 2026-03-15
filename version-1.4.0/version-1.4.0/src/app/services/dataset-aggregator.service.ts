import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, Subject } from 'rxjs';
import { catchError, map, take, first, timeout } from 'rxjs/operators';
import { Dataset, DatasetSource, DatasetFilters, SearchResult, PaginationState } from './dataset-search.model';
import { KaggleSearchService } from './kaggle-search.service';
import { GitHubDatasetService } from './github-dataset.service';
import { DataGovSearchService } from './datagov-search.service';
import { DatasetDiscoveryService, DiscoveredDataset } from './dataset-discovery.service';

/**
 * Fallback datasets when no results from providers
 */
const FALLBACK_DATASETS: Dataset[] = [
  {
    id: 'fallback-1',
    title: 'COVID-19 Time Series Data',
    description: 'Global COVID-19 confirmed cases, deaths, and recoveries time series data',
    source: 'github',
    datasetUrl: 'https://github.com/datasets/covid-19',
    fileSize: '2.5 MB',
    rows: 50000,
    columns: 8,
    format: 'csv',
    downloadUrl: 'https://raw.githubusercontent.com/datasets/covid-19/master/data/time-series-19-covid-combined.csv',
    license: 'MIT',
    tags: ['covid', 'health', 'pandemic', 'coronavirus'],
    lastUpdated: '2023-12-01',
    author: 'datasets'
  },
  {
    id: 'fallback-2',
    title: 'Titanic Survival Dataset',
    description: 'Classic machine learning dataset with passenger information and survival outcomes',
    source: 'github',
    datasetUrl: 'https://github.com/datasciencedojo/datasets',
    fileSize: '45 KB',
    rows: 891,
    columns: 12,
    format: 'csv',
    downloadUrl: 'https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv',
    license: 'GPL-2.0',
    tags: ['titanic', 'machine learning', 'classification', 'kaggle'],
    lastUpdated: '2023-06-15',
    author: 'datasciencedojo'
  },
  {
    id: 'fallback-3',
    title: 'Iris Flower Dataset',
    description: 'Classic dataset for classification with measurements of iris flowers',
    source: 'github',
    datasetUrl: 'https://github.com/mwaskom/seaborn-data',
    fileSize: '5 KB',
    rows: 150,
    columns: 5,
    format: 'csv',
    downloadUrl: 'https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv',
    license: 'BSD',
    tags: ['iris', 'machine learning', 'classification', 'flowers'],
    lastUpdated: '2023-05-20',
    author: 'mwaskom'
  },
  {
    id: 'fallback-4',
    title: 'Stock Price History',
    description: 'Historical stock price data for major companies',
    source: 'github',
    datasetUrl: 'https://github.com/plotly/datasets',
    fileSize: '150 KB',
    rows: 5000,
    columns: 10,
    format: 'csv',
    downloadUrl: 'https://raw.githubusercontent.com/plotly/datasets/master/finance-charts-apple.csv',
    license: 'MIT',
    tags: ['stocks', 'finance', 'apple', 'trading'],
    lastUpdated: '2023-11-01',
    author: 'plotly'
  },
  {
    id: 'fallback-5',
    title: 'California Housing Prices',
    description: 'Housing data with median house values for California districts',
    source: 'github',
    datasetUrl: 'https://github.com/ageron/handson-ml',
    fileSize: '1.2 MB',
    rows: 20640,
    columns: 10,
    format: 'csv',
    downloadUrl: 'https://raw.githubusercontent.com/ageron/handson-ml/master/datasets/housing/housing.csv',
    license: 'Apache-2.0',
    tags: ['housing', 'real estate', 'california', 'regression'],
    lastUpdated: '2023-08-10',
    author: 'ageron'
  },
  {
    id: 'fallback-6',
    title: 'World Population Data',
    description: 'Population data by country and year from World Bank',
    source: 'github',
    datasetUrl: 'https://github.com/datasets/population',
    fileSize: '500 KB',
    rows: 10000,
    columns: 4,
    format: 'csv',
    downloadUrl: 'https://raw.githubusercontent.com/datasets/population/master/data/population.csv',
    license: 'MIT',
    tags: ['population', 'demographics', 'world', 'countries'],
    lastUpdated: '2023-10-15',
    author: 'datasets'
  },
  {
    id: 'fallback-7',
    title: 'Diamond Prices Dataset',
    description: 'Price and attributes of 50,000 round cut diamonds',
    source: 'github',
    datasetUrl: 'https://github.com/tidyverse/ggplot2',
    fileSize: '3.5 MB',
    rows: 53940,
    columns: 10,
    format: 'csv',
    downloadUrl: 'https://raw.githubusercontent.com/tidyverse/ggplot2/master/data-raw/diamonds.csv',
    license: 'MIT',
    tags: ['diamonds', 'pricing', 'statistics', 'visualization'],
    lastUpdated: '2023-09-01',
    author: 'tidyverse'
  },
  {
    id: 'fallback-8',
    title: 'Weather History Data',
    description: 'Historical weather observations from multiple stations',
    source: 'github',
    datasetUrl: 'https://github.com/datasets/weather',
    fileSize: '2.1 MB',
    rows: 30000,
    columns: 12,
    format: 'csv',
    downloadUrl: 'https://raw.githubusercontent.com/datasets/weather/master/data/weather.csv',
    license: 'MIT',
    tags: ['weather', 'climate', 'meteorology', 'observations'],
    lastUpdated: '2023-11-20',
    author: 'datasets'
  }
];

/**
 * Dataset Aggregator Service
 * Aggregates results from multiple dataset sources in parallel
 * Uses RxJS forkJoin for parallel API calls
 * 
 * IMPORTANT: No automatic discovery on startup - only searches when explicitly called
 * All HTTP requests have timeout protection (8 seconds)
 */
@Injectable({
  providedIn: 'root'
})
export class DatasetAggregatorService {
  // Cache for search results
  private searchCache: Map<string, { data: Dataset[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(
    private kaggleService: KaggleSearchService,
    private githubService: GitHubDatasetService,
    private datagovService: DataGovSearchService,
    private discoveryService: DatasetDiscoveryService
  ) {}

  /**
   * Get datasets by source - with timeout and take(1) for stability
   */
  getBySource(query: string, source: DatasetSource, limit: number = 20): Observable<Dataset[]> {
    console.log(`[Aggregator] getBySource called: query="${query}", source="${source}", limit=${limit}`);
    
    // Limit results per source
    const safeLimit = Math.min(limit, 20);
    
    // Use discovery service for GitHub (the new backend-powered search)
    if (source === 'github') {
      return this.discoveryService.search(query, 1, safeLimit).pipe(
        timeout(8000),
        take(1),
        map(result => {
          console.log(`[Aggregator] Discovery results: ${result.datasets.length}`);
          return result.datasets.map(d => this.discoveryService.toDatasetFormat(d));
        }),
        catchError(err => {
          console.error('[Aggregator] Discovery error, falling back to direct GitHub API:', err);
          // Fallback to direct GitHub API
          return this.githubService.search(query, safeLimit).pipe(
            timeout(8000),
            take(1),
            map(results => {
              console.log(`[Aggregator] GitHub fallback results: ${results.length}`);
              return results;
            }),
            catchError(e => {
              console.error('[Aggregator] GitHub API error:', e);
              return of([]);
            })
          );
        })
      );
    }
    
    switch (source) {
      case 'kaggle':
        return this.kaggleService.search(query, safeLimit).pipe(
          timeout(8000),
          take(1),
          map(results => {
            console.log(`[Aggregator] Kaggle results: ${results.length}`);
            return results;
          }),
          catchError(e => {
            console.error('[Aggregator] Kaggle error:', e);
            return of([]);
          })
        );
      case 'datagov':
        return this.datagovService.search(query, safeLimit).pipe(
          timeout(8000),
          take(1),
          map(results => {
            console.log(`[Aggregator] Data.gov results: ${results.length}`);
            return results;
          }),
          catchError(e => {
            console.error('[Aggregator] Data.gov error:', e);
            return of([]);
          })
        );
      default:
        console.log(`[Aggregator] Unknown source: ${source}`);
        return of([]);
    }
  }

  /**
   * Search using the new discovery engine (for large-scale dataset search)
   * This queries the backend index which has 50k+ datasets
   */
  searchWithDiscovery(
    query: string,
    page: number = 1,
    limit: number = 20,
    options?: {
      provider?: string;
      fileType?: string;
      sortBy?: 'relevance' | 'popularity' | 'name' | 'updated';
    }
  ): Observable<{ datasets: Dataset[]; pagination: any }> {
    return this.discoveryService.search(query, page, limit, options).pipe(
      map(result => ({
        datasets: result.datasets.map(d => this.discoveryService.toDatasetFormat(d)),
        pagination: result.pagination
      })),
      catchError(err => {
        console.error('[Aggregator] Discovery search error:', err);
        return of({ datasets: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } });
      })
    );
  }

  /**
   * Trigger dataset discovery from GitHub
   */
  triggerDiscovery(query: string, maxResults: number = 100): Observable<any> {
    return this.discoveryService.crawl(query, maxResults);
  }

  /**
   * Run background dataset discovery
   */
  runBackgroundDiscovery(topics: string[], maxResultsPerTopic: number = 50): Observable<any> {
    return this.discoveryService.discover(topics, maxResultsPerTopic);
  }

  /**
   * Get discovery statistics
   */
  getDiscoveryStats(): Observable<any> {
    return this.discoveryService.getStats();
  }

  /**
   * Filter datasets based on filter criteria
   */
  filterDatasets(datasets: Dataset[], filters: DatasetFilters): Dataset[] {
    let filtered = [...datasets];

    // Filter by source
    if (filters.sources && filters.sources.length > 0) {
      filtered = filtered.filter(d => filters.sources.includes(d.source));
    }

    // Filter by format
    if (filters.formats && filters.formats.length > 0) {
      filtered = filtered.filter(d => filters.formats.includes(d.format));
    }

    // Filter by row count
    if (filters.minRows !== undefined) {
      filtered = filtered.filter(d => d.rows >= filters.minRows!);
    }
    if (filters.maxRows !== undefined) {
      filtered = filtered.filter(d => d.rows <= filters.maxRows!);
    }

    return filtered;
  }

  /**
   * Paginate datasets
   */
  paginateDatasets(datasets: Dataset[], page: number, pageSize: number): { data: Dataset[]; pagination: PaginationState } {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = datasets.slice(startIndex, endIndex);

    const pagination: PaginationState = {
      page,
      pageSize,
      totalItems: datasets.length,
      totalPages: Math.ceil(datasets.length / pageSize)
    };

    return { data: paginatedData, pagination };
  }

  /**
   * Remove duplicate datasets based on title similarity
   */
  private removeDuplicates(datasets: Dataset[]): Dataset[] {
    const unique: Dataset[] = [];
    const titleSet = new Set<string>();

    for (const dataset of datasets) {
      const normalizedTitle = dataset.title.toLowerCase().trim();
      if (!titleSet.has(normalizedTitle)) {
        titleSet.add(normalizedTitle);
        unique.push(dataset);
      }
    }

    return unique;
  }

  /**
   * Build search result object
   */
  private buildSearchResult(query: string, datasets: Dataset[], sources?: DatasetSource[]): SearchResult {
    const allSources: DatasetSource[] = [...new Set(datasets.map(d => d.source))];
    return {
      datasets,
      totalCount: datasets.length,
      sources: sources || allSources,
      query,
      timestamp: new Date()
    };
  }

  /**
   * Get data from cache
   */
  private getFromCache(key: string): Dataset[] | null {
    const cached = this.searchCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Add data to cache
   */
  private addToCache(key: string, data: Dataset[]): void {
    this.searchCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.searchCache.clear();
  }

  /**
   * Get source display name
   */
  getSourceDisplayName(source: DatasetSource): string {
    const names: Record<DatasetSource, string> = {
      'kaggle': 'Kaggle',
      'github': 'GitHub',
      'datagov': 'Data.gov',
      'google': 'Google Dataset Search',
      'worldbank': 'World Bank',
      'undata': 'UN Data',
      'eu': 'EU Open Data',
      'opendata': 'Open Data Portal'
    };
    return names[source] || source;
  }

  /**
   * Get source icon
   */
  getSourceIcon(source: DatasetSource): string {
    const icons: Record<DatasetSource, string> = {
      'kaggle': '📊',
      'github': '🐙',
      'datagov': '🇺🇸',
      'google': '🔍',
      'worldbank': '🌍',
      'undata': '🌐',
      'eu': '🇪🇺',
      'opendata': '📂'
    };
    return icons[source] || '📁';
  }

  /**
   * Get fallback datasets when no results from providers
   */
  getFallbackDatasets(query?: string, limit: number = 8): Observable<Dataset[]> {
    console.log('[Aggregator] Returning fallback datasets');
    // If there's a query, filter fallback datasets by relevance
    if (query && query.trim()) {
      const lowerQuery = query.toLowerCase();
      const filtered = FALLBACK_DATASETS.filter(d => 
        d.title.toLowerCase().includes(lowerQuery) ||
        d.description.toLowerCase().includes(lowerQuery) ||
        (d.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery))
      );
      return of(filtered.length > 0 ? filtered.slice(0, limit) : FALLBACK_DATASETS.slice(0, limit));
    }
    return of(FALLBACK_DATASETS.slice(0, limit));
  }

  /**
   * Check if result is from fallback
   */
  isFallbackDataset(id: string): boolean {
    return id.startsWith('fallback-');
  }
}
