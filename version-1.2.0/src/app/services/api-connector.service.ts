import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface ApiDataSource {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST';
  headers: { key: string; value: string }[];
  params: { key: string; value: string }[];
  authToken?: string;
  authType?: 'bearer' | 'api-key' | 'basic';
  createdAt: Date;
  lastFetched?: Date;
  category: 'rest' | 'weather' | 'finance' | 'covid' | 'custom';
  description?: string;
}

export interface ApiConnectionResult {
  success: boolean;
  data: any;
  error?: string;
  statusCode?: number;
  responseTime?: number;
  recordCount?: number;
}

export interface PublicDataset {
  id: string;
  name: string;
  description: string;
  category: 'weather' | 'finance' | 'covid' | 'government' | 'social';
  url: string;
  docsUrl?: string;
  requiresAuth: boolean;
  sampleResponse?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ApiConnectorService {
  private dataSourcesSubject = new BehaviorSubject<ApiDataSource[]>([]);
  private connectionHistorySubject = new BehaviorSubject<ApiConnectionResult[]>([]);
  
  dataSources$ = this.dataSourcesSubject.asObservable();
  connectionHistory$ = this.connectionHistorySubject.asObservable();

  // Public datasets catalog
  publicDatasets: PublicDataset[] = [
    {
      id: 'openweather',
      name: 'OpenWeather API',
      description: 'Current weather data, forecasts, and historical data',
      category: 'weather',
      url: 'https://api.openweathermap.org/data/2.5/weather',
      docsUrl: 'https://openweathermap.org/api',
      requiresAuth: true
    },
    {
      id: 'weatherapi',
      name: 'WeatherAPI.com',
      description: 'Real-time weather, forecast, and historical data',
      category: 'weather',
      url: 'https://api.weatherapi.com/v1/current.json',
      docsUrl: 'https://www.weatherapi.com/docs/',
      requiresAuth: true
    },
    {
      id: 'alphavantage',
      name: 'Alpha Vantage',
      description: 'Stock market data, forex, and cryptocurrencies',
      category: 'finance',
      url: 'https://www.alphavantage.co/query',
      docsUrl: 'https://www.alphavantage.co/documentation/',
      requiresAuth: true
    },
    {
      id: 'coingecko',
      name: 'CoinGecko API',
      description: 'Cryptocurrency market data',
      category: 'finance',
      url: 'https://api.coingecko.com/api/v3/coins/markets',
      docsUrl: 'https://www.coingecko.com/en/api/documentation',
      requiresAuth: false
    },
    {
      id: 'covid19api',
      name: 'COVID-19 API',
      description: 'Global COVID-19 statistics and historical data',
      category: 'covid',
      url: 'https://api.covid19api.com/summary',
      docsUrl: 'https://documenter.getpostman.com/view/10808728/SzS8rjbc',
      requiresAuth: false
    },
    {
      id: 'disease-sh',
      name: 'Disease.sh',
      description: 'Open COVID-19 and disease data API',
      category: 'covid',
      url: 'https://disease.sh/v3/covid-19/all',
      docsUrl: 'https://disease.sh/docs/',
      requiresAuth: false
    },
    {
      id: 'jsonplaceholder',
      name: 'JSONPlaceholder',
      description: 'Fake REST API for testing and prototyping',
      category: 'government',
      url: 'https://jsonplaceholder.typicode.com/posts',
      docsUrl: 'https://jsonplaceholder.typicode.com/',
      requiresAuth: false
    },
    {
      id: 'randomuser',
      name: 'RandomUser API',
      description: 'Generate random user data for testing',
      category: 'social',
      url: 'https://randomuser.me/api/',
      docsUrl: 'https://randomuser.me/documentation',
      requiresAuth: false
    },
    {
      id: 'restcountries',
      name: 'REST Countries',
      description: 'Country information including languages, currencies, flags',
      category: 'government',
      url: 'https://restcountries.com/v3.1/all',
      docsUrl: 'https://restcountries.com/',
      requiresAuth: false
    },
    {
      id: 'exchangerate',
      name: 'Exchange Rate API',
      description: 'Currency exchange rates',
      category: 'finance',
      url: 'https://api.exchangerate-api.com/v4/latest/USD',
      docsUrl: 'https://www.exchangerate-api.com/docs/overview',
      requiresAuth: false
    }
  ];

  constructor(private http: HttpClient) {
    this.loadSavedDataSources();
  }

  // Test API connection
  testConnection(dataSource: Partial<ApiDataSource>): Observable<ApiConnectionResult> {
    const startTime = Date.now();
    
    let headers = new HttpHeaders();
    
    // Add custom headers
    if (dataSource.headers) {
      dataSource.headers.forEach(h => {
        if (h.key && h.value) {
          headers = headers.set(h.key, h.value);
        }
      });
    }
    
    // Add authentication
    if (dataSource.authToken && dataSource.authType) {
      switch (dataSource.authType) {
        case 'bearer':
          headers = headers.set('Authorization', `Bearer ${dataSource.authToken}`);
          break;
        case 'api-key':
          headers = headers.set('X-API-Key', dataSource.authToken);
          break;
        case 'basic':
          headers = headers.set('Authorization', `Basic ${btoa(dataSource.authToken)}`);
          break;
      }
    }
    
    let params = new HttpParams();
    if (dataSource.params) {
      dataSource.params.forEach(p => {
        if (p.key && p.value) {
          params = params.set(p.key, p.value);
        }
      });
    }

    return this.http.request(
      dataSource.method || 'GET',
      dataSource.url || '',
      {
        headers,
        params,
        observe: 'response'
      }
    ).pipe(
      map(response => {
        const responseTime = Date.now() - startTime;
        const data = response.body;
        const recordCount = this.countRecords(data);
        
        const result: ApiConnectionResult = {
          success: true,
          data,
          statusCode: response.status,
          responseTime,
          recordCount
        };
        
        this.addToHistory(result);
        return result;
      }),
      catchError(error => {
        const responseTime = Date.now() - startTime;
        const result: ApiConnectionResult = {
          success: false,
          data: null,
          error: error.message || 'Connection failed',
          statusCode: error.status,
          responseTime
        };
        
        this.addToHistory(result);
        return of(result);
      })
    );
  }

  // Save data source
  saveDataSource(dataSource: Partial<ApiDataSource>): Observable<ApiDataSource> {
    const newSource: ApiDataSource = {
      id: dataSource.id || this.generateId(),
      name: dataSource.name || 'Untitled Data Source',
      url: dataSource.url || '',
      method: dataSource.method || 'GET',
      headers: dataSource.headers || [],
      params: dataSource.params || [],
      authToken: dataSource.authToken,
      authType: dataSource.authType,
      createdAt: dataSource.createdAt || new Date(),
      category: dataSource.category || 'custom',
      description: dataSource.description
    };

    const currentSources = this.dataSourcesSubject.value;
    const existingIndex = currentSources.findIndex(s => s.id === newSource.id);
    
    if (existingIndex >= 0) {
      currentSources[existingIndex] = newSource;
    } else {
      currentSources.push(newSource);
    }
    
    this.dataSourcesSubject.next([...currentSources]);
    this.saveDataSourcesToStorage();
    
    return of(newSource);
  }

  // Delete data source
  deleteDataSource(id: string): void {
    const currentSources = this.dataSourcesSubject.value;
    const filtered = currentSources.filter(s => s.id !== id);
    this.dataSourcesSubject.next(filtered);
    this.saveDataSourcesToStorage();
  }

  // Get data source by ID
  getDataSource(id: string): ApiDataSource | undefined {
    return this.dataSourcesSubject.value.find(s => s.id === id);
  }

  // Fetch data from saved source
  fetchFromSource(id: string): Observable<ApiConnectionResult> {
    const source = this.getDataSource(id);
    if (!source) {
      return of({
        success: false,
        data: null,
        error: 'Data source not found'
      });
    }
    
    return this.testConnection(source).pipe(
      tap(result => {
        if (result.success) {
          const sources = this.dataSourcesSubject.value;
          const index = sources.findIndex(s => s.id === id);
          if (index >= 0) {
            sources[index].lastFetched = new Date();
            this.dataSourcesSubject.next([...sources]);
            this.saveDataSourcesToStorage();
          }
        }
      })
    );
  }

  // Convert API data to CSV format
  convertToCSV(data: any): string {
    if (!data) return '';
    
    let dataArray: any[] = [];
    
    if (Array.isArray(data)) {
      dataArray = data;
    } else if (typeof data === 'object') {
      // Try to find an array in the response
      const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
      if (arrayKey) {
        dataArray = data[arrayKey];
      } else {
        dataArray = [data];
      }
    }
    
    if (dataArray.length === 0) return '';
    
    const headers = Object.keys(dataArray[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of dataArray) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  // Get public datasets by category
  getPublicDatasetsByCategory(category: string): PublicDataset[] {
    if (category === 'all') return this.publicDatasets;
    return this.publicDatasets.filter(d => d.category === category);
  }

  // Private helper methods
  private generateId(): string {
    return 'api-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
  }

  private countRecords(data: any): number {
    if (!data) return 0;
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'object') {
      const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
      if (arrayKey) return data[arrayKey].length;
      return 1;
    }
    return 0;
  }

  private addToHistory(result: ApiConnectionResult): void {
    const history = this.connectionHistorySubject.value;
    history.unshift(result);
    if (history.length > 50) {
      history.pop();
    }
    this.connectionHistorySubject.next(history);
  }

  private saveDataSourcesToStorage(): void {
    try {
      const sources = this.dataSourcesSubject.value;
      localStorage.setItem('apiDataSources', JSON.stringify(sources));
    } catch (e) {
      console.error('Failed to save data sources:', e);
    }
  }

  private loadSavedDataSources(): void {
    try {
      const saved = localStorage.getItem('apiDataSources');
      if (saved) {
        const sources = JSON.parse(saved);
        this.dataSourcesSubject.next(sources);
      }
    } catch (e) {
      console.error('Failed to load data sources:', e);
    }
  }
}
