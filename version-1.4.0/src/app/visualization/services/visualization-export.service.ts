import { Injectable } from '@angular/core';
import { GeneratedVisualization } from './visualization-generator.service';

export interface ExportConfig {
  format: 'png' | 'pdf' | 'pptx' | 'excel';
  selectedVisualizations: string[];
  includeTitle: boolean;
  includeInsights: boolean;
  quality: 'low' | 'medium' | 'high';
}

@Injectable({
  providedIn: 'root'
})
export class VisualizationExportService {

  constructor() {}

  async exportVisualizations(
    visualizations: GeneratedVisualization[], 
    config: ExportConfig
  ): Promise<Blob> {
    const selected = visualizations.filter(v => config.selectedVisualizations.includes(v.id));
    
    switch (config.format) {
      case 'png':
        return this.exportAsPNG(selected);
      case 'pdf':
        return this.exportAsPDF(selected, config);
      case 'pptx':
        return this.exportAsPPTX(selected, config);
      case 'excel':
        return this.exportAsExcel(selected, config);
      default:
        throw new Error('Unsupported export format');
    }
  }

  private async exportAsPNG(visualizations: GeneratedVisualization[]): Promise<Blob> {
    let exportContent = 'VISUALIZATION EXPORT\n';
    exportContent += '=====================\n\n';
    
    visualizations.forEach((viz, index) => {
      exportContent += (index + 1) + '. ' + viz.config.title + '\n';
      exportContent += '   Type: ' + viz.config.type + '\n';
      exportContent += '   Insights: ' + viz.insights + '\n\n';
    });

    return new Blob([exportContent], { type: 'text/plain' });
  }

  private async exportAsPDF(visualizations: GeneratedVisualization[], config: ExportConfig): Promise<Blob> {
    let content = '';
    
    if (config.includeTitle) {
      content += '=====================================\n';
      content += '   DATA VISUALIZATION REPORT\n';
      content += '=====================================\n\n';
    }
    
    content += 'Generated: ' + new Date().toLocaleString() + '\n';
    content += 'Total Visualizations: ' + visualizations.length + '\n';
    content += '=====================================\n\n';
    
    visualizations.forEach((viz, index) => {
      content += (index + 1) + '. ' + viz.config.title + '\n';
      content += '   Type: ' + viz.config.type + '\n';
      content += '   Created: ' + new Date(viz.timestamp).toLocaleString() + '\n';
      
      if (config.includeInsights) {
        content += '   \n   Insights:\n   ' + viz.insights + '\n';
      }
      
      content += '\n-----------------------------------\n\n';
    });
    
    return new Blob([content], { type: 'text/plain' });
  }

  private async exportAsPPTX(visualizations: GeneratedVisualization[], config: ExportConfig): Promise<Blob> {
    let content = 'POWERPOINT VISUALIZATION REPORT\n';
    content += '==============================\n\n';
    
    visualizations.forEach((viz, index) => {
      content += 'Slide ' + (index + 1) + ': ' + viz.config.title + '\n';
      content += 'Chart Type: ' + viz.config.type + '\n';
      content += 'Description: ' + viz.insights + '\n\n';
    });
    
    return new Blob([content], { type: 'text/plain' });
  }

  private async exportAsExcel(visualizations: GeneratedVisualization[], config: ExportConfig): Promise<Blob> {
    let content = 'VISUALIZATION SUMMARY\n';
    content += 'Generated,' + new Date().toISOString() + '\n\n';
    
    content += 'ID,Type,Title,Insights,Timestamp\n';
    
    visualizations.forEach(viz => {
      const insights = viz.insights.replace(/,/g, ';').replace(/\n/g, ' ');
      content += viz.id + ',' + viz.config.type + ',"' + viz.config.title + '","' + insights + '",' + viz.timestamp.toISOString() + '\n';
    });
    
    content += '\n\nCHART DATA\n';
    content += '=========\n';
    
    visualizations.forEach((viz, idx) => {
      content += '\nChart ' + (idx + 1) + ': ' + viz.config.title + '\n';
      if (viz.data.labels) {
        content += 'Labels,' + viz.data.labels.join(',') + '\n';
      }
      if (viz.data.datasets) {
        viz.data.datasets.forEach((ds: any, i: number) => {
          content += 'Dataset ' + (i + 1) + ' (' + (ds.label || 'data') + '),' + ds.data.join(',') + '\n';
        });
      }
    });
    
    return new Blob([content], { type: 'text/csv' });
  }

  downloadExport(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  generateExportFilename(format: string): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    return 'visualization-report-' + timestamp + '.' + (format === 'pptx' ? 'pptx' : format);
  }
}
