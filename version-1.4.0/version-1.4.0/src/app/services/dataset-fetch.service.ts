import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, from, forkJoin, of, catchError, map, timeout, retry } from 'rxjs';
import { DatasetValidatorService, ValidationResult } from './dataset-validator.service';

export interface FetchResult {
  success: boolean;
  data?: string;
  contentType?: string;
  error?: string;
  statusCode?: number;
}

export interface FetchOptions {
  timeout?: number;
  retryCount?: number;
  headers?: HttpHeaders;
}

@Injectable({
  providedIn: 'root'
})
export class DatasetFetchService {
  
  // Default timeout for requests (30 seconds)
  private readonly DEFAULT_TIMEOUT = 30000;
  private readonly DEFAULT_RETRY_COUNT = 2;

  // Cache for fetched datasets
  private cache = new Map<string, { data: string; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(
    private http: HttpClient,
    private validator: DatasetValidatorService
  ) {}

  /**
   * Fetch a dataset from URL with validation
   */
  fetchDataset(url: string, options?: FetchOptions): Observable<FetchResult> {
    // Validate URL first
    const validation = this.validator.validateUrl(url);
    if (!validation.isValid) {
      return of({
        success: false,
        error: validation.error
      });
    }

    const processedUrl = validation.processedUrl || url;
    
    // Check cache first
    const cached = this.getFromCache(processedUrl);
    if (cached) {
      return of({
        success: true,
        data: cached,
        contentType: 'text/csv'
      });
    }

    const timeoutMs = options?.timeout || this.DEFAULT_TIMEOUT;
    const retryCount = options?.retryCount ?? this.DEFAULT_RETRY_COUNT;

    return this.http.get(processedUrl, {
      observe: 'response',
      responseType: 'text',
      headers: options?.headers
    }).pipe(
      timeout(timeoutMs),
      retry({ count: retryCount, delay: 1000 }),
      map((response: HttpResponse<string>) => {
        const contentType = response.headers.get('content-type') || '';
        
        // Validate content type
        if (contentType.includes('text/html')) {
          return {
            success: false,
            error: 'The URL returned HTML instead of a data file. Please provide a direct file URL.',
            statusCode: response.status
          } as FetchResult;
        }

        // Check for error pages
        const body = response.body || '';
        if (body.trim().startsWith('<!DOCTYPE') || body.trim().startsWith('<html')) {
          return {
            success: false,
            error: 'The URL returned an HTML page instead of data. Please provide a direct data file URL.',
            statusCode: response.status
          } as FetchResult;
        }

        // Cache the result
        this.addToCache(processedUrl, body);

        return {
          success: true,
          data: body,
          contentType: contentType,
          statusCode: response.status
        } as FetchResult;
      }),
      catchError(error => {
        let errorMessage = 'Failed to fetch dataset';
        
        if (error.name === 'TimeoutError') {
          errorMessage = 'Request timed out. The dataset may be too large.';
        } else if (error.status === 404) {
          errorMessage = 'Dataset not found. The URL may be incorrect or the file may have been moved.';
        } else if (error.status === 403) {
          errorMessage = 'Access forbidden. The dataset may require authentication.';
        } else if (error.status === 0) {
          errorMessage = 'Network error. This may be due to CORS restrictions.';
        }
        
        return of({
          success: false,
          error: errorMessage,
          statusCode: error.status
        } as FetchResult);
      })
    );
  }

  /**
   * Fetch multiple datasets in parallel
   */
  fetchMultipleDatasets(urls: string[], options?: FetchOptions): Observable<FetchResult[]> {
    const requests = urls.map(url => this.fetchDataset(url, options));
    return forkJoin(requests);
  }

  /**
   * Check if a dataset URL is accessible (HEAD request)
   */
  checkUrlAccessibility(url: string): Observable<boolean> {
    const validation = this.validator.validateUrl(url);
    if (!validation.isValid) {
      return of(false);
    }

    const processedUrl = validation.processedUrl || url;

    return this.http.head(processedUrl, {
      observe: 'response'
    }).pipe(
      map(response => {
        const contentType = response.headers.get('content-type') || '';
        // Check if it's a file type we can handle
        return contentType.includes('text/') || 
               contentType.includes('application/json') ||
               contentType.includes('application/octet-stream');
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Get dataset metadata without fetching full content
   */
  getDatasetMetadata(url: string): Observable<{ size?: number; contentType?: string; accessible: boolean }> {
    const validation = this.validator.validateUrl(url);
    if (!validation.isValid) {
      return of({ accessible: false });
    }

    const processedUrl = validation.processedUrl || url;

    return this.http.head(processedUrl, {
      observe: 'response'
    }).pipe(
      map(response => {
        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');
        
        return {
          size: contentLength ? parseInt(contentLength, 10) : undefined,
          contentType: contentType || undefined,
          accessible: true
        };
      }),
      catchError(() => of({ accessible: false }))
    );
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get from cache
   */
  private getFromCache(url: string): string | null {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(url);
    return null;
  }

  /**
   * Add to cache
   */
  private addToCache(url: string, data: string): void {
    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(url, { data, timestamp: Date.now() });
  }

  /**
   * Estimate if a dataset is too large
   */
  isDatasetTooLarge(url: string, maxSizeMB: number = 100): Observable<boolean> {
    return this.getDatasetMetadata(url).pipe(
      map(metadata => {
        if (!metadata.size) return false; // Unknown size, allow
        return metadata.size > maxSizeMB * 1024 * 1024;
      }),
      catchError(() => of(false))
    );
  }
}
