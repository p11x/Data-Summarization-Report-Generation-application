import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AdvancedAnalyticsService } from '../services/advanced-analytics.service';
import { DataAnalysisService } from '../services/data-analysis.service';

interface Scenario {
  id: number;
  name: string;
  base_values: any;
  modified_values: any;
  results: any;
  is_baseline: boolean;
}

@Component({
  selector: 'app-what-if-analysis',
  templateUrl: './what-if-analysis.component.html',
  styleUrls: ['./what-if-analysis.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class WhatIfAnalysisComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  data: any[] = [];
  columns: string[] = [];
  
  scenarios: Scenario[] = [];
  selectedScenarios: number[] = [];
  isComparing: boolean = false;
  
  scenarioName: string = '';
  modifications: Record<string, number> = {};
  
  isCalculating: boolean = false;
  comparisonResults: any = null;
  
  constructor(
    private router: Router,
    private analyticsService: AdvancedAnalyticsService,
    private dataService: DataAnalysisService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    const fileData = this.dataService.getFileData();
    if (fileData && fileData.parsedData && fileData.parsedData.length > 0) {
      this.data = fileData.parsedData;
      this.columns = Object.keys(this.data[0] || {});
      
      this.columns.forEach(col => {
        const sampleValue = parseFloat(this.data[0][col]);
        if (!isNaN(sampleValue)) {
          this.modifications[col] = sampleValue;
        }
      });
    }
  }

  calculateResults(baseValues: Record<string, number>, modifiedValues: Record<string, number>) {
    const results: Record<string, any> = {};
    
    Object.keys(modifiedValues).forEach(key => {
      const base = baseValues[key] || 0;
      const modified = modifiedValues[key];
      const change = modified - base;
      const percentChange = base !== 0 ? (change / Math.abs(base)) * 100 : 0;
      
      results[key] = {
        base,
        modified,
        change,
        percentChange
      };
    });

    return results;
  }

  createScenario() {
    if (!this.scenarioName || Object.keys(this.modifications).length === 0) {
      return;
    }

    this.isCalculating = true;

    const baseValues: Record<string, number> = {};
    const modifiedValues: Record<string, number> = {};

    this.columns.forEach(col => {
      const values = this.data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
      if (values.length > 0) {
        baseValues[col] = values.reduce((a, b) => a + b, 0) / values.length;
        modifiedValues[col] = this.modifications[col] || baseValues[col];
      }
    });

    const scenario: Scenario = {
      id: Date.now(),
      name: this.scenarioName,
      base_values: baseValues,
      modified_values: modifiedValues,
      results: this.calculateResults(baseValues, modifiedValues),
      is_baseline: this.scenarios.length === 0
    };

    this.scenarios.push(scenario);
    this.scenarioName = '';
    this.isCalculating = false;
  }

  compareScenarios() {
    if (this.selectedScenarios.length < 2) {
      return;
    }

    this.isComparing = true;
    
    const selected = this.scenarios.filter(s => this.selectedScenarios.includes(s.id));
    
    const comparison: any = {
      scenarios: selected.map(s => ({
        id: s.id,
        name: s.name,
        isBaseline: s.is_baseline,
        results: s.results
      }))
    };

    const allColumns = new Set<string>();
    selected.forEach(s => {
      Object.keys(s.modified_values).forEach(col => allColumns.add(col));
    });

    comparison.impact = Array.from(allColumns).map((col: string) => {
      const baseline = selected.find(s => s.is_baseline);
      const impacts = selected.map(s => ({
        name: s.name,
        change: s.modified_values[col] - (baseline?.base_values[col] || 0),
        percentChange: baseline?.base_values[col] 
          ? ((s.modified_values[col] - baseline.base_values[col]) / Math.abs(baseline.base_values[col])) * 100
          : 0
      }));
      return { column: col, impacts };
    });

    this.comparisonResults = comparison;
    this.isComparing = false;
  }

  toggleScenario(id: number) {
    const index = this.selectedScenarios.indexOf(id);
    if (index > -1) {
      this.selectedScenarios.splice(index, 1);
    } else {
      this.selectedScenarios.push(id);
    }
  }

  deleteScenario(id: number) {
    this.scenarios = this.scenarios.filter(s => s.id !== id);
    this.selectedScenarios = this.selectedScenarios.filter(sid => sid !== id);
    if (this.comparisonResults) {
      this.comparisonResults = null;
    }
  }

  getChangeClass(change: number): string {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  }

  getResultKeys(results: any): string[] {
    return results ? Object.keys(results).slice(0, 5) : [];
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
