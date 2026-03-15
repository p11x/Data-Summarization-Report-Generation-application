import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { DatasetParserService, ParsedDataset } from '../../../ai-assistant/services/dataset-parser.service';
import { VisualizationGeneratorService, GeneratedVisualization, FilterConfig } from '../../services/visualization-generator.service';
import { VisualizationChartCardComponent } from '../../components/visualization-chart-card/visualization-chart-card.component';
import { VisualizationFilterPanelComponent } from '../../components/visualization-filter-panel/visualization-filter-panel.component';

@Component({
  selector: 'app-visualization-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, VisualizationChartCardComponent, VisualizationFilterPanelComponent],
  templateUrl: './visualization-dashboard.component.html',
  styleUrls: ['./visualization-dashboard.component.css']
})
export class VisualizationDashboardComponent implements OnInit, OnDestroy {
  dataset: ParsedDataset | null = null;
  visualizations: GeneratedVisualization[] = [];
  filters: FilterConfig[] = [];
  isLoading = true;
  selectedVisualizations: string[] = [];
  showFilterPanel = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private datasetParser: DatasetParserService,
    private vizGenerator: VisualizationGeneratorService,
    private router: Router
  ) {}

  ngOnInit() {
    this.dataset = this.datasetParser.getCurrentDataset();
    
    if (!this.dataset) {
      this.router.navigate(['/visualization-upload']);
      return;
    }

    this.loadVisualizations();
    
    this.vizGenerator.visualizations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(viz => this.visualizations = viz);
      
    this.vizGenerator.filters$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => this.filters = filters);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadVisualizations() {
    this.isLoading = true;
    try {
      await this.vizGenerator.generateAllVisualizations(this.dataset!);
    } catch (error) {
      console.error('Error generating visualizations:', error);
    } finally {
      this.isLoading = false;
    }
  }

  refreshVisualizations() {
    this.loadVisualizations();
  }

  goToDownload() {
    this.router.navigate(['/visualization-download']);
  }

  goToUpload() {
    this.router.navigate(['/visualization-upload']);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  toggleFilterPanel() {
    this.showFilterPanel = !this.showFilterPanel;
  }

  onFilterChange(filters: FilterConfig[]) {
    filters.forEach(f => this.vizGenerator.addFilter(f));
  }

  toggleVisualizationSelection(id: string) {
    const index = this.selectedVisualizations.indexOf(id);
    if (index > -1) {
      this.selectedVisualizations.splice(index, 1);
    } else {
      this.selectedVisualizations.push(id);
    }
  }

  isVisualizationSelected(id: string): boolean {
    return this.selectedVisualizations.includes(id);
  }

  getVisualizationCount(): number {
    return this.visualizations.length;
  }

  getBasicVizCount(): number {
    return this.visualizations.filter(v => 
      ['bar', 'line', 'pie', 'area', 'stacked-bar', 'column'].includes(v.config.type)
    ).length;
  }

  getIntermediateVizCount(): number {
    return this.visualizations.filter(v => 
      ['scatter', 'histogram', 'box-plot', 'heatmap', 'bubble', 'tree-map'].includes(v.config.type)
    ).length;
  }

  getAdvancedVizCount(): number {
    return this.visualizations.filter(v => 
      ['correlation-matrix', 'trend', 'distribution', 'cluster', 'time-series', 'multi-axis'].includes(v.config.type)
    ).length;
  }

  getNumericColumns(): string[] {
    if (!this.dataset) return [];
    return Object.entries(this.dataset.metadata.columnTypes)
      .filter(([_, type]) => type === 'integer' || type === 'float')
      .map(([name]) => name);
  }

  getCategoricalColumns(): string[] {
    if (!this.dataset) return [];
    return this.dataset.metadata.columnNames.filter(col => 
      this.dataset!.metadata.columnTypes[col] === 'string'
    );
  }

  clearDataset() {
    this.vizGenerator.clearVisualizations();
    this.datasetParser.clearDataset();
    this.router.navigate(['/visualization-upload']);
  }
}
