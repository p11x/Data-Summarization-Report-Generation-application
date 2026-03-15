import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { ChartConfigService, DrillDownData } from '../services/chart-config.service';
import { TopicsService, Topic } from '../services/topics.service';

@Component({
  selector: 'app-topic-detail',
  templateUrl: './topic-detail.component.html',
  styleUrls: ['./topic-detail.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective]
})
export class TopicDetailComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  // Topic info
  topicId: number = 0;
  topic: Topic | null = null;
  
  // Data
  fileData: FileData | null = null;
  dataSummary: DataSummary | null = null;
  columnAnalysis: ColumnAnalysis[] = [];
  keyInsights: KeyInsight[] = [];
  reportConfig: ReportConfig | null = null;
  sampleData: any[] = [];
  hasData: boolean = false;
  currentDate: Date = new Date();
  isLoading: boolean = true;

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

  // Drill-down state
  drillDownData: DrillDownData[] = [];
  isDrillDownActive: boolean = false;
  drillDownTitle: string = '';
  
  // Zoom state
  isZoomEnabled: boolean = false;
  
  // Detailed stats on hover
  hoveredDataPoint: { label: string; value: number; percentage: number } | null = null;

  // Table columns
  tableColumns: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private topicsService: TopicsService,
    private dataAnalysisService: DataAnalysisService,
    private chartConfigService: ChartConfigService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.topicId = parseInt(params['id']) || 0;
      if (this.topicId > 0) {
        this.loadTopicData();
      }
    });
  }

  loadTopicData() {
    this.isLoading = true;
    
    // Load topic info
    this.topicsService.getTopics().subscribe(topics => {
      this.topic = topics.find(t => t.id === this.topicId) || null;
      
      if (this.topic) {
        // Generate CSV data for this topic
        const csvContent = this.generateTopicCSV(this.topic);
        
        // Process the CSV through DataAnalysisService
        this.processTopicCSV(csvContent, this.topic!);
      }
      
      this.isLoading = false;
    });
  }

  generateTopicCSV(topic: Topic): string {
    // Generate artificial data based on topic
    const headers = ['ID', 'Date', 'Value', 'Category', 'Status', 'Description', 'Metric1', 'Metric2', 'Metric3'];
    const rows: string[] = [headers.join(',')];
    
    const categories = ['Technology', 'Business', 'Healthcare', 'Environment', 'Education', 'Sports', 'Entertainment'];
    const statuses = ['Active', 'Pending', 'Completed', 'In Progress', 'Review'];
    
    for (let i = 1; i <= 50; i++) {
      const date = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const value = Math.floor(Math.random() * 10000) + 100;
      const category = categories[Math.floor(Math.random() * categories.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const description = `${topic.name} data record ${i} - ${category} related activity`;
      const metric1 = (Math.random() * 100).toFixed(2);
      const metric2 = (Math.random() * 50).toFixed(2);
      const metric3 = (Math.random() * 200).toFixed(2);
      
      rows.push(`${i},${date.toISOString().split('T')[0]},${value},${category},${status},"${description}",${metric1},${metric2},${metric3}`);
    }
    
    return rows.join('\n');
  }

  processTopicCSV(csvContent: string, topic: Topic) {
    // Parse CSV
    const { parsedData, headers } = this.parseCSV(csvContent);
    
    // Create FileData
    this.fileData = {
      name: `${topic.name}.csv`,
      size: csvContent.length,
      type: 'text/csv',
      content: csvContent,
      parsedData: parsedData,
      headers: headers,
      uploadDate: new Date(),
      processingTime: 50
    };
    
    // Analyze columns
    this.columnAnalysis = this.analyzeColumns(parsedData, headers);
    
    // Generate summary
    this.dataSummary = this.generateSummary(parsedData, this.columnAnalysis);
    
    // Generate insights
    this.keyInsights = this.generateInsights(parsedData, this.columnAnalysis, topic);
    
    // Set report config
    this.reportConfig = {
      title: `${topic.name} Analysis Report`,
      description: `Automated analysis for topic: ${topic.name}`,
      generatedBy: 'Topic Analysis System',
      reportId: `TOPIC-${topic.id}-${Date.now().toString(36).toUpperCase()}`
    };
    
    this.sampleData = parsedData.slice(0, 10);
    this.hasData = true;
    this.tableColumns = headers;
    
    // Categorize columns
    this.textColumns = this.columnAnalysis.filter(c => c.type === 'Text');
    this.numericColumns = this.columnAnalysis.filter(c => c.type === 'Numeric');
    
    // Set default chart column
    if (this.textColumns.length > 0) {
      this.selectedChartColumn = this.textColumns[0].name;
    } else if (this.numericColumns.length > 0) {
      this.selectedChartColumn = this.numericColumns[0].name;
    }
    
    this.updateChart();
  }

  parseCSV(content: string): { parsedData: any[], headers: string[] } {
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const parsedData: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        parsedData.push(row);
      }
    }
    
    return { parsedData, headers };
  }

  parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    return values;
  }

  analyzeColumns(data: any[], headers: string[]): ColumnAnalysis[] {
    return headers.map(header => {
      const values = data.map(row => row[header]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      const numericValues = nonNullValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
      
      const isNumeric = numericValues.length > nonNullValues.length * 0.5;
      
      if (isNumeric && numericValues.length > 0) {
        const sorted = [...numericValues].sort((a, b) => a - b);
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length;
        const stdDev = Math.sqrt(variance);
        
        return {
          name: header,
          type: 'Numeric',
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          mean,
          median,
          stdDev,
          nullCount: values.length - numericValues.length,
          nullPercentage: ((values.length - numericValues.length) / values.length) * 100,
          values: numericValues
        };
      } else {
        const valueCounts: { [key: string]: number } = {};
        nonNullValues.forEach(v => {
          const key = String(v);
          valueCounts[key] = (valueCounts[key] || 0) + 1;
        });
        
        const sorted = Object.entries(valueCounts).sort((a, b) => b[1] - a[1]);
        
        return {
          name: header,
          type: 'Text',
          unique: Object.keys(valueCounts).length,
          top: sorted[0]?.[0] || '',
          topFrequency: sorted[0]?.[1] || 0,
          nullCount: values.length - nonNullValues.length,
          nullPercentage: ((values.length - nonNullValues.length) / values.length) * 100,
          values: nonNullValues
        };
      }
    });
  }

  generateSummary(data: any[], columns: ColumnAnalysis[]): DataSummary {
    return {
      totalRows: data.length,
      totalColumns: columns.length,
      numericColumns: columns.filter(c => c.type === 'Numeric').length,
      textColumns: columns.filter(c => c.type === 'Text').length,
      dateColumns: 0,
      missingValues: columns.reduce((sum, c) => sum + c.nullCount, 0),
      missingPercentage: (columns.reduce((sum, c) => sum + c.nullCount, 0) / (data.length * columns.length)) * 100,
      duplicateRows: 0
    };
  }

  generateInsights(data: any[], columns: ColumnAnalysis[], topic: Topic): KeyInsight[] {
    const insights: KeyInsight[] = [];
    
    // Add topic-based insight
    insights.push({
      type: 'highlight',
      title: 'Topic Analysis',
      description: `This report analyzes data for the topic "${topic.name}" from the ${topic.category} category.`,
      importance: 'high'
    });
    
    // Add data size insight
    insights.push({
      type: 'comparison',
      title: 'Data Volume',
      description: `The dataset contains ${data.length} records across ${columns.length} columns, providing a comprehensive view of the topic.`,
      importance: 'medium'
    });
    
    // Add numeric column insights
    const numericCols = columns.filter(c => c.type === 'Numeric');
    if (numericCols.length > 0) {
      const col = numericCols[0];
      insights.push({
        type: 'trend',
        title: `${col.name} Statistics`,
        description: `The ${col.name} column has values ranging from ${col.min?.toFixed(2)} to ${col.max?.toFixed(2)} with an average of ${col.mean?.toFixed(2)}.`,
        importance: 'medium'
      });
    }
    
    // Add text column insights
    const textCols = columns.filter(c => c.type === 'Text');
    if (textCols.length > 0) {
      const col = textCols.find(c => c.name === 'Status') || textCols[0];
      insights.push({
        type: 'highlight',
        title: `${col.name} Distribution`,
        description: `The ${col.name} column contains ${col.unique} unique values. Most common: "${col.top}" appearing ${col.topFrequency} times.`,
        importance: 'medium'
      });
    }
    
    return insights;
  }

  // Chart Methods
  updateChart() {
    if (!this.selectedChartColumn) return;

    const columnToAnalyze = this.columnAnalysis.find(c => c.name === this.selectedChartColumn);
    if (!columnToAnalyze) return;

    const colors = this.chartConfigService.getBackgroundColors(10);

    let labels: string[] = [];
    let data: number[] = [];

    if (columnToAnalyze.type === 'Text') {
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

    if (labels.length === 0 || data.length === 0) return;

    this.chartType = this.selectedChartType;

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
      this.chartOptions = this.chartConfigService.getBarChartOptions({
        enableDrillDown: true,
        enableZoom: this.isZoomEnabled,
        enableHoverDetails: true,
        drillDownCallback: (dd) => this.handleDrillDown(dd)
      });
    } else if (this.selectedChartType === 'pie' || this.selectedChartType === 'doughnut') {
      this.chartData = {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 0
        }]
      };
      this.chartOptions = this.chartConfigService.getPieChartOptions({
        enableDrillDown: true,
        enableZoom: false,
        enableHoverDetails: true,
        drillDownCallback: (dd) => this.handleDrillDown(dd)
      });
    } else if (this.selectedChartType === 'line') {
      this.chartData = {
        labels: labels,
        datasets: [{
          label: this.selectedChartColumn,
          data: data,
          borderColor: '#0078d4',
          backgroundColor: 'rgba(0, 120, 212, 0.1)',
          tension: 0.4,
          pointRadius: 4,
          fill: true
        }]
      };
      this.chartOptions = this.chartConfigService.getLineChartOptions({
        enableDrillDown: false,
        enableZoom: this.isZoomEnabled,
        enableHoverDetails: true
      });
    }

    setTimeout(() => {
      if (this.chart) {
        this.chart.update();
      }
    }, 100);
  }

  // Drill-down handler
  handleDrillDown(data: DrillDownData) {
    console.log('Drilling down into:', data);
    
    this.drillDownData = this.chartConfigService.createDrillDownData(
      data.originalLabel,
      this.getColumnValuesForDrillDown(data.originalLabel),
      'Text'
    );
    
    if (this.drillDownData.length > 0) {
      this.isDrillDownActive = true;
      this.drillDownTitle = `${data.label} - Details`;
      
      this.chartData = {
        labels: this.drillDownData.map(d => d.label),
        datasets: [{
          label: this.drillDownTitle,
          data: this.drillDownData.map(d => d.value),
          backgroundColor: this.chartConfigService.getBackgroundColors(this.drillDownData.length),
          borderRadius: 6
        }]
      };
      
      this.chartOptions = this.chartConfigService.getBarChartOptions({
        enableDrillDown: true,
        enableZoom: this.isZoomEnabled,
        enableHoverDetails: true,
        drillDownCallback: (dd) => this.handleDrillDown(dd)
      });
      
      if (this.chart) {
        this.chart.update();
      }
    }
  }

  // Go back from drill-down
  goBackFromDrillDown() {
    this.isDrillDownActive = false;
    this.drillDownData = [];
    this.drillDownTitle = '';
    this.updateChart();
  }

  // Get values for drill-down
  getColumnValuesForDrillDown(label: string): any[] {
    const column = this.columnAnalysis.find(c => c.name === this.selectedChartColumn);
    if (column) {
      return column.values.filter((v: any) => String(v) === label);
    }
    return [];
  }

  // Toggle zoom
  toggleZoom() {
    this.isZoomEnabled = !this.isZoomEnabled;
    this.updateChart();
  }

  // Reset zoom
  resetZoom() {
    if (this.chart) {
      this.chart.update();
    }
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
    this.router.navigate(['/topics']);
  }

  goToDashboard() {
    this.router.navigate(['/home']);
  }

  // Export Methods
  exportAsCSV() {
    if (!this.fileData) return;
    
    const headers = this.fileData.headers.join(',');
    const rows = this.fileData.parsedData.map(row => 
      this.fileData!.headers.map(h => `"${row[h] || ''}"`).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    
    this.downloadFile(csv, `${this.topic?.name || 'topic'}_report.csv`, 'text/csv');
  }

  exportAsText() {
    if (!this.fileData || !this.dataSummary) return;

    let report = `TOPIC ANALYSIS REPORT\n`;
    report += `${'='.repeat(50)}\n\n`;
    report += `Topic: ${this.topic?.name}\n`;
    report += `Category: ${this.topic?.category}\n`;
    report += `Report ID: ${this.reportConfig?.reportId}\n`;
    report += `Generated: ${this.currentDate.toLocaleString()}\n\n`;
    
    report += `SUMMARY\n`;
    report += `${'-'.repeat(30)}\n`;
    report += `Total Records: ${this.dataSummary.totalRows}\n`;
    report += `Total Columns: ${this.dataSummary.totalColumns}\n\n`;

    report += `KEY INSIGHTS\n`;
    report += `${'-'.repeat(30)}\n`;
    this.keyInsights.forEach(insight => {
      report += `• [${insight.type.toUpperCase()}] ${insight.title}: ${insight.description}\n`;
    });

    this.downloadFile(report, `${this.topic?.name || 'topic'}_report.txt`, 'text/plain');
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

  // Raw Data Modal
  showRawDataModal() {
    this.isRawDataModalOpen = true;
  }

  closeRawDataModal() {
    this.isRawDataModalOpen = false;
  }
}
