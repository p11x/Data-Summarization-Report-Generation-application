import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AdvancedAnalyticsService } from '../services/advanced-analytics.service';
import { DataAnalysisService } from '../services/data-analysis.service';

@Component({
  selector: 'app-semantic-search',
  template: `
    <div class="search-container">
      <header class="page-header">
        <div class="header-left">
          <button class="back-btn" (click)="goBack()">← Back</button>
          <div class="header-title">
            <h1>🔎 Semantic Search</h1>
            <p class="subtitle">Query your data using natural language</p>
          </div>
        </div>
      </header>

      <div class="search-content">
        <div class="search-form">
          <div class="form-card">
            <h2>Ask Your Data</h2>
            
            <div class="search-box">
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                placeholder="e.g., Show months where profit was low"
                (keyup.enter)="search()"
              />
              <button class="search-btn" (click)="search()" [disabled]="isSearching">
                {{ isSearching ? 'Searching...' : '🔍 Search' }}
              </button>
            </div>

            <div class="suggestions">
              <span class="label">Try:</span>
              <button *ngFor="let suggestion of suggestions" 
                (click)="searchQuery = suggestion; search()"
                class="suggestion-btn">
                {{ suggestion }}
              </button>
            </div>
          </div>
        </div>

        <div class="results-section" *ngIf="searchResults">
          <div class="results-header">
            <h3>📊 Results</h3>
            <span class="result-count">{{ searchResults.totalCount }} records found</span>
          </div>

          <div class="sql-preview" *ngIf="searchResults.generatedSql">
            <span class="label">Generated Query:</span>
            <code>{{ searchResults.generatedSql }}</code>
          </div>

          <div class="explanation" *ngIf="searchResults.explanation">
            <span class="label">Analysis:</span>
            <p>{{ searchResults.explanation }}</p>
          </div>

          <div class="results-table" *ngIf="searchResults.results && searchResults.results.length > 0">
            <div class="table-header">
              <span *ngFor="let col of resultColumns">{{ col }}</span>
            </div>
            <div *ngFor="let row of searchResults.results.slice(0, 20)" class="table-row">
              <span *ngFor="let col of resultColumns">{{ row[col] }}</span>
            </div>
          </div>

          <div class="no-results" *ngIf="!searchResults.results || searchResults.results.length === 0">
            <p>No matching records found</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-container { min-height: 100vh; background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%); }
    .page-header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 1.5rem 2rem; }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .back-btn { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; }
    .header-title h1 { margin: 0; font-size: 1.5rem; }
    .subtitle { margin: 0.25rem 0 0 0; color: rgba(255,255,255,0.7); font-size: 0.85rem; }
    .search-content { padding: 2rem; max-width: 1000px; margin: 0 auto; }
    .form-card { background: white; padding: 2rem; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .form-card h2 { margin: 0 0 1.5rem 0; color: #1a1a2e; text-align: center; }
    .search-box { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .search-box input { flex: 1; padding: 1rem; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 1rem; }
    .search-box input:focus { outline: none; border-color: #667eea; }
    .search-btn { padding: 1rem 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; }
    .search-btn:disabled { opacity: 0.6; }
    .suggestions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
    .suggestions .label { color: #6b7280; font-size: 0.9rem; }
    .suggestion-btn { padding: 0.5rem 1rem; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 0.85rem; cursor: pointer; }
    .suggestion-btn:hover { background: #e5e7eb; }
    .results-section { margin-top: 2rem; }
    .results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .results-header h3 { margin: 0; color: #1a1a2e; }
    .result-count { color: #6b7280; }
    .sql-preview, .explanation { background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .sql-preview .label, .explanation .label { display: block; color: #6b7280; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .sql-preview code { display: block; background: #f3f4f6; padding: 0.75rem; border-radius: 4px; font-family: monospace; font-size: 0.9rem; }
    .explanation p { margin: 0; color: #374151; }
    .results-table { background: white; border-radius: 12px; overflow: hidden; }
    .table-header, .table-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.5rem; padding: 0.75rem 1rem; }
    .table-header { background: #f3f4f6; font-weight: 600; color: #374151; }
    .table-row { border-bottom: 1px solid #e5e7eb; font-size: 0.9rem; }
    .no-results { text-align: center; padding: 2rem; color: #6b7280; }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SemanticSearchComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  searchQuery: string = '';
  isSearching: boolean = false;
  searchResults: any = null;
  resultColumns: string[] = [];
  
  suggestions = [
    'Show months where sales were high',
    'Find rows where profit is above average',
    'Show data with low values',
    'Find maximum values'
  ];

  constructor(
    private router: Router,
    private analyticsService: AdvancedAnalyticsService,
    private dataService: DataAnalysisService
  ) {}

  ngOnInit() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  search() {
    if (!this.searchQuery.trim()) return;
    
    this.isSearching = true;
    this.searchResults = null;

    const fileData = this.dataService.getFileData();
    if (fileData && fileData.parsedData && fileData.parsedData.length > 0) {
      this.searchLocally(fileData.parsedData, this.searchQuery);
    } else {
      this.analyticsService.semanticSearch(1, this.searchQuery)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (results) => {
            this.searchResults = results;
            if (results.results && results.results.length > 0) {
              this.resultColumns = Object.keys(results.results[0]);
            }
            this.isSearching = false;
          },
          error: () => {
            this.isSearching = false;
          }
        });
    }
  }

  searchLocally(data: any[], query: string) {
    const lowerQuery = query.toLowerCase();
    const columns = Object.keys(data[0] || {});
    let filtered = [...data];

    columns.forEach(col => {
      const values = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
      if (values.length === 0) return;
      
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
      
      if (lowerQuery.includes('high') || lowerQuery.includes('above')) {
        filtered = filtered.filter(r => parseFloat(r[col]) > median);
      } else if (lowerQuery.includes('low') || lowerQuery.includes('below')) {
        filtered = filtered.filter(r => parseFloat(r[col]) < median);
      }
    });

    this.searchResults = {
      results: filtered.slice(0, 50),
      totalCount: filtered.length,
      generatedSql: `SELECT * FROM data WHERE ... (${lowerQuery})`,
      explanation: `Applied filters based on: "${query}"`,
      filters: []
    };

    if (filtered.length > 0) {
      this.resultColumns = Object.keys(filtered[0]);
    }
    
    this.isSearching = false;
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
