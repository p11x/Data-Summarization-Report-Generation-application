import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { VisualizationGeneratorService, GeneratedVisualization } from '../../services/visualization-generator.service';
import { VisualizationExportService, ExportConfig } from '../../services/visualization-export.service';

@Component({
  selector: 'app-visualization-download',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visualization-download.component.html',
  styleUrls: ['./visualization-download.component.css']
})
export class VisualizationDownloadComponent implements OnInit, OnDestroy {
  visualizations: GeneratedVisualization[] = [];
  selectedIds: string[] = [];
  isExporting = false;
  exportFormat: 'png' | 'pdf' | 'pptx' | 'excel' = 'pdf';
  includeTitle = true;
  includeInsights = true;
  
  private destroy$ = new Subject<void>();

  constructor(
    private vizGenerator: VisualizationGeneratorService,
    private exportService: VisualizationExportService,
    private router: Router
  ) {}

  ngOnInit() {
    this.vizGenerator.visualizations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(viz => {
        this.visualizations = viz;
        // Select all by default
        if (this.selectedIds.length === 0 && viz.length > 0) {
          this.selectedIds = viz.map(v => v.id);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSelection(id: string) {
    const index = this.selectedIds.indexOf(id);
    if (index > -1) {
      this.selectedIds.splice(index, 1);
    } else {
      this.selectedIds.push(id);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedIds.includes(id);
  }

  selectAll() {
    this.selectedIds = this.visualizations.map(v => v.id);
  }

  deselectAll() {
    this.selectedIds = [];
  }

  async exportVisualizations() {
    if (this.selectedIds.length === 0) {
      alert('Please select at least one visualization to export');
      return;
    }

    this.isExporting = true;

    try {
      const config: ExportConfig = {
        format: this.exportFormat,
        selectedVisualizations: this.selectedIds,
        includeTitle: this.includeTitle,
        includeInsights: this.includeInsights,
        quality: 'high'
      };

      const blob = await this.exportService.exportVisualizations(this.visualizations, config);
      const filename = this.exportService.generateExportFilename(this.exportFormat);
      this.exportService.downloadExport(blob, filename);

      alert('Export completed successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export. Please try again.');
    } finally {
      this.isExporting = false;
    }
  }

  goToDashboard() {
    this.router.navigate(['/visualization-dashboard']);
  }

  goBack() {
    this.router.navigate(['/visualization-dashboard']);
  }

  getChartTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'bar': '📊',
      'line': '📈',
      'pie': '🥧',
      'area': '📉',
      'scatter': '⚡',
      'histogram': '📊',
      'heatmap': '🔥',
      'bubble': '⭕',
      'tree-map': '🌳',
      'correlation-matrix': '🔗',
      'trend': '📈',
      'cluster': '🎯',
      'time-series': '📅',
      'multi-axis': '🔄'
    };
    return icons[type] || '📊';
  }

  getSelectedCount(): number {
    return this.selectedIds.length;
  }
}
