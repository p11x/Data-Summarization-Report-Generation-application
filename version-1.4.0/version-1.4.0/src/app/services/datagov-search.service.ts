import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Dataset, DatasetSource, DatasetFormat } from './dataset-search.model';

/**
 * Data.gov Search Service
 * Handles searching datasets from US Data.gov open data portal
 * Uses Data.gov CKAN API
 */
@Injectable({
  providedIn: 'root'
})
export class DataGovSearchService {
  private readonly DATAGOV_API_BASE = 'https://catalog.data.gov/api/3/action';

  // Mock data for demonstration
  private mockDatasets: Dataset[] = [
    {
      id: 'datagov-001',
      title: 'U.S. Chronic Disease Indicators',
      description: 'CDC Chronic Disease Data Warehouse with 124 chronic disease indicators for all U.S. states and territories.',
      source: 'datagov' as DatasetSource,
      datasetUrl: 'https://data.cdc.gov/dataset/CDC-WONDER-Chronic-Disease-Indicator/q9bp-am9v',
      fileSize: '45 MB',
      rows: 250000,
      columns: 34,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://data.cdc.gov/api/views/q9bp-am9v/rows.csv?accessType=DOWNLOAD',
      license: 'Public Domain',
      tags: ['health', 'chronic disease', 'cdc'],
      lastUpdated: '2024-03-08',
      author: 'CDC'
    },
    {
      id: 'datagov-002',
      title: 'COVID-19 Cases and Deaths',
      description: 'COVID-19 case surveillance data including demographics, symptoms, and outcomes from public health departments.',
      source: 'datagov' as DatasetSource,
      datasetUrl: 'https://data.cdc.gov/dataset/COVID-19-Case-Surveillance-Public-Use-Data/vbim-akqf',
      fileSize: '120 MB',
      rows: 8500000,
      columns: 15,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://data.cdc.gov/api/views/vbim-akqf/rows.csv?accessType=DOWNLOAD',
      license: 'Public Domain',
      tags: ['covid', 'health', 'pandemic'],
      lastUpdated: '2024-03-10',
      author: 'CDC'
    },
    {
      id: 'datagov-003',
      title: 'National Emissions Inventory',
      description: 'EPA National Emissions Inventory for criteria air pollutants from various source categories.',
      source: 'datagov' as DatasetSource,
      datasetUrl: 'https://data.epa.gov/efservice/nad/0',
      fileSize: '85 MB',
      rows: 150000,
      columns: 45,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://data.epa.gov/efservice/nad/csv',
      license: 'Public Domain',
      tags: ['emissions', 'air quality', 'environment'],
      lastUpdated: '2024-01-15',
      author: 'EPA'
    },
    {
      id: 'datagov-004',
      title: 'U.S. County Population Estimates',
      description: 'Census Bureau annual population estimates for all U.S. counties by demographic characteristics.',
      source: 'datagov' as DatasetSource,
      datasetUrl: 'https://www.census.gov/data/datasets/time-series/demo/popest/counties/asrh.html',
      fileSize: '12 MB',
      rows: 3200,
      columns: 25,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://www2.census.gov/programs-surveys/popest/datasets/2010-2020/counties/asrh/cc-est2020-agesex-all.csv',
      license: 'Public Domain',
      tags: ['population', 'census', 'demographics'],
      lastUpdated: '2024-02-01',
      author: 'US Census Bureau'
    },
    {
      id: 'datagov-005',
      title: 'College Scorecard Data',
      description: 'Comprehensive data on college costs, graduation rates, student debt, and post-college earnings.',
      source: 'datagov' as DatasetSource,
      datasetUrl: 'https://eddata.github.io/CollegeScorecard/',
      fileSize: '180 MB',
      rows: 7700,
      columns: 200,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://eddata.github.io/CollegeScorecard/Raw%20Data/MERGED2017_18_PP.csv',
      license: 'Public Domain',
      tags: ['education', 'colleges', 'university'],
      lastUpdated: '2024-01-20',
      author: 'Department of Education'
    },
    {
      id: 'datagov-006',
      title: 'Air Quality Index Data',
      description: 'EPA Air Quality System data for criteria pollutants measured at monitoring stations nationwide.',
      source: 'datagov' as DatasetSource,
      datasetUrl: 'https://www.epa.gov/outdoor-air-quality-data',
      fileSize: '250 MB',
      rows: 15000000,
      columns: 20,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://aqs.epa.gov/aqsweb/airdata/daily_aqi_by_county_2023.csv',
      license: 'Public Domain',
      tags: ['air quality', 'environment', 'pollution'],
      lastUpdated: '2024-03-05',
      author: 'EPA'
    },
    {
      id: 'datagov-007',
      title: 'Medicare Hospital Quality',
      description: 'Hospital quality metrics from Medicare including patient experience, safety, and outcome measures.',
      source: 'datagov' as DatasetSource,
      datasetUrl: 'https://data.medicare.gov/dataset/Hospital-Compare',
      fileSize: '25 MB',
      rows: 4800,
      columns: 56,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://data.medicare.gov/views/b4i4-awsp/files/8f2c2048-ee0d-479f-b21d-1b2a2f1a2a2a',
      license: 'Public Domain',
      tags: ['healthcare', 'hospitals', 'medicare'],
      lastUpdated: '2024-02-15',
      author: 'CMS'
    },
    {
      id: 'datagov-008',
      title: 'FBI Crime Data',
      description: 'Uniform Crime Reporting (UCR) program data on crime statistics for law enforcement agencies.',
      source: 'datagov' as DatasetSource,
      datasetUrl: 'https://ucr.fbi.gov/crime-in-the-u.s',
      fileSize: '35 MB',
      rows: 18000,
      columns: 30,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://ucr.fbi.gov/crime-in-the-u.s/2019/table-8/table-8-state-cuts/table_8_offense_by_state_2019.csv',
      license: 'Public Domain',
      tags: ['crime', 'fbi', 'law enforcement'],
      lastUpdated: '2024-01-10',
      author: 'FBI'
    },
    {
      id: 'datagov-009',
      title: 'National Weather Service Data',
      description: 'NOAA National Weather Service historical data including temperature, precipitation, and severe weather.',
      source: 'datagov' as DatasetSource,
      datasetUrl: 'https://www.ncdc.noaa.gov/cdo-web/datasets',
      fileSize: '500 MB',
      rows: 25000000,
      columns: 15,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://www.ncdc.noaa.gov/cdo-web/datasets/global-summary-of-the-day/access/725030-94728-2023.csv',
      license: 'Public Domain',
      tags: ['weather', 'climate', 'noaa'],
      lastUpdated: '2024-03-01',
      author: 'NOAA'
    },
    {
      id: 'datagov-010',
      title: 'Federal Contracts Spending',
      description: 'USAspending.gov data on federal contract awards including contractor details and spending amounts.',
      source: 'datagov' as DatasetSource,
      datasetUrl: 'https://www.usaspending.gov/search/',
      fileSize: '2.5 GB',
      rows: 15000000,
      columns: 80,
      format: 'csv' as DatasetFormat,
      downloadUrl: 'https://download.usaspending.gov/award_data_archive/PrimeAwards_2023_0.csv.zip',
      license: 'Public Domain',
      tags: ['contracts', 'federal', 'spending'],
      lastUpdated: '2024-02-28',
      author: 'Treasury'
    }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Search for datasets on Data.gov using CKAN API
   */
  search(query: string, limit: number = 20): Observable<Dataset[]> {
    if (!query || query.trim() === '') {
      return of([]);
    }

    console.log('[DataGovService] Searching for:', query);
    
    // Use CKAN API package_search endpoint
    const searchUrl = `${this.DATAGOV_API_BASE}/package_search?q=${encodeURIComponent(query)}&rows=${limit}`;
    
    return this.http.get<any>(searchUrl).pipe(
      map(response => {
        console.log('[DataGovService] API Response:', response);
        
        if (!response || !response.result || !response.result.results) {
          return this.getFallbackDatasets(query, limit);
        }
        
        const datasets = response.result.results
          .filter((item: any) => this.hasValidResources(item))
          .slice(0, limit)
          .map((item: any) => this.mapDataGovDataset(item));
        
        console.log('[DataGovService] Mapped datasets:', datasets.length);
        
        return datasets.length > 0 ? datasets : this.getFallbackDatasets(query, limit);
      }),
      catchError(error => {
        console.error('[DataGovService] API Error:', error);
        return of(this.getFallbackDatasets(query, limit));
      })
    );
  }

  /**
   * Check if dataset has valid resources (CSV)
   */
  private hasValidResources(item: any): boolean {
    const resources = item.resources || [];
    return resources.some((r: any) => {
      const format = r.format?.toLowerCase() || '';
      return format === 'csv' || format === 'xlsx' || format === 'json';
    });
  }

  /**
   * Map Data.gov dataset to our Dataset interface
   */
  private mapDataGovDataset(item: any): Dataset {
    const resources = item.resources || [];
    const primaryResource = resources.find((r: any) => {
      const format = r.format?.toLowerCase() || '';
      return format === 'csv' || format === 'xlsx' || format === 'json';
    }) || resources[0];

    return {
      id: `datagov-${item.id}`,
      title: item.title || item.name,
      description: item.notes || item.description || '',
      source: 'datagov' as DatasetSource,
      datasetUrl: item.url || `https://catalog.data.gov/dataset/${item.name}`,
      fileSize: primaryResource?.size ? this.formatFileSize(primaryResource.size) : 'Unknown',
      rows: 0,
      columns: 0,
      format: this.inferFormat(primaryResource?.format),
      downloadUrl: primaryResource?.url,
      license: item.license_title || 'Public Domain',
      tags: item.tags?.map((t: any) => t.display_name || t.name || t).filter(Boolean),
      lastUpdated: item.metadata_modified || item.updated,
      author: item.organization?.title || item.owner_org
    };
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Fallback datasets when API fails or returns no results
   */
  private getFallbackDatasets(query: string, limit: number): Dataset[] {
    console.log('[DataGovService] Using fallback datasets for query:', query);
    
    const fallbackDatasets: Dataset[] = [
      {
        id: 'datagov-fallback-1',
        title: 'U.S. Chronic Disease Indicators',
        description: 'CDC Chronic Disease Data Warehouse with 124 chronic disease indicators',
        source: 'datagov' as DatasetSource,
        datasetUrl: 'https://data.cdc.gov/dataset/CDC-WONDER-Chronic-Disease-Indicator/q9bp-am9v',
        fileSize: '45 MB',
        rows: 250000,
        columns: 34,
        format: 'csv' as DatasetFormat,
        downloadUrl: 'https://data.cdc.gov/api/views/q9bp-am9v/rows.csv?accessType=DOWNLOAD',
        license: 'Public Domain',
        tags: ['health', 'chronic disease', 'cdc'],
        lastUpdated: '2024-03-08',
        author: 'CDC'
      },
      {
        id: 'datagov-fallback-2',
        title: 'COVID-19 Case Surveillance',
        description: 'COVID-19 case surveillance data from CDC',
        source: 'datagov' as DatasetSource,
        datasetUrl: 'https://data.cdc.gov/dataset/COVID-19-Case-Surveillance-Public-Use-Data/vbim-akqf',
        fileSize: '120 MB',
        rows: 8500000,
        columns: 15,
        format: 'csv' as DatasetFormat,
        downloadUrl: 'https://data.cdc.gov/api/views/vbim-akqf/rows.csv?accessType=DOWNLOAD',
        license: 'Public Domain',
        tags: ['covid', 'health', 'pandemic'],
        lastUpdated: '2024-03-10',
        author: 'CDC'
      },
      {
        id: 'datagov-fallback-3',
        title: 'U.S. County Population Estimates',
        description: 'Census Bureau annual population estimates for all U.S. counties',
        source: 'datagov' as DatasetSource,
        datasetUrl: 'https://www.census.gov/data/datasets/time-series/demo/popest/counties/asrh.html',
        fileSize: '12 MB',
        rows: 3200,
        columns: 25,
        format: 'csv' as DatasetFormat,
        downloadUrl: 'https://www2.census.gov/programs-surveys/popest/datasets/2010-2020/counties/asrh/cc-est2020-agesex-all.csv',
        license: 'Public Domain',
        tags: ['population', 'census', 'demographics'],
        lastUpdated: '2024-02-01',
        author: 'US Census Bureau'
      },
      {
        id: 'datagov-fallback-4',
        title: 'College Scorecard Data',
        description: 'Comprehensive data on college costs, graduation rates, and earnings',
        source: 'datagov' as DatasetSource,
        datasetUrl: 'https://eddata.github.io/CollegeScorecard/',
        fileSize: '180 MB',
        rows: 7700,
        columns: 200,
        format: 'csv' as DatasetFormat,
        downloadUrl: 'https://eddata.github.io/CollegeScorecard/Raw%20Data/MERGED2017_18_PP.csv',
        license: 'Public Domain',
        tags: ['education', 'colleges', 'university'],
        lastUpdated: '2024-01-20',
        author: 'Department of Education'
      },
      {
        id: 'datagov-fallback-5',
        title: 'Air Quality Index Data',
        description: 'EPA Air Quality System data for criteria pollutants',
        source: 'datagov' as DatasetSource,
        datasetUrl: 'https://www.epa.gov/outdoor-air-quality-data',
        fileSize: '250 MB',
        rows: 15000000,
        columns: 20,
        format: 'csv' as DatasetFormat,
        downloadUrl: 'https://aqs.epa.gov/aqsweb/airdata/daily_aqi_by_county_2023.csv',
        license: 'Public Domain',
        tags: ['air quality', 'environment', 'pollution'],
        lastUpdated: '2024-03-05',
        author: 'EPA'
      }
    ];

    // Filter by query if provided
    const queryLower = query.toLowerCase();
    if (queryLower) {
      return fallbackDatasets.filter(d => 
        d.title.toLowerCase().includes(queryLower) ||
        d.description.toLowerCase().includes(queryLower) ||
        d.tags?.some(tag => tag.toLowerCase().includes(queryLower))
      ).slice(0, limit);
    }
    
    return fallbackDatasets.slice(0, limit);
  }

  /**
   * Get dataset details by ID
   */
  getDatasetById(id: string): Observable<Dataset | null> {
    const dataset = this.mockDatasets.find(d => d.id === id);
    return of(dataset || null);
  }

  /**
   * Infer dataset format from file format string
   */
  private inferFormat(format: string | undefined): DatasetFormat {
    if (!format) return 'csv';
    const f = format.toLowerCase();
    if (f === 'csv') return 'csv';
    if (f.includes('xls')) return 'xlsx';
    if (f === 'json') return 'json';
    if (f === 'xml') return 'xml';
    return 'csv';
  }
}
