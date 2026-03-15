import { Injectable } from '@angular/core';
import { DatasetSource } from './dataset-search.model';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  processedUrl?: string;
  format?: string;
}

export interface DatasetValidationConfig {
  allowedFormats?: string[];
  maxFileSize?: number; // in bytes
}

@Injectable({
  providedIn: 'root'
})
export class DatasetValidatorService {
  
  // Blocked providers that cannot be accessed directly
  private readonly BLOCKED_PROVIDERS = [
    'kaggle.com',
    'drive.google.com',
    'dropbox.com',
    'docs.google.com',
    'share.google.com',
    '1drv.ms'
  ];

  // Supported providers that work without authentication
  private readonly SUPPORTED_PROVIDERS = [
    'raw.githubusercontent.com',
    'gist.githubusercontent.com',
    'uciml.github.io',
    'archive.ics.uci.edu',
    'openml.org',
    'data.gov',
    'github.com' // Will be converted to raw
  ];

  // Supported file formats
  private readonly SUPPORTED_FORMATS = ['csv', 'json', 'tsv', 'txt'];

  constructor() {}

  /**
   * Validate a dataset URL
   */
  validateUrl(url: string, config?: DatasetValidationConfig): ValidationResult {
    const warnings: string[] = [];
    
    try {
      // Check if URL is valid
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Check if URL belongs to blocked provider
      for (const blocked of this.BLOCKED_PROVIDERS) {
        if (hostname.includes(blocked)) {
          return {
            isValid: false,
            error: `Unsupported provider: ${hostname}. This source requires authentication.`
          };
        }
      }

      // Validate URL format
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return {
          isValid: false,
          error: 'Invalid URL format. URL must start with http:// or https://'
        };
      }

      // Detect format from URL
      const format = this.detectFormat(url);
      if (!this.SUPPORTED_FORMATS.includes(format)) {
        warnings.push(`Detected format '${format}' may not be supported`);
      }

      // Convert GitHub blob URLs to raw URLs
      let processedUrl = this.convertGitHubBlobToRaw(url);
      
      // Check for HTML pages - but be lenient for now
      if (processedUrl.includes('/blob/') || processedUrl.includes('/tree/')) {
        warnings.push('GitHub blob/tree URLs should be converted to raw URLs');
      }

      // For now, accept all valid URLs even if format is unknown
      return {
        isValid: true,
        processedUrl,
        format,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (e) {
      console.warn('[DatasetValidator] URL validation error:', e);
      return {
        isValid: false,
        error: 'Invalid URL format'
      };
    }
  }

  /**
   * Check if a provider is blocked
   */
  isProviderBlocked(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      return this.BLOCKED_PROVIDERS.some(blocked => hostname.includes(blocked));
    } catch {
      return true;
    }
  }

  /**
   * Get the provider name from URL
   */
  getProviderFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      if (hostname.includes('github.com') || hostname.includes('raw.githubusercontent.com')) {
        return 'GitHub';
      }
      if (hostname.includes('uci.edu')) {
        return 'UCI ML Repository';
      }
      if (hostname.includes('data.gov')) {
        return 'Data.gov';
      }
      if (hostname.includes('openml.org')) {
        return 'OpenML';
      }
      if (hostname.includes('kaggle.com')) {
        return 'Kaggle (Blocked)';
      }
      if (hostname.includes('drive.google.com')) {
        return 'Google Drive (Blocked)';
      }
      if (hostname.includes('dropbox.com')) {
        return 'Dropbox (Blocked)';
      }
      
      return hostname;
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Detect file format from URL
   */
  detectFormat(url: string): string {
    const urlLower = url.toLowerCase();
    
    if (urlLower.endsWith('.csv') || urlLower.includes('.csv?')) {
      return 'csv';
    }
    if (urlLower.endsWith('.json') || urlLower.includes('.json?')) {
      return 'json';
    }
    if (urlLower.endsWith('.tsv') || urlLower.includes('.tsv?')) {
      return 'tsv';
    }
    if (urlLower.endsWith('.txt') || urlLower.includes('.txt?')) {
      return 'txt';
    }
    
    // Check for common data patterns
    if (urlLower.includes('format=csv') || urlLower.includes('filetype=csv')) {
      return 'csv';
    }
    if (urlLower.includes('format=json')) {
      return 'json';
    }
    
    return 'unknown';
  }

  /**
   * Convert GitHub blob URLs to raw URLs
   */
  convertGitHubBlobToRaw(url: string): string {
    try {
      // Pattern 1: github.com/user/repo/blob/branch/path -> raw.githubusercontent.com/user/repo/branch/path
      const blobPattern = /github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)/;
      const blobMatch = url.match(blobPattern);
      
      if (blobMatch) {
        const [, owner, repo, branch, filePath] = blobMatch;
        return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      }

      // Pattern 2: github.com/user/repo/file.csv -> raw.githubusercontent.com/user/repo/main/file.csv
      // This is a guess and may not always work
      const directPattern = /github\.com\/([^\/]+)\/([^\/]+)\/([^\/]+\.(csv|json|tsv|txt))(\?.*)?$/;
      const directMatch = url.match(directPattern);
      
      if (directMatch) {
        // Try with 'main' branch first, then 'master'
        const [, owner, repo, file] = directMatch;
        return `https://raw.githubusercontent.com/${owner}/${repo}/main/${file}`;
      }
      
      return url;
    } catch {
      return url;
    }
  }

  /**
   * Filter datasets by removing blocked providers
   */
  filterDatasets(datasets: { datasetUrl?: string; downloadUrl?: string; source?: DatasetSource }[]): any[] {
    return datasets.filter(dataset => {
      const url = dataset.downloadUrl || dataset.datasetUrl || '';
      
      // Check if source is explicitly blocked
      if (dataset.source === 'kaggle' || dataset.source === 'google') {
        return false;
      }
      
      // Check URL for blocked providers
      if (this.isProviderBlocked(url)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Sort datasets by relevance to search query
   */
  sortByRelevance(datasets: any[], searchQuery: string): any[] {
    if (!searchQuery) return datasets;
    
    const query = searchQuery.toLowerCase();
    const queryWords = query.split(/\s+/).filter(w => w.length > 0);
    
    return datasets.map(dataset => {
      let relevanceScore = 0;
      const title = (dataset.title || '').toLowerCase();
      const description = (dataset.description || '').toLowerCase();
      const tags = (dataset.tags || []).join(' ').toLowerCase();
      const combinedText = `${title} ${description} ${tags}`;
      
      // Exact match in title gets highest score
      if (title.includes(query)) {
        relevanceScore += 100;
      }
      
      // Check each query word
      for (const word of queryWords) {
        if (title.includes(word)) {
          relevanceScore += 50;
        }
        if (description.includes(word)) {
          relevanceScore += 20;
        }
        if (tags.includes(word)) {
          relevanceScore += 15;
        }
      }
      
      return { ...dataset, _relevanceScore: relevanceScore };
    })
    .sort((a, b) => b._relevanceScore - a._relevanceScore)
    .map(({ _relevanceScore, ...dataset }) => dataset);
  }
}
