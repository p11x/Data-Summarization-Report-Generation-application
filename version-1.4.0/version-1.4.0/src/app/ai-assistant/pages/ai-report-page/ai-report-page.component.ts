import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AiAnalysisService, AnalysisResult } from '../../services/ai-analysis.service';
import { DatasetParserService } from '../../services/dataset-parser.service';
import { ReportGeneratorService, ReportConfig } from '../../services/report-generator.service';

@Component({
  selector: 'app-ai-report-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-report-page.component.html',
  styleUrls: ['./ai-report-page.component.css']
})
export class AiReportPageComponent implements OnInit, OnDestroy {
  results: AnalysisResult[] = [];
  selectedResults: string[] = [];
  isGenerating = false;
  datasetInfo: any = null;

  exportFormat: 'pdf' | 'csv' | 'excel' = 'pdf';

  private destroy$ = new Subject<void>();

  constructor(
    private aiAnalysisService: AiAnalysisService,
    private datasetParser: DatasetParserService,
    private reportGenerator: ReportGeneratorService,
    private router: Router
  ) {}

  ngOnInit() {
    this.aiAnalysisService.results$
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        this.results = results;
      });

    const dataset = this.datasetParser.getCurrentDataset();
    if (dataset) {
      this.datasetInfo = dataset.metadata;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSelection(resultId: string) {
    const index = this.selectedResults.indexOf(resultId);
    if (index > -1) {
      this.selectedResults.splice(index, 1);
    } else {
      this.selectedResults.push(resultId);
    }
  }

  isSelected(resultId: string): boolean {
    return this.selectedResults.includes(resultId);
  }

  selectAll() {
    this.selectedResults = this.results.map(r => r.id);
  }

  deselectAll() {
    this.selectedResults = [];
  }

  async generateReport() {
    if (this.selectedResults.length === 0) {
      alert('Please select at least one result to include in the report');
      return;
    }

    this.isGenerating = true;

    try {
      const config: ReportConfig = {
        title: 'AI Analysis Report',
        format: this.exportFormat,
        includeCharts: true,
        includeRawData: true,
        selectedResults: this.selectedResults
      };

      const blob = await this.reportGenerator.generateReport(
        this.results,
        this.datasetInfo,
        config
      );

      const filename = this.reportGenerator.generateReportName(this.exportFormat);
      this.reportGenerator.downloadReport(blob, filename);

      alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      this.isGenerating = false;
    }
  }

  goBack() {
    this.router.navigate(['/ai-chat']);
  }

  getResultTypeIcon(type: string): string {
    switch (type) {
      case 'summary': return '📝';
      case 'insight': return '💡';
      case 'chart': return '📊';
      case 'table': return '📋';
      default: return '📄';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }
}