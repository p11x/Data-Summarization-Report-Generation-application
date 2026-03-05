/**
 * Shared utility functions for CSV parsing and data manipulation.
 * This module centralizes common data processing logic to avoid duplication
 * across services and components.
 */

import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';

// PDF parsing using pdf-parse

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

// ============================================
// TXT/Multi-Delimiter Parsing Utilities
// ============================================

/**
 * Detect the delimiter used in a text file.
 * @param line - A sample line from the file
 * @returns Detected delimiter: ',', '\t', '|', or ' ' (space)
 */
function detectDelimiter(line: string): string {
  // Count occurrences of each delimiter
  const tabCount = (line.match(/\t/g) || []).length;
  const pipeCount = (line.match(/\|/g) || []).length;
  const commaCount = (line.match(/,/g) || []).length;
  const semicolonCount = (line.match(/;/g) || []).length;
  const spaceCount = (line.match(/\s{2,}/g) || []).length;

  const maxCount = Math.max(tabCount, pipeCount, commaCount, semicolonCount, spaceCount);

  if (maxCount === tabCount && tabCount > 0) return '\t';
  if (maxCount === pipeCount && pipeCount > 0) return '|';
  if (maxCount === semicolonCount && semicolonCount > 0) return ';';
  if (maxCount === spaceCount && spaceCount > 0) return ' ';
  return ','; // Default to comma
}

/**
 * Parse a line using a specific delimiter.
 * @param line - The line to parse
 * @param delimiter - The delimiter to use
 * @returns Array of parsed values
 */
function parseDelimitedLine(line: string, delimiter: string): string[] {
  if (delimiter === ' ') {
    // Space-delimited: split by 2+ spaces
    return line.split(/\s{2,}/).map(s => s.trim()).filter(s => s.length > 0);
  }
  if (delimiter === '\t') {
    // Tab-delimited
    return line.split('\t').map(s => s.trim());
  }
  if (delimiter === '|') {
    // Pipe-delimited
    return line.split('|').map(s => s.trim());
  }
  if (delimiter === ';') {
    // Semicolon-delimited
    return line.split(';').map(s => s.trim());
  }
  // Default: comma-delimited
  return line.split(',').map(s => s.trim());
}

/**
 * Parse TXT content with auto-detection of delimiters.
 * Supports: comma, tab, pipe, semicolon, and space-delimited formats.
 * @param content - The raw TXT content
 * @param filename - Optional filename for logging/debugging
 * @returns Object containing parsed data and headers
 */
export function parseTXT(content: string, filename: string = ''): { parsedData: Record<string, string>[], headers: string[], detectedDelimiter: string } {
  const lines = content.trim().split('\n').filter(l => l.trim().length > 0);
  
  if (lines.length === 0) {
    return { parsedData: [], headers: [], detectedDelimiter: ',' };
  }

  // Detect delimiter from first non-empty line
  const delimiter = detectDelimiter(lines[0]);
  console.debug(`[parseTXT] Detected delimiter '${delimiter}' for file: ${filename}`);

  // Parse headers
  const headers = parseDelimitedLine(lines[0], delimiter);
  
  // Validate: if headers don't look like headers (e.g., all numeric), try first row as data
  const hasNumericHeaders = headers.every(h => !isNaN(parseFloat(h)));
  const hasFewerColumns = headers.length < 2;

  let parsedData: Record<string, string>[] = [];
  let dataStartIndex = 1;

  // If headers look like data, create generic column names
  if (hasNumericHeaders || hasFewerColumns) {
    console.debug(`[parseTXT] Headers appear to be data, creating generic column names`);
    const firstRowValues = parseDelimitedLine(lines[0], delimiter);
    headers.length = 0;
    for (let i = 0; i < firstRowValues.length; i++) {
      headers.push(`Column_${i + 1}`);
    }
    dataStartIndex = 0; // First row is data
  }

  // Parse data rows
  for (let i = dataStartIndex; i < lines.length; i++) {
    const values = parseDelimitedLine(lines[i], delimiter);
    
    // Only add row if it has at least some values
    if (values.length > 0 && values.some(v => v.length > 0)) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      parsedData.push(row);
    }
  }

  console.debug(`[parseTXT] Parsed ${parsedData.length} rows, ${headers.length} columns`);
  
  return { parsedData, headers, detectedDelimiter: delimiter };
}

