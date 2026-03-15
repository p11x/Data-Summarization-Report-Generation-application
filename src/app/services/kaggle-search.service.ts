import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { Dataset, DatasetSource, DatasetFormat } from './dataset-search.model';

/**
 * Kaggle Search Service
 * Handles searching datasets from Kaggle API
 * Note: Kaggle API requires authentication. This service uses public endpoints
 * and returns mock data for demonstration. In production, use a backend proxy.
 */
@Injectable({
  providedIn: 'root'
})
export class KaggleSearchService {
  private readonly KAGGLE_API_BASE = 'https://www.kaggle.com/api/v1/datasets/list';
  
  // Mock data for demonstration when API is not available
  private mockDatasets: Dataset[] = [
    {
      id: 'kaggle-001',
      title: 'Global Climate Change Data',
      description: 'Comprehensive global temperature and climate data from 1900 to present. Includes temperature anomalies, CO2 emissions, and sea level measurements.',
      source: 'kaggle' as DatasetSource,
      datasetUrl: 'https://www.kaggle.com/datasets/berkeleyearth/climate-change-earth-surface-temperature-data',
      fileSize: '45.2 MB',
      rows: 125842,
      columns: 18,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://www.kaggle.com/datasets/berkeleyearth/climate-change-earth-surface-temperature-data/download',
      license: 'CC BY-SA 4.0',
      tags: ['climate', 'environment', 'temperature'],
      lastUpdated: '2024-01-15',
      author: 'Berkeley Earth'
    },
    {
      id: 'kaggle-002',
      title: 'COVID-19 Global Data',
      description: 'Daily updated COVID-19 cases, deaths, and vaccinations worldwide. Includes time series data and demographic information.',
      source: 'kaggle' as DatasetSource,
      datasetUrl: 'https://www.kaggle.com/datasets/imdevskp/corona-virus-report',
      fileSize: '12.8 MB',
      rows: 58484,
      columns: 25,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://www.kaggle.com/datasets/imdevskp/corona-virus-report/download',
      license: 'MIT',
      tags: ['covid', 'health', 'pandemic'],
      lastUpdated: '2023-12-01',
      author: 'Devakumar KP'
    },
    {
      id: 'kaggle-003',
      title: 'Sales Data - Superstore',
      description: 'Complete sales transaction data from a global superstore. Includes customer segments, product categories, and regional performance.',
      source: 'kaggle' as DatasetSource,
      datasetUrl: 'https://www.kaggle.com/datasets/jmiranda9117/superstore-sales',
      fileSize: '4.2 MB',
      rows: 9994,
      columns: 21,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://www.kaggle.com/datasets/jmiranda9117/superstore-sales/download',
      license: 'CC BY-NC-SA 4.0',
      tags: ['sales', 'retail', 'business'],
      lastUpdated: '2024-02-20',
      author: 'Jorge Miranda'
    },
    {
      id: 'kaggle-004',
      title: 'World Population Data',
      description: 'Historical and projected population data for all countries. Includes demographic indicators like birth rate, death rate, and median age.',
      source: 'kaggle' as DatasetSource,
      datasetUrl: 'https://www.kaggle.com/datasets/iamsouravbanerjee/world-population-dataset',
      fileSize: '2.1 MB',
      rows: 234,
      columns: 15,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://www.kaggle.com/datasets/iamsouravbanerjee/world-population-dataset/download',
      license: 'CC BY 4.0',
      tags: ['population', 'demographics', 'world'],
      lastUpdated: '2024-03-01',
      author: 'Sourav Banerjee'
    },
    {
      id: 'kaggle-005',
      title: 'Iris Flower Dataset',
      description: 'Classic machine learning dataset containing measurements for iris flowers. Perfect for classification and clustering algorithms.',
      source: 'kaggle' as DatasetSource,
      datasetUrl: 'https://www.kaggle.com/datasets/uciml/iris',
      fileSize: '5 KB',
      rows: 150,
      columns: 5,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://www.kaggle.com/datasets/uciml/iris/download',
      license: 'CC BY 4.0',
      tags: ['machine learning', 'classification', 'flowers'],
      lastUpdated: '2023-11-10',
      author: 'UCI Machine Learning'
    },
    {
      id: 'kaggle-006',
      title: 'Titanic Dataset',
      description: 'Passenger data from the Titanic disaster. Includes demographics, cabin class, and survival status. Classic ML benchmark dataset.',
      source: 'kaggle' as DatasetSource,
      datasetUrl: 'https://www.kaggle.com/datasets/hesh97/titanicdataset-traincsv',
      fileSize: '60 KB',
      rows: 891,
      columns: 12,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://www.kaggle.com/datasets/hesh97/titanicdataset-traincsv/download',
      license: 'CC BY 4.0',
      tags: ['machine learning', 'classification', 'history'],
      lastUpdated: '2023-10-05',
      author: 'Hesh'
    },
    {
      id: 'kaggle-007',
      title: 'Retail Transactions Dataset',
      description: 'Large-scale retail transaction data from multiple stores. Includes product details, pricing, and customer information.',
      source: 'kaggle' as DatasetSource,
      datasetUrl: 'https://www.kaggle.com/datasets/b衡量aichatterjee/retail-transactions-dataset',
      fileSize: '156 MB',
      rows: 1000000,
      columns: 10,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://www.kaggle.com/datasets/b衡量aichatterjee/retail-transactions-dataset/download',
      license: 'CC BY-NC-SA 4.0',
      tags: ['retail', 'transactions', 'e-commerce'],
      lastUpdated: '2024-01-25',
      author: 'AI Chatterjee'
    },
    {
      id: 'kaggle-008',
      title: 'Financial Market Data',
      description: 'Historical stock prices, trading volumes, and market indicators for major exchanges worldwide.',
      source: 'kaggle' as DatasetSource,
      datasetUrl: 'https://www.kaggle.com/datasets/borismarjanovic/price-volume-data-for-all-us-stocks-etfs',
      fileSize: '2.3 GB',
      rows: 50000000,
      columns: 8,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://www.kaggle.com/datasets/borismarjanovic/price-volume-data-for-all-us-stocks-etfs/download',
      license: 'CC BY-SA 4.0',
      tags: ['finance', 'stocks', 'trading'],
      lastUpdated: '2024-02-28',
      author: 'Boris Marjanovic'
    },
    {
      id: 'kaggle-009',
      title: 'Movie Ratings Dataset',
      description: 'User movie ratings from MovieLens. Includes over 25 million ratings for 62,000 movies by 162,000 users.',
      source: 'kaggle' as DatasetSource,
      datasetUrl: 'https://www.kaggle.com/datasets/grouplens/movielens-20m-dataset',
      fileSize: '210 MB',
      rows: 20000000,
      columns: 6,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://www.kaggle.com/datasets/grouplens/movielens-20m-dataset/download',
      license: 'CC BY 4.0',
      tags: ['movies', 'recommendations', 'ratings'],
      lastUpdated: '2023-09-15',
      author: 'GroupLens'
    },
    {
      id: 'kaggle-010',
      title: 'Energy Consumption Data',
      description: 'Time series data on global energy consumption by source (solar, wind, fossil, nuclear) from 1965 to present.',
      source: 'kaggle' as DatasetSource,
      datasetUrl: 'https://www.kaggle.com/datasets/ulrikthygepedersen/energy-consumption',
      fileSize: '8.5 MB',
      rows: 15384,
      columns: 12,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://www.kaggle.com/datasets/ulrikthygepedersen/energy-consumption/download',
      license: 'CC BY 4.0',
      tags: ['energy', 'consumption', 'renewable'],
      lastUpdated: '2024-01-08',
      author: 'Ulrik Pedersen'
    }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Search for datasets on Kaggle
   * @param query Search keyword
   * @param limit Maximum number of results
   * @returns Observable of datasets array
   */
  search(query: string, limit: number = 20): Observable<Dataset[]> {
    if (!query || query.trim() === '') {
      return of([]);
    }

    const searchTerm = query.toLowerCase().trim();
    
    // Filter mock data based on search term
    const filteredDatasets = this.mockDatasets.filter(dataset => 
      dataset.title.toLowerCase().includes(searchTerm) ||
      dataset.description.toLowerCase().includes(searchTerm) ||
      dataset.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );

    // Return filtered results limited to requested count
    return of(filteredDatasets.slice(0, limit)).pipe(
      // In production, this would call the actual Kaggle API
      // For demo purposes, we use mock data
      // To use real API:
      // return this.http.get<any>(`${this.KAGGLE_API_BASE}?search=${encodeURIComponent(query)}&page_size=${limit}`, {
      //   headers: this.getHeaders()
      // }).pipe(
      //   map(response => this.transformKaggleResponse(response)),
      //   catchError(error => {
      //     console.error('Kaggle API error:', error);
      //     return of([]);
      //   })
      // );
    );
  }

  /**
   * Get dataset details by ID
   */
  getDatasetById(id: string): Observable<Dataset | null> {
    const dataset = this.mockDatasets.find(d => d.id === id);
    return of(dataset || null);
  }

  /**
   * Transform Kaggle API response to our Dataset format
   */
  private transformKaggleResponse(response: any): Dataset[] {
    if (!response || !response.data) {
      return [];
    }

    return response.data.map((item: any) => this.mapKaggleDataset(item));
  }

  /**
   * Map Kaggle dataset to our Dataset interface
   */
  private mapKaggleDataset(item: any): Dataset {
    return {
      id: `kaggle-${item.ref}`,
      title: item.title,
      description: item.description || '',
      source: 'kaggle' as DatasetSource,
      datasetUrl: `https://www.kaggle.com/datasets/${item.ref}`,
      fileSize: item.size || 'Unknown',
      rows: item.totalRows || 0,
      columns: item.totalColumns || 0,
      format: this.inferFormat(item.ref),
      downloadUrl: `https://www.kaggle.com/datasets/${item.ref}/download`,
      license: item.license?.name,
      tags: item.tags,
      lastUpdated: item.lastUpdated,
      author: item.ownerName
    };
  }

  /**
   * Infer dataset format from file extension
   */
  private inferFormat(ref: string): DatasetFormat {
    const ext = ref.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'csv': return 'csv';
      case 'xlsx':
      case 'xls': return 'xlsx';
      case 'json': return 'json';
      case 'xml': return 'xml';
      case 'parquet': return 'parquet';
      case 'sqlite': return 'sqlite';
      default: return 'csv';
    }
  }

  /**
   * Get HTTP headers for Kaggle API
   */
  private getHeaders(): HttpHeaders {
    // Note: In production, use a backend proxy to hide API keys
    // Kaggle requires authentication for API access
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }
}
