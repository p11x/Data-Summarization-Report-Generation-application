import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Dataset, DatasetSource, DatasetFormat } from './dataset-search.model';

export interface DiscoverySearchResult {
  datasets: DiscoveredDataset[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DiscoveredDataset {
  id: number;
  name: string;
  provider: string;
  description: string;
  file_type: string;
  dataset_url: string;
  repository_url: string;
  repository: string;
  owner: string;
  last_updated: string;
  size_bytes: number;
  size_display: string;
  topic_tags: string[];
  popularity: number;
  is_validated: number;
  validation_error: string;
}

export interface DiscoveryStats {
  totalDatasets: number;
  validatedDatasets: number;
  byProvider: { provider: string; count: number }[];
  byFileType: { file_type: string; count: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class DatasetDiscoveryService {
  private readonly API_BASE = '/api/dataset-discovery';

  constructor(private http: HttpClient) {}

  /**
   * Search datasets from the discovery index
   */
  search(
    query: string,
    page: number = 1,
    limit: number = 20,
    options?: {
      provider?: string;
      fileType?: string;
      sortBy?: 'relevance' | 'popularity' | 'name' | 'updated';
    }
  ): Observable<DiscoverySearchResult> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (query) {
      params = params.set('q', query);
    }
    if (options?.provider) {
      params = params.set('provider', options.provider);
    }
    if (options?.fileType) {
      params = params.set('fileType', options.fileType);
    }
    if (options?.sortBy) {
      params = params.set('sortBy', options.sortBy);
    }

    console.log('[DatasetDiscovery] Searching:', { query, page, limit, options });
    return this.http.get<DiscoverySearchResult>(`${this.API_BASE}/search`, { params }).pipe(
      map(response => {
        // Handle error responses that come with HTTP 200
        if (response && 'success' in response && !response.success) {
          console.warn('[DatasetDiscovery] API returned error:', response);
          return {
            datasets: [],
            pagination: { page, limit, total: 0, totalPages: 0 }
          };
        }
        // Handle old format without success field
        if (response && 'datasets' in response) {
          return response as DiscoverySearchResult;
        }
        // Unexpected response format
        console.warn('[DatasetDiscovery] Unexpected response format:', response);
        return {
          datasets: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        };
      }),
      catchError(err => {
        console.error('[DatasetDiscovery] HTTP error:', err);
        return of({
          datasets: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        });
      })
    );
  }

  /**
   * Get dataset by ID
   */
  getDatasetById(id: number): Observable<DiscoveredDataset> {
    return this.http.get<DiscoveredDataset>(`${this.API_BASE}/${id}`);
  }

  /**
   * Get discovery statistics
   */
  getStats(): Observable<DiscoveryStats> {
    return this.http.get<DiscoveryStats>(`${this.API_BASE}/stats`);
  }

  /**
   * Trigger GitHub crawling for a specific query
   */
  crawl(query: string, maxResults: number = 100, fileTypes: string[] = ['csv', 'json', 'tsv', 'xlsx']): Observable<any> {
    return this.http.post(`${this.API_BASE}/crawl`, { query, maxResults, fileTypes });
  }

  /**
   * Run background dataset discovery for multiple topics
   */
  discover(topics: string[], maxResultsPerTopic: number = 50): Observable<any> {
    return this.http.post(`${this.API_BASE}/discover`, { topics, maxResultsPerTopic });
  }

  /**
   * Validate a dataset URL
   */
  validateUrl(url: string): Observable<{ valid: boolean; statusCode?: number; size?: number; sizeDisplay?: string; contentType?: string; error?: string }> {
    return this.http.post<any>(`${this.API_BASE}/validate`, { url });
  }

  /**
   * Validate all unvalidated datasets
   */
  validateAll(limit: number = 50): Observable<any> {
    return this.http.post(`${this.API_BASE}/validate-all`, { limit });
  }

  /**
   * Convert discovered dataset to our Dataset format for UI display
   */
  toDatasetFormat(discovered: DiscoveredDataset): Dataset {
    return {
      id: `discovery-${discovered.id}`,
      title: discovered.name,
      description: discovered.description || `Dataset from ${discovered.repository}`,
      source: this.mapProviderToSource(discovered.provider),
      datasetUrl: discovered.repository_url || '',
      fileSize: discovered.size_display || 'Unknown',
      rows: 0,
      columns: 0,
      format: this.mapFileTypeToFormat(discovered.file_type),
      downloadUrl: discovered.dataset_url,
      license: 'Unknown',
      tags: discovered.topic_tags || [],
      lastUpdated: discovered.last_updated,
      author: discovered.owner
    };
  }

  /**
   * Map provider string to DatasetSource
   */
  private mapProviderToSource(provider: string): DatasetSource {
    switch (provider.toLowerCase()) {
      case 'github':
        return 'github';
      case 'datagov':
        return 'datagov';
      case 'kaggle':
        return 'kaggle';
      case 'worldbank':
        return 'worldbank';
      default:
        return 'opendata' as DatasetSource;
    }
  }

  /**
   * Map file type string to DatasetFormat
   */
  private mapFileTypeToFormat(fileType: string): DatasetFormat {
    const ft = fileType.toLowerCase();
    if (ft === 'csv' || ft === 'tsv') return 'csv';
    if (ft === 'xlsx' || ft === 'xls') return 'xlsx';
    if (ft === 'json') return 'json';
    if (ft === 'xml') return 'xml';
    if (ft === 'parquet') return 'parquet';
    return 'csv';
  }
}