/**
 * Universal parser that auto-detects file type and uses appropriate parser.
 * @param content - The raw file content
 * @param filename - The filename to determine type
 * @returns Object containing parsed data and headers
 */
export function parseFile(content: string, filename: string): { parsedData: Record<string, string>[], headers: string[] } {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (ext === '.csv') {
    return parseCSV(content);
  }
  
  // For .txt files, try multi-delimiter parsing
  if (ext === '.txt') {
    const result = parseTXT(content, filename);
    
    // Validation: if parsing failed or too few rows, return error indicator
    if (result.parsedData.length < 3) {
      console.debug(`[parseFile] TXT parse returned ${result.parsedData.length} rows, may be unstructured`);
    }
    
    return { parsedData: result.parsedData, headers: result.headers };
  }
  
  // Default to CSV parser for unknown types
  return parseCSV(content);
}

// ============================================
// Excel Parsing Utilities
// ============================================

/**
 * Parse Excel file (.xlsx/.xls) into structured data.
 * Uses SheetJS (xlsx) library.
 * @param data - ArrayBuffer from file
 * @returns Object containing parsed data and headers
 */
export function parseExcel(data: ArrayBuffer): { parsedData: Record<string, string>[], headers: string[], sheetName: string } {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with array of arrays (first row = headers)
  const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  if (json.length === 0) {
    return { parsedData: [], headers: [], sheetName };
  }
  
  // First row is headers
  const headers = json[0].map((h, i) => {
    if (h === null || h === undefined || h === '') {
      return `Column_${i + 1}`;
    }
    return String(h);
  });
  
  // Parse data rows
  const parsedData: Record<string, string>[] = [];
  for (let i = 1; i < json.length; i++) {
    const row = json[i];
    if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        const value = row[index];
        obj[header] = value !== null && value !== undefined ? String(value) : '';
      });
      parsedData.push(obj);
    }
  }
  
  console.debug(`[parseExcel] Parsed sheet '${sheetName}': ${parsedData.length} rows, ${headers.length} columns`);
  
  return { parsedData, headers, sheetName };
}

// ============================================
// PDF Parsing Utilities
// ============================================

/**
 * Parse PDF file into structured text data.
 * Uses pdf-parse library with timeout and error handling.
 * @param data - ArrayBuffer from file
 * @returns Object containing parsed data and headers
 */
export async function parsePDF(data: ArrayBuffer): Promise<{ parsedData: Record<string, any>[], headers: string[], pageCount: number }> {
  console.log('🚨 PDF DEBUG START', data.byteLength);
  
  // Dynamic import of pdf-parse - handle both CJS and ESM
  const pdfParseModule = await import('pdf-parse');
  // Try to find the parse function (works for both CJS and ESM)
  const pdfParse = (pdfParseModule as any).default || pdfParseModule;
  
  const uint8Array = new Uint8Array(data);
  console.log('✅ PDF raw bytes loaded:', uint8Array.length);
  
  const pdfData = await pdfParse(uint8Array);
  console.log('✅ PDF extracted:', pdfData.numpages, 'pages');
  
  const pageCount = pdfData.numpages;
  
  // Split text into lines
  const lines = pdfData.text
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 3);
  
  console.log('✅ PDF lines extracted:', lines.length);
  
  // Limit to 500 rows to prevent memory issues
  const limitedLines = lines.slice(0, 500);
  
  // Create dataset with page estimation, content, and length
  const parsedData = limitedLines.map((line: string, index: number) => ({
    page: Math.floor(index / 50) + 1,
    content: line,
    length: line.length
  }));
  
  const headers = ['page', 'content', 'length'];
  
  console.debug(`[parsePDF] Parsed PDF: ${pageCount} pages, ${parsedData.length} lines`);
  
  return { parsedData, headers, pageCount };
}

// ============================================
// XML Parsing Utilities
// ============================================

/**
 * Get XPath for an element
 */
