/**
 * Dataset Model Interface
 * Standardized dataset object structure for multi-source dataset search
 */
export interface Dataset {
  id: string;
  title: string;
  description: string;
  source: DatasetSource;
  datasetUrl: string;
  fileSize: string;
  rows: number;
  columns: number;
  format: DatasetFormat;
  downloadUrl?: string;
  license?: string;
  tags?: string[];
  lastUpdated?: string;
  author?: string;
}

/**
 * Supported Dataset Sources
 */
export type DatasetSource = 'kaggle' | 'github' | 'datagov' | 'google' | 'worldbank' | 'undata' | 'eu' | 'opendata';

/**
 * Supported Dataset Formats
 */
export type DatasetFormat = 'csv' | 'xlsx' | 'json' | 'xml' | 'parquet' | 'sqlite' | 'zip';

/**
 * Search Result Interface
 */
export interface SearchResult {
  datasets: Dataset[];
  totalCount: number;
  sources: DatasetSource[];
  query: string;
  timestamp: Date;
}

/**
 * Filter Options Interface
 */
export interface DatasetFilters {
  sources: DatasetSource[];
  formats: DatasetFormat[];
  minSize?: number;
  maxSize?: number;
  minRows?: number;
  maxRows?: number;
}

/**
 * Pagination Interface
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Search State Interface
 */
export interface SearchState {
  query: string;
  results: Dataset[];
  loading: boolean;
  error: string | null;
  filters: DatasetFilters;
  pagination: PaginationState;
}
