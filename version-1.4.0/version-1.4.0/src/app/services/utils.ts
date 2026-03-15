/**
 * Shared utility functions for CSV parsing and data manipulation.
 * This module centralizes common data processing logic to avoid duplication
 * across services and components.
 */

// ============================================
// CSV Parsing Utilities
// ============================================

/**
 * Parse a CSV line, handling quoted values correctly.
 * @param line - The CSV line to parse
 * @returns Array of parsed values
 */
export function parseCSVLine(line: string): string[] {
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
 * Parse CSV content into an array of objects.
 * @param content - The raw CSV content
 * @returns Object containing parsed data and headers
 */
export function parseCSV(content: string): { parsedData: Record<string, string>[], headers: string[] } {
  const lines = content.trim().split('\n');
  if (lines.length === 0) {
    return { parsedData: [], headers: [] };
  }

  const headers = parseCSVLine(lines[0]);
  const parsedData: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      parsedData.push(row);
    }
  }

  return { parsedData, headers };
}

/**
 * Convert parsed CSV data to CSV string format.
 * @param headers - Array of column headers
 * @param data - Array of data objects
 * @returns CSV formatted string
 */
export function toCSV(headers: string[], data: Record<string, any>[]): string {
  const rows = data.map(row =>
    headers.map(header => {
      const value = row[header];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generate a unique ID based on timestamp and random string.
 * @param prefix - Optional prefix for the ID
 * @returns Generated unique ID
 */
export function generateUniqueId(prefix: string = ''): string {
  return `${prefix}${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

/**
 * Format bytes to human-readable string.
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date to ISO string (YYYY-MM-DD).
 * @param date - Date object or date string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Calculate basic statistics for numeric data.
 * @param values - Array of numeric values
 * @returns Object containing min, max, mean, median, stdDev
 */
export function calculateNumericStats(values: number[]): {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
} {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100
  };
}

/**
 * Detect the type of a column based on its values.
 * @param values - Array of values to analyze
 * @returns Detected type: 'Numeric', 'Date', or 'Text'
 */
export function detectColumnType(values: string[]): 'Numeric' | 'Date' | 'Text' {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonNullValues.length === 0) return 'Text';

  // Check for date
  const dateValues = nonNullValues.filter(v => !isNaN(Date.parse(v)));
  if (dateValues.length > nonNullValues.length * 0.8) {
    return 'Date';
  }

  // Check for numeric
  const numericValues = nonNullValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
  if (numericValues.length > nonNullValues.length * 0.5) {
    return 'Numeric';
  }

  return 'Text';
}

/**
 * Deep clone an object.
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function execution.
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ============================================
// Constants
// ============================================

/** Chart color palettes */
export const CHART_COLORS = {
  default: [
    'rgba(102, 126, 234, 0.8)',
    'rgba(118, 75, 162, 0.8)',
    'rgba(237, 100, 166, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(249, 115, 22, 0.8)'
  ],
  border: [
    'rgba(102, 126, 234, 1)',
    'rgba(118, 75, 162, 1)',
    'rgba(237, 100, 166, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(16, 185, 129, 1)',
    'rgba(59, 130, 246, 1)',
    'rgba(139, 92, 246, 1)',
    'rgba(236, 72, 153, 1)',
    'rgba(34, 197, 94, 1)',
    'rgba(249, 115, 22, 1)'
  ]
};

/** Default chart configuration */
export const DEFAULT_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom' as const },
    tooltip: { enabled: true }
  }
};

/** Chart helper functions */
export const ChartHelpers = {
  /**
   * Generate chart data from text column values
   */
  generateTextChartData(values: string[], maxItems: number = 10, maxLabelLength: number = 15): { labels: string[], data: number[] } {
    const valueCounts = values.reduce((acc, v) => {
      const key = String(v);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxItems);

    return {
      labels: sorted.map(([key]) => key.length > maxLabelLength ? key.substring(0, maxLabelLength) + '...' : key),
      data: sorted.map(([, value]) => value)
    };
  },

  /**
   * Generate chart data from numeric column values (histogram)
   */
  generateNumericChartData(values: number[], binCount: number = 10): { labels: string[], data: number[] } {
    if (!values.length) return { labels: [], data: [] };

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / binCount || 1;

    const bins = Array(binCount).fill(0);
    const labels: string[] = [];

    for (let i = 0; i < binCount; i++) {
      const binStart = min + i * binSize;
      const binEnd = binStart + binSize;
      bins[i] = values.filter(v => v >= binStart && (i === binCount - 1 ? v <= binEnd : v < binEnd)).length;
      labels.push(`${Math.round(binStart)}-${Math.round(binEnd)}`);
    }

    return { labels, data: bins };
  },

  /**
   * Create chart dataset configuration
   */
  createDataset(data: number[], label: string, colorIndex: number = 0) {
    return {
      data,
      label,
      backgroundColor: CHART_COLORS.default[colorIndex % CHART_COLORS.default.length],
      borderColor: CHART_COLORS.border[colorIndex % CHART_COLORS.border.length],
      borderWidth: 1
    };
  }
};

// ============================================
// Storage Utilities
// ============================================

/**
 * Storage service for localStorage operations with error handling.
 */
export const StorageService = {
  /**
   * Save data to localStorage.
   * @param key - Storage key
   * @param data - Data to store
   * @returns True if successful, false otherwise
   */
  set<T>(key: string, data: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`StorageService.set failed for key '${key}':`, error);
      return false;
    }
  },

  /**
   * Retrieve data from localStorage.
   * @param key - Storage key
   * @returns Parsed data or null if not found/error
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`StorageService.get failed for key '${key}':`, error);
      return null;
    }
  },

  /**
   * Remove item from localStorage.
   * @param key - Storage key to remove
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`StorageService.remove failed for key '${key}':`, error);
    }
  },

  /**
   * Clear all localStorage.
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('StorageService.clear failed:', error);
    }
  }
};