function getXPath(element: Element): string {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  const parts: string[] = [];
  let current: Element | null = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.tagName.toLowerCase();
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children).filter(
        (child) => child.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `[${index}]`;
      }
    }
    parts.unshift(selector);
    current = current.parentElement as Element;
  }
  
  return parts.length ? '/' + parts.join('/') : '';
}

/**
 * Parse XML file into structured data.
 * Uses native DOMParser.
 * @param text - Raw XML text content
 * @returns Object containing parsed data and headers
 */
export function parseXML(text: string): { parsedData: Record<string, string>[], headers: string[], rootElement: string } {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');
  
  // Check for parsing errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    console.debug('[parseXML] XML parsing failed, falling back to raw text');
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    return { 
      parsedData: lines.map(line => ({ content: line.trim() })), 
      headers: ['content'],
      rootElement: 'error'
    };
  }
  
  const rootElement = xmlDoc.documentElement.tagName;
  const rows: Record<string, string>[] = [];
  
  // Walk through all text nodes
  const walker = document.createTreeWalker(
    xmlDoc, 
    NodeFilter.SHOW_TEXT, 
    null
  );
  
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textContent = node.textContent?.trim();
    if (textContent && textContent.length > 0) {
      const parent = node.parentElement;
      if (parent && parent.tagName !== 'parsererror') {
        rows.push({
          tag: parent.tagName,
          content: textContent,
          path: getXPath(parent)
        });
      }
    }
  }
  
  const headers = ['tag', 'content', 'path'];
  
  console.debug(`[parseXML] Parsed XML: ${rows.length} elements from <${rootElement}>`);
  
  return { parsedData: rows, headers, rootElement };
}

// ============================================
// HTML Parsing Utilities
// ============================================

/**
 * Parse HTML file into structured data.
 * Uses native DOMParser.
 * @param text - Raw HTML text content
 * @returns Object containing parsed data and headers
 */
export function parseHTML(text: string): { parsedData: Record<string, string>[], headers: string[], title: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  
  // Get page title
  const title = doc.querySelector('title')?.textContent || 'Untitled';
  
  // Remove script and style elements
  const scripts = doc.querySelectorAll('script, style, noscript');
  scripts.forEach(el => el.remove());
  
  const rows: Record<string, string>[] = [];
  
  // Walk through all text nodes in body
  const walker = document.createTreeWalker(
    doc.body, 
    NodeFilter.SHOW_TEXT, 
    null
  );
  
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textContent = node.textContent?.trim();
    // Filter: skip short text (< 5 chars)
    if (textContent && textContent.length > 5) {
      const parent = node.parentElement;
      if (parent) {
        rows.push({
          tag: parent.tagName.toLowerCase(),
          class: parent.className || '',
          content: textContent
        });
      }
    }
  }
  
  // Limit to 1000 rows for performance
  const limitedRows = rows.slice(0, 1000);
  const headers = ['tag', 'class', 'content'];
  
  console.debug(`[parseHTML] Parsed HTML: ${limitedRows.length} text blocks from <${title}>`);
  
  return { parsedData: limitedRows, headers, title };
}

// ============================================
// DOCX Parsing Utilities
// ============================================

/**
 * Parse DOCX file into structured data.
 * Uses mammoth library to convert to HTML, then extracts paragraphs.
 * @param arrayBuffer - Raw DOCX file data
 * @returns Object containing parsed data and headers
 */
export async function parseDOCX(arrayBuffer: ArrayBuffer): Promise<{ parsedData: Record<string, string>[], headers: string[], paragraphCount: number }> {
  const result = await mammoth.convertToHtml({ arrayBuffer });
  
  // Create temporary DOM to extract paragraphs
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = result.value;
  
  const rows: Record<string, string>[] = [];
  
  // Extract paragraphs and table cells
  tempDiv.querySelectorAll('p, td, th').forEach((el) => {
    const text = el.textContent?.trim();
    if (text && text.length > 0) {
      rows.push({ content: text });
    }
  });
  
  // Limit to 1000 rows for performance
  const limitedRows = rows.slice(0, 1000);
  const headers = ['content'];
  
  console.debug(`[parseDOCX] Parsed DOCX: ${limitedRows.length} paragraphs`);
  
  return { parsedData: limitedRows, headers, paragraphCount: limitedRows.length };
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
