import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface WebsiteSource {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
  lastFetched?: Date;
  data?: any;
}

export interface WebsiteFetchResult {
  success: boolean;
  data: any;
  error?: string;
  statusCode?: number;
  responseTime?: number;
  tables?: ParsedTable[];
  links?: string[];
  title?: string;
  meta?: { [key: string]: string };
}

export interface ParsedTable {
  id: number;
  headers: string[];
  rows: any[][];
  rowCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebsiteConnectorService {
  private savedWebsitesSubject = new BehaviorSubject<WebsiteSource[]>([]);
  savedWebsites$ = this.savedWebsitesSubject.asObservable();

  // CORS proxy for fetching external websites
  private corsProxies = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest='
  ];

  constructor(private http: HttpClient) {
    this.loadSavedWebsites();
  }

  // Fetch website content
  fetchWebsite(url: string): Observable<WebsiteFetchResult> {
    const startTime = Date.now();
    
    // Try to fetch using CORS proxy
    const proxyUrl = this.corsProxies[0] + encodeURIComponent(url);
    
    const headers = new HttpHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    });

    return this.http.get(proxyUrl, { 
      headers, 
      responseType: 'text',
      observe: 'response'
    }).pipe(
      map(response => {
        const responseTime = Date.now() - startTime;
        const html = response.body || '';
        
        // Parse the HTML content
        const parsed = this.parseHtmlContent(html);
        
        return {
          success: true,
          data: html,
          statusCode: response.status,
          responseTime,
          tables: parsed.tables,
          links: parsed.links,
          title: parsed.title,
          meta: parsed.meta
        };
      }),
      catchError(error => {
        const responseTime = Date.now() - startTime;
        return of({
          success: false,
          data: null,
          error: error.message || 'Failed to fetch website',
          statusCode: error.status,
          responseTime
        });
      })
    );
  }

  // Parse HTML content to extract useful data
  private parseHtmlContent(html: string): {
    tables: ParsedTable[];
    links: string[];
    title: string;
    meta: { [key: string]: string };
  } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract title
    const title = doc.querySelector('title')?.textContent || '';
    
    // Extract meta tags
    const meta: { [key: string]: string } = {};
    doc.querySelectorAll('meta').forEach(m => {
      const name = m.getAttribute('name') || m.getAttribute('property') || '';
      const content = m.getAttribute('content') || '';
      if (name && content) {
        meta[name] = content;
      }
    });
    
    // Extract tables
    const tables: ParsedTable[] = [];
    doc.querySelectorAll('table').forEach((table, index) => {
      const headers: string[] = [];
      const rows: any[][] = [];
      
      // Get headers
      table.querySelectorAll('thead th, tr:first-child th, tr:first-child td').forEach(th => {
        headers.push(th.textContent?.trim() || `Column ${headers.length + 1}`);
      });
      
      // Get rows
      const rowElements = table.querySelectorAll('tbody tr, tr:not(:first-child)');
      rowElements.forEach(tr => {
        const row: any[] = [];
        tr.querySelectorAll('td').forEach(td => {
          row.push(td.textContent?.trim() || '');
        });
        if (row.length > 0) {
          rows.push(row);
        }
      });
      
      if (headers.length > 0 || rows.length > 0) {
        tables.push({
          id: index,
          headers: headers.length > 0 ? headers : this.generateDefaultHeaders(rows[0]?.length || 0),
          rows,
          rowCount: rows.length
        });
      }
    });
    
    // Extract links
    const links: string[] = [];
    doc.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && (href.startsWith('http') || href.startsWith('https'))) {
        links.push(href);
      }
    });
    
    return { tables, links: [...new Set(links)].slice(0, 50), title, meta };
  }

  private generateDefaultHeaders(count: number): string[] {
    const headers: string[] = [];
    for (let i = 0; i < count; i++) {
      headers.push(`Column ${i + 1}`);
    }
    return headers;
  }

  // Convert table to CSV
  tableToCSV(table: ParsedTable): string {
    const lines: string[] = [];
    
    // Add headers
    lines.push(table.headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
    
    // Add rows
    table.rows.forEach(row => {
      lines.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    });
    
    return lines.join('\n');
  }

  // Convert all tables to combined CSV
  allTablesToCSV(tables: ParsedTable[]): string {
    if (tables.length === 0) return '';
    
    // Use the first table with most data
    const largestTable = tables.reduce((prev, curr) => 
      curr.rowCount > prev.rowCount ? curr : prev
    );
    
    return this.tableToCSV(largestTable);
  }

  // Save website source
  saveWebsiteSource(source: Partial<WebsiteSource>): Observable<WebsiteSource> {
    const newSource: WebsiteSource = {
      id: source.id || this.generateId(),
      name: source.name || 'Untitled Website',
      url: source.url || '',
      createdAt: source.createdAt || new Date(),
      lastFetched: source.lastFetched,
      data: source.data
    };

    const current = this.savedWebsitesSubject.value;
    const existingIndex = current.findIndex(s => s.id === newSource.id);
    
    if (existingIndex >= 0) {
      current[existingIndex] = newSource;
    } else {
      current.push(newSource);
    }
    
    this.savedWebsitesSubject.next([...current]);
    this.saveToStorage();
    
    return of(newSource);
  }

  // Delete website source
  deleteWebsiteSource(id: string): void {
    const current = this.savedWebsitesSubject.value;
    const filtered = current.filter(s => s.id !== id);
    this.savedWebsitesSubject.next(filtered);
    this.saveToStorage();
  }

  // Get saved website by ID
  getWebsiteSource(id: string): WebsiteSource | undefined {
    return this.savedWebsitesSubject.value.find(s => s.id === id);
  }

  // Generate sample data for demo
  generateSampleData(url: string): WebsiteFetchResult {
    const tables: ParsedTable[] = [
      {
        id: 0,
        headers: ['ID', 'Name', 'Category', 'Value', 'Status', 'Date'],
        rows: this.generateSampleRows(50),
        rowCount: 50
      }
    ];
    
    return {
      success: true,
      data: 'Sample data generated',
      statusCode: 200,
      responseTime: 150,
      tables,
      links: [
        'https://example.com/page1',
        'https://example.com/page2',
        'https://example.com/page3'
      ],
      title: 'Sample Website Data',
      meta: {
        'description': 'Sample data for demonstration',
        'keywords': 'sample, data, demo'
      }
    };
  }

  private generateSampleRows(count: number): any[][] {
    const categories = ['Technology', 'Business', 'Healthcare', 'Finance', 'Education'];
    const statuses = ['Active', 'Pending', 'Completed', 'In Progress'];
    const rows: any[][] = [];
    
    for (let i = 1; i <= count; i++) {
      const date = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      rows.push([
        i,
        `Item ${i}`,
        categories[Math.floor(Math.random() * categories.length)],
        Math.floor(Math.random() * 10000) + 100,
        statuses[Math.floor(Math.random() * statuses.length)],
        date.toISOString().split('T')[0]
      ]);
    }
    
    return rows;
  }

  private generateId(): string {
    return 'web-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
  }

  private saveToStorage(): void {
    try {
      const sources = this.savedWebsitesSubject.value;
      localStorage.setItem('savedWebsites', JSON.stringify(sources));
    } catch (e) {
      console.error('Failed to save websites:', e);
    }
  }

  private loadSavedWebsites(): void {
    try {
      const saved = localStorage.getItem('savedWebsites');
      if (saved) {
        this.savedWebsitesSubject.next(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load saved websites:', e);
    }
  }
}
