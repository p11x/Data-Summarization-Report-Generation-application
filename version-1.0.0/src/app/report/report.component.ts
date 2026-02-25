import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { 
  DataAnalysisService, 
  ColumnAnalysis, 
  DataSummary, 
  FileData, 
  KeyInsight,
  ReportConfig 
} from '../services/data-analysis.service';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective]
})
export class ReportComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  // Data
  fileData: FileData | null = null;
  dataSummary: DataSummary | null = null;
  columnAnalysis: ColumnAnalysis[] = [];
  keyInsights: KeyInsight[] = [];
  reportConfig: ReportConfig | null = null;
  sampleData: any[] = [];
  hasData: boolean = false;
  currentDate: Date = new Date();

  // Column types
  textColumns: ColumnAnalysis[] = [];
  numericColumns: ColumnAnalysis[] = [];

  // Filters & Controls
  selectedChartColumn: string = '';
  selectedChartType: 'bar' | 'pie' | 'line' | 'doughnut' = 'bar';
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentPage: number = 1;
  pageSize: number = 10;
  summaryLength: 'short' | 'detailed' = 'detailed';

  // UI State
  sectionsCollapsed: { [key: string]: boolean } = {
    overview: false,
    summary: false,
    charts: false,
    metrics: false,
    table: false,
    conclusion: false
  };
  isRawDataModalOpen: boolean = false;

  // Chart data
  chartData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  chartOptions: ChartConfiguration['options'] = {};
  chartType: ChartType = 'bar';

  // Table columns
  tableColumns: string[] = [];

  constructor(
    private router: Router,
    private dataAnalysisService: DataAnalysisService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.fileData = this.dataAnalysisService.getFileData();
    this.dataSummary = this.dataAnalysisService.getDataSummary();
    this.columnAnalysis = this.dataAnalysisService.getColumnAnalysis();
    this.keyInsights = this.dataAnalysisService.getKeyInsights();
    this.reportConfig = this.dataAnalysisService.getReportConfig();
    this.sampleData = this.dataAnalysisService.getSampleData(10);

    console.log('File Data:', this.fileData);
    console.log('Column Analysis:', this.columnAnalysis);
    console.log('Data Summary:', this.dataSummary);

    if (!this.fileData || this.columnAnalysis.length === 0) {
      this.hasData = false;
      return;
    }

    this.hasData = true;
    this.textColumns = this.columnAnalysis.filter(c => c.type === 'Text');
    this.numericColumns = this.columnAnalysis.filter(c => c.type === 'Numeric');
    this.tableColumns = this.fileData.headers;

    console.log('Text Columns:', this.textColumns);
    console.log('Numeric Columns:', this.numericColumns);

    // Set default chart column
    if (this.textColumns.length > 0) {
      this.selectedChartColumn = this.textColumns[0].name;
    } else if (this.numericColumns.length > 0) {
      this.selectedChartColumn = this.numericColumns[0].name;
    }

    this.updateChart();
  }

  // Chart Methods
  updateChart() {
    if (!this.selectedChartColumn) {
      console.log('No chart column selected');
      return;
    }

    console.log('Updating chart for column:', this.selectedChartColumn);
    console.log('Available columns:', this.columnAnalysis);

    const columnToAnalyze = this.columnAnalysis.find(c => c.name === this.selectedChartColumn);
    console.log('Found column:', columnToAnalyze);

    if (!columnToAnalyze) {
      console.log('Column not found in analysis');
      return;
    }

    // Generate chart data directly from the column
    const colors = [
      'rgba(102, 126, 234, 0.8)',
      'rgba(118, 75, 162, 0.8)',
      'rgba(237, 100, 166, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(16, 185, 129, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(139, 92, 246, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(249, 115, 22, 0.8)'
    ];

    let labels: string[] = [];
    let data: number[] = [];

    if (columnToAnalyze.type === 'Text') {
      // For text columns, create frequency distribution
      const valueCounts: { [key: string]: number } = {};
      columnToAnalyze.values.forEach((v: any) => {
        const key = String(v);
        valueCounts[key] = (valueCounts[key] || 0) + 1;
      });

      const sorted = Object.entries(valueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      labels = sorted.map(([key]) => key.length > 15 ? key.substring(0, 15) + '...' : key);
      data = sorted.map(([, value]) => value);
    } else if (columnToAnalyze.type === 'Numeric') {
      // For numeric columns, create histogram bins
      const values = columnToAnalyze.values as number[];
      const min = Math.min(...values);
      const max = Math.max(...values);
      const binCount = 10;
      const binSize = (max - min) / binCount || 1;

      for (let i = 0; i < binCount; i++) {
        const binStart = min + i * binSize;
        const binEnd = binStart + binSize;
        const count = values.filter((v: number) => v >= binStart && (i === binCount - 1 ? v <= binEnd : v < binEnd)).length;
        labels.push(`${Math.round(binStart)}-${Math.round(binEnd)}`);
        data.push(count);
      }
    }

    console.log('Generated labels:', labels);
    console.log('Generated data:', data);

    if (labels.length === 0 || data.length === 0) {
      console.log('No data to display in chart');
      return;
    }

    this.chartType = this.selectedChartType;
    console.log('Setting chart type to:', this.chartType);

    if (this.selectedChartType === 'bar') {
      this.chartData = {
        labels: labels,
        datasets: [{
          label: this.selectedChartColumn,
          data: data,
          backgroundColor: colors,
          borderRadius: 6
        }]
      };
      this.chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: `${this.selectedChartColumn} Distribution`, font: { size: 14 } }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      };
    } else if (this.selectedChartType === 'pie' || this.selectedChartType === 'doughnut') {
      this.chartData = {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 0
        }]
      };
      this.chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' },
          title: { display: true, text: `${this.selectedChartColumn} Distribution`, font: { size: 14 } }
        }
      };
    } else if (this.selectedChartType === 'line') {
      this.chartData = {
        labels: labels,
        datasets: [{
          label: this.selectedChartColumn,
          data: data,
          borderColor: 'rgba(102, 126, 234, 1)',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          pointRadius: 4
        }]
      };
      this.chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: `${this.selectedChartColumn} Trend`, font: { size: 14 } }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      };
    }

    console.log('Chart data set:', this.chartData);
    console.log('Chart options set:', this.chartOptions);
    
    // Force chart update
    setTimeout(() => {
      if (this.chart) {
        this.chart.update();
      }
    }, 100);
  }

  // Table Methods
  get filteredData(): any[] {
    let data = this.fileData?.parsedData || [];
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      data = data.filter(row => 
        Object.values(row).some(val => 
          String(val).toLowerCase().includes(term)
        )
      );
    }

    if (this.sortColumn) {
      data = [...data].sort((a, b) => {
        const aVal = a[this.sortColumn];
        const bVal = b[this.sortColumn];
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return data;
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredData.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // UI Methods
  toggleSection(section: string) {
    this.sectionsCollapsed[section] = !this.sectionsCollapsed[section];
  }

  isCollapsed(section: string): boolean {
    return this.sectionsCollapsed[section] || false;
  }

  // Navigation
  goBack() {
    this.router.navigate(['/upload']);
  }

  goToDashboard() {
    this.router.navigate(['/home']);
  }

  uploadNewFile() {
    this.dataAnalysisService.clearData();
    this.router.navigate(['/upload']);
  }

  // Export Methods
  exportAsCSV() {
    if (!this.fileData) return;
    
    const headers = this.fileData.headers.join(',');
    const rows = this.fileData.parsedData.map(row => 
      this.fileData!.headers.map(h => `"${row[h] || ''}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    this.downloadFile(csv, `${this.fileData.name}_report.csv`, 'text/csv');
  }

  exportAsText() {
    if (!this.fileData || !this.dataSummary) return;

    let report = `DATA ANALYSIS REPORT\n`;
    report += `${'='.repeat(50)}\n\n`;
    report += `Report ID: ${this.reportConfig?.reportId}\n`;
    report += `Generated: ${this.currentDate.toLocaleString()}\n`;
    report += `File: ${this.fileData.name}\n`;
    report += `Processing Time: ${this.fileData.processingTime}ms\n\n`;
    
    report += `SUMMARY\n`;
    report += `${'-'.repeat(30)}\n`;
    report += `Total Records: ${this.dataSummary.totalRows}\n`;
    report += `Total Columns: ${this.dataSummary.totalColumns}\n`;
    report += `Numeric Columns: ${this.dataSummary.numericColumns}\n`;
    report += `Text Columns: ${this.dataSummary.textColumns}\n`;
    report += `Missing Values: ${this.dataSummary.missingValues} (${this.dataSummary.missingPercentage.toFixed(1)}%)\n`;
    report += `Duplicate Rows: ${this.dataSummary.duplicateRows}\n\n`;

    report += `KEY INSIGHTS\n`;
    report += `${'-'.repeat(30)}\n`;
    this.keyInsights.forEach(insight => {
      report += `• [${insight.type.toUpperCase()}] ${insight.title}: ${insight.description}\n`;
    });
    report += `\n`;

    report += `COLUMN ANALYSIS\n`;
    report += `${'-'.repeat(30)}\n`;
    this.columnAnalysis.forEach(col => {
      report += `\n${col.name} (${col.type}):\n`;
      if (col.type === 'Numeric') {
        report += `  Min: ${col.min}\n`;
        report += `  Max: ${col.max}\n`;
        report += `  Mean: ${col.mean}\n`;
        report += `  Median: ${col.median}\n`;
        report += `  Std Dev: ${col.stdDev}\n`;
      } else {
        report += `  Unique Values: ${col.unique}\n`;
        report += `  Most Common: ${col.top}\n`;
      }
      report += `  Missing: ${col.nullCount} (${col.nullPercentage.toFixed(1)}%)\n`;
    });

    this.downloadFile(report, `report_${this.fileData.name.replace(/\.[^/.]+$/, '')}.txt`, 'text/plain');
  }

  printReport() {
    window.print();
  }

  private downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Helper Methods
  getInsightIcon(type: string): string {
    switch (type) {
      case 'trend': return '📈';
      case 'anomaly': return '⚠️';
      case 'highlight': return '💡';
      case 'comparison': return '🔄';
      default: return '📌';
    }
  }

  getInsightClass(importance: string): string {
    return `insight-${importance}`;
  }

  formatNumber(num: number | undefined): string {
    if (num === undefined) return '-';
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  getMissingPercentageLevel(): 'excellent' | 'moderate' | 'poor' | null {
    if (!this.dataSummary || this.dataSummary.missingPercentage === undefined) return null;
    if (this.dataSummary.missingPercentage < 5) return 'excellent';
    if (this.dataSummary.missingPercentage < 20) return 'moderate';
    return 'poor';
  }

  hasDuplicateRows(): boolean {
    return !!(this.dataSummary?.duplicateRows && this.dataSummary.duplicateRows > 0);
  }

  hasMissingValues(): boolean {
    return !!(this.dataSummary?.missingValues && this.dataSummary.missingValues > 0);
  }

  // Raw Data Modal
  showRawDataModal() {
    this.isRawDataModalOpen = true;
  }

  closeRawDataModal() {
    this.isRawDataModalOpen = false;
  }

  goToDownloadPage() {
    this.isRawDataModalOpen = false;
    this.router.navigate(['/download']);
  }
}
