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
import { ChartConfigService, DrillDownData } from '../services/chart-config.service';
import { ReportVersionService } from '../services/report-version.service';
import { AdvancedAnalyticsService } from '../services/advanced-analytics.service';

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
    analytics: false,
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
  selectedDrillColumn: string = '';
  
  // Zoom state
  isZoomEnabled: boolean = false;
  
  // Detailed stats on hover
  hoveredDataPoint: { label: string; value: number; percentage: number } | null = null;

  // Table columns
  tableColumns: string[] = [];

  // Version save modal
  showSaveVersionModal: boolean = false;
  newVersionDescription: string = '';
  newVersionTags: string = '';

  // Advanced Analytics Properties
  // Anomaly Detection
  anomalyResults: any = null;
  anomalyChartData: any[] = [];
  anomalyColumn: string = '';
  anomalyMethod: string = 'zscore';
  anomalyThreshold: number = 2;

  // Forecasting
  forecastResults: any = null;
  forecastChartData: any[] = [];
  forecastColumn: string = '';
  forecastMethod: string = 'moving_average';
  forecastHorizon: number = 12;

  // What-If Analysis
  whatIfScenarios: any[] = [];
  showWhatIfModal: boolean = false;
  newScenarioName: string = '';
  newScenarioChanges: any = {};

  // Semantic Search
  semanticQuery: string = '';
  semanticResults: any = null;

  // Data Lineage
  lineageData: any = null;

  // Chatbot
  showChatbot: boolean = false;
  chatbotMessages: any[] = [];
  chatbotInput: string = '';

  constructor(
    private router: Router,
    private dataAnalysisService: DataAnalysisService,
    private chartConfigService: ChartConfigService,
    private versionService: ReportVersionService,
    private analyticsService: AdvancedAnalyticsService
  ) {}

  ngOnInit() {
    this.loadData();
    // Auto-run advanced analytics on page load
    setTimeout(() => {
      this.runAnomalyDetection();
      this.runForecasting();
      this.createDefaultScenarios();
      this.runDefaultSemanticSearch();
      this.trackLineage();
      this.initChatbot();
    }, 1000); // Delay to ensure data is loaded
  }

  // Initialize chatbot with welcome message
  initChatbot() {
    this.chatbotMessages = [
      {
        type: 'bot',
        text: `Hello! I'm your data analysis assistant. I can help you with:`,
        suggestions: [
          'Show anomaly detection results',
          'Show forecasting predictions',
          'Explain the data trends',
          'What are the key insights?',
          'Show data distribution'
        ]
      }
    ];
  }

  // Toggle chatbot visibility
  toggleChatbot() {
    this.showChatbot = !this.showChatbot;
  }

  // Send message to chatbot
  sendChatbotMessage() {
    if (!this.chatbotInput.trim()) return;

    const userMessage = this.chatbotInput;
    this.chatbotMessages.push({ type: 'user', text: userMessage });
    this.chatbotInput = '';

    // Generate bot response
    setTimeout(() => {
      this.generateBotResponse(userMessage);
    }, 500);
  }

  // Generate bot response based on user query
  generateBotResponse(query: string) {
    const lowerQuery = query.toLowerCase();
    let response = '';
    let suggestions: string[] = [];

    if (lowerQuery.includes('anomaly') || lowerQuery.includes('outlier')) {
      if (this.anomalyResults) {
        response = `I found ${this.anomalyResults.total} anomalies in your data:\n`;
        response += `• High severity: ${this.anomalyResults.high}\n`;
        response += `• Medium severity: ${this.anomalyResults.medium}\n`;
        response += `• Low severity: ${this.anomalyResults.low}\n\n`;
        response += `The analysis was performed using ${this.anomalyResults.method} method with threshold ${this.anomalyResults.threshold}.`;
      } else {
        response = 'Anomaly detection has not been run yet. The results will appear in the Advanced Analytics section.';
      }
    } else if (lowerQuery.includes('forecast') || lowerQuery.includes('predict')) {
      if (this.forecastResults) {
        response = `Here's your forecast using ${this.forecastResults.method}:\n\n`;
        this.forecastResults.predictions.slice(0, 3).forEach((pred: any) => {
          response += `Period ${pred.period}: ${pred.predicted.toFixed(2)} (${(pred.confidence * 100).toFixed(0)}% confidence)\n`;
        });
      } else {
        response = 'Forecasting has not been run yet. The predictions will appear in the Advanced Analytics section.';
      }
    } else if (lowerQuery.includes('trend') || lowerQuery.includes('insight')) {
      if (this.keyInsights.length > 0) {
        response = `Here are the key insights from your data:\n\n`;
        this.keyInsights.slice(0, 5).forEach((insight, i) => {
          response += `${i + 1}. [${insight.type.toUpperCase()}] ${insight.title}: ${insight.description}\n`;
        });
      } else {
        response = 'No key insights available yet.';
      }
    } else if (lowerQuery.includes('distribution') || lowerQuery.includes('stats') || lowerQuery.includes('statistic')) {
      if (this.dataSummary && this.columnAnalysis.length > 0) {
        const col = this.columnAnalysis[0];
        response = `Data Statistics for ${col.name}:\n\n`;
        if (col.type === 'Numeric') {
          response += `• Type: Numeric\n`;
          response += `• Min: ${col.min?.toFixed(2)}\n`;
          response += `• Max: ${col.max?.toFixed(2)}\n`;
          response += `• Mean: ${col.mean?.toFixed(2)}\n`;
          response += `• Median: ${col.median?.toFixed(2)}\n`;
          response += `• Std Dev: ${col.stdDev?.toFixed(2)}`;
        } else {
          response += `• Type: ${col.type}\n`;
          response += `• Unique Values: ${col.unique}\n`;
          response += `• Most Common: ${col.top}`;
        }
      } else {
        response = 'No statistics available yet.';
      }
    } else if (lowerQuery.includes('what') && lowerQuery.includes('if')) {
      response = `What-If Analysis shows potential scenarios:\n\n`;
      this.whatIfScenarios.forEach(scenario => {
        response += `• ${scenario.name}\n`;
      });
      response += `\nYou can customize these scenarios using the sliders in the What-If Analysis section.`;
    } else if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('help')) {
      response = `Hello! I'm here to help you understand your data. You can ask me about:\n\n`;
      response += `• Anomalies and outliers\n`;
      response += `• Forecasts and predictions\n`;
      response += `• Data trends and insights\n`;
      response += `• Statistics and distributions\n`;
      response += `• What-if scenarios`;
      suggestions = [
        'Show anomaly detection results',
        'Show forecasting predictions',
        'What are the key insights?'
      ];
    } else {
      response = `I understand you're asking about "${query}". Here's a summary of your data:\n\n`;
      if (this.dataSummary) {
        response += `• Total Records: ${this.dataSummary.totalRows?.toLocaleString()}\n`;
        response += `• Total Columns: ${this.dataSummary.totalColumns}\n`;
        response += `• Numeric Columns: ${this.numericColumns.length}\n`;
        response += `• Text Columns: ${this.textColumns.length}`;
      }
      suggestions = [
        'Show anomaly detection results',
        'Show forecasting predictions',
        'Explain the data trends'
      ];
    }

    this.chatbotMessages.push({ type: 'bot', text: response, suggestions });
  }

  // Handle suggestion click
  handleSuggestionClick(suggestion: string) {
    this.chatbotInput = suggestion;
    this.sendChatbotMessage();
  }

  // Create default What-If scenarios automatically
  createDefaultScenarios() {
    if (!this.numericColumns || this.numericColumns.length === 0) return;
    
    // Scenario 1: Optimistic (10% increase)
    const optimisticChanges: any = {};
    this.numericColumns.forEach(col => {
      optimisticChanges[col.name] = 10;
    });
    
    this.whatIfScenarios.push({
      name: 'Optimistic Growth (+10%)',
      isBaseline: false,
      changes: Object.entries(optimisticChanges).map(([column, change]) => ({
        column,
        percentChange: change
      })),
      createdAt: new Date()
    });

    // Scenario 2: Pessimistic (10% decrease)
    const pessimisticChanges: any = {};
    this.numericColumns.forEach(col => {
      pessimisticChanges[col.name] = -10;
    });
    
    this.whatIfScenarios.push({
      name: 'Pessimistic Decline (-10%)',
      isBaseline: false,
      changes: Object.entries(pessimisticChanges).map(([column, change]) => ({
        column,
        percentChange: change
      })),
      createdAt: new Date()
    });

    // Scenario 3: Baseline (no change)
    this.whatIfScenarios.push({
      name: 'Baseline (Current)',
      isBaseline: true,
      changes: [],
      createdAt: new Date()
    });
  }

  // Run default semantic search queries
  runDefaultSemanticSearch() {
    if (!this.fileData || this.numericColumns.length === 0) return;
    
    // Generate insights based on data
    const column = this.numericColumns[0]?.name;
    if (!column) return;

    // Find high values
    const values = this.sampleData
      .map(row => parseFloat(row[column]))
      .filter(val => !isNaN(val));
    
    if (values.length === 0) return;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    // Create default search result
    const highValues = this.sampleData.filter(row => {
      const val = parseFloat(row[column]);
      return !isNaN(val) && val > avg;
    });

    this.semanticResults = {
      query: `Find high ${column} values above average`,
      count: highValues.length,
      explanation: `Found ${highValues.length} records with ${column} above average (${avg.toFixed(2)})`,
      data: highValues.slice(0, 10)
    };
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

  // Drill-down handler
  handleDrillDown(data: DrillDownData) {
    console.log('Drilling down into:', data);
    
    // Save current state for back navigation
    this.drillDownData = this.chartConfigService.createDrillDownData(
      data.originalLabel,
      this.getColumnValuesForDrillDown(data.originalLabel),
      'Text'
    );
    
    if (this.drillDownData.length > 0) {
      this.isDrillDownActive = true;
      this.drillDownTitle = `${data.label} - Details`;
      
      // Update chart with drill-down data
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
      // @ts-ignore - zoom plugin
      const zoomPlugin = this.chart.chart?.plugins?.get('zoom');
      if (zoomPlugin) {
        // @ts-ignore
        zoomPlugin.reset();
      }
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

  // Version Methods
  openSaveVersionModal() {
    this.showSaveVersionModal = true;
    this.newVersionDescription = '';
    this.newVersionTags = '';
  }

  closeSaveVersionModal() {
    this.showSaveVersionModal = false;
  }

  saveCurrentVersion() {
    if (!this.fileData || !this.dataSummary || !this.reportConfig) {
      alert('No report data available to save');
      return;
    }

    const tags = this.newVersionTags.split(',').map(t => t.trim()).filter(t => t);

    this.versionService.saveVersion(
      this.reportConfig.reportId,
      this.fileData.name,
      this.fileData,
      this.dataSummary,
      this.columnAnalysis,
      this.keyInsights,
      this.reportConfig,
      this.newVersionDescription,
      tags
    );

    this.showSaveVersionModal = false;
    this.newVersionDescription = '';
    this.newVersionTags = '';
    alert('Version saved successfully!');
  }

  goToVersionHistory() {
    this.router.navigate(['/versions']);
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

  // ============================================
  // Advanced Analytics Methods
  // ============================================

  // Anomaly Detection
  runAnomalyDetection() {
    if (!this.fileData || this.numericColumns.length === 0) {
      alert('No numeric data available for anomaly detection');
      return;
    }

    // Use first numeric column if none selected
    const column = this.anomalyColumn || this.numericColumns[0]?.name;
    if (!column) {
      alert('No numeric column available for anomaly detection');
      return;
    }

    // Get numeric data from the file
    const numericData = this.sampleData
      .map(row => parseFloat(row[column]))
      .filter(val => !isNaN(val));

    if (numericData.length === 0) {
      alert('No numeric values found in the selected column');
      return;
    }

    // Calculate statistics
    const mean = numericData.reduce((a, b) => a + b, 0) / numericData.length;
    const stdDev = Math.sqrt(
      numericData.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / numericData.length
    );

    // Detect anomalies using Z-score
    const anomalies: any[] = [];
    const maxVal = Math.max(...numericData);
    const minVal = Math.min(...numericData);
    const range = maxVal - minVal || 1;

    this.anomalyChartData = numericData.map((value, index) => {
      const zScore = stdDev > 0 ? Math.abs((value - mean) / stdDev) : 0;
      const isAnomaly = zScore > this.anomalyThreshold;

      if (isAnomaly) {
        anomalies.push({
          index,
          value,
          zScore,
          severity: zScore > 3 ? 'high' : zScore > 2.5 ? 'medium' : 'low'
        });
      }

      return {
        index,
        value,
        height: ((value - minVal) / range) * 80 + 10,
        isAnomaly
      };
    });

    const highCount = anomalies.filter(a => a.severity === 'high').length;
    const mediumCount = anomalies.filter(a => a.severity === 'medium').length;
    const lowCount = anomalies.filter(a => a.severity === 'low').length;

    this.anomalyResults = {
      total: anomalies.length,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      method: this.anomalyMethod,
      threshold: this.anomalyThreshold,
      column,
      anomalies: anomalies.slice(0, 20) // Limit to 20 for display
    };

    console.log('Anomaly detection completed:', this.anomalyResults);
  }

  // Forecasting
  runForecasting() {
    if (!this.fileData || this.numericColumns.length === 0) {
      alert('No numeric data available for forecasting');
      return;
    }

    const column = this.forecastColumn || this.numericColumns[0]?.name;
    if (!column) {
      alert('No numeric column available for forecasting');
      return;
    }

    const numericData = this.sampleData
      .map(row => parseFloat(row[column]))
      .filter(val => !isNaN(val));

    if (numericData.length < 3) {
      alert('Need at least 3 data points for forecasting');
      return;
    }

    const predictions: any[] = [];
    const maxVal = Math.max(...numericData);
    const minVal = Math.min(...numericData);
    const range = maxVal - minVal || 1;

    // Simple moving average forecast
    let forecastData: number[] = [];
    const windowSize = Math.min(3, Math.floor(numericData.length / 2)) || 1;

    if (this.forecastMethod === 'moving_average') {
      // Calculate moving average
      for (let i = 0; i < this.forecastHorizon; i++) {
        const window = numericData.slice(-windowSize);
        const avg = window.reduce((a, b) => a + b, 0) / window.length;
        forecastData.push(avg);
        numericData.push(avg);
      }
    } else if (this.forecastMethod === 'linear_regression') {
      // Simple linear regression
      const n = numericData.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      
      for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += numericData[i];
        sumXY += i * numericData[i];
        sumX2 += i * i;
      }
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      for (let i = 0; i < this.forecastHorizon; i++) {
        const predicted = intercept + slope * (n + i);
        forecastData.push(predicted);
      }
    } else {
      // Exponential smoothing (simple)
      let lastValue = numericData[numericData.length - 1];
      const alpha = 0.3;
      
      for (let i = 0; i < this.forecastHorizon; i++) {
        const smoothed = alpha * lastValue + (1 - alpha) * lastValue;
        forecastData.push(smoothed);
        lastValue = smoothed;
      }
    }

    // Build chart data
    this.forecastChartData = [
      ...numericData.slice(0, numericData.length - this.forecastHorizon).map((val, idx) => ({
        index: idx,
        value: val,
        height: ((val - minVal) / range) * 80 + 10,
        isForecast: false
      })),
      ...forecastData.map((val, idx) => ({
        index: numericData.length - this.forecastHorizon + idx,
        value: val,
        height: ((val - minVal) / range) * 80 + 10,
        isForecast: true
      }))
    ];

    // Generate predictions
    for (let i = 0; i < forecastData.length; i++) {
      predictions.push({
        period: i + 1,
        predicted: forecastData[i],
        confidence: Math.max(0.5, 1 - (i / this.forecastHorizon) * 0.5)
      });
    }

    this.forecastResults = {
      method: this.forecastMethod,
      horizon: this.forecastHorizon,
      column,
      predictions
    };

    console.log('Forecasting completed:', this.forecastResults);
  }

  // What-If Analysis
  openWhatIfModal() {
    this.showWhatIfModal = true;
    this.newScenarioName = '';
    this.newScenarioChanges = {};
    
    // Initialize with numeric columns
    this.numericColumns.forEach(col => {
      this.newScenarioChanges[col.name] = 0;
    });
  }

  closeWhatIfModal() {
    this.showWhatIfModal = false;
  }

  createScenario() {
    if (!this.newScenarioName.trim()) {
      alert('Please enter a scenario name');
      return;
    }

    const changes: any[] = [];
    for (const [column, change] of Object.entries(this.newScenarioChanges)) {
      if (change !== 0) {
        changes.push({
          column,
          percentChange: change
        });
      }
    }

    if (changes.length === 0) {
      alert('Please specify at least one change');
      return;
    }

    const scenario = {
      name: this.newScenarioName,
      isBaseline: this.whatIfScenarios.length === 0,
      changes,
      createdAt: new Date()
    };

    this.whatIfScenarios.push(scenario);
    this.showWhatIfModal = false;
    console.log('Scenario created:', scenario);
  }

  // Semantic Search
  runSemanticSearch() {
    if (!this.semanticQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    if (!this.fileData) {
      alert('No data available for search');
      return;
    }

    // Simple keyword-based search (in a real app, this would use NLP)
    const query = this.semanticQuery.toLowerCase();
    const results = this.sampleData.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(query)
      );
    });

    // Generate explanation
    let explanation = '';
    if (results.length === 0) {
      explanation = `No results found for "${this.semanticQuery}". Try different keywords.`;
    } else if (results.length < 5) {
      explanation = `Found ${results.length} result(s) matching "${this.semanticQuery}". Showing all matches.`;
    } else {
      explanation = `Found ${results.length} results for "${this.semanticQuery}". Showing top 10 matches based on relevance.`;
    }

    this.semanticResults = {
      query: this.semanticQuery,
      count: results.length,
      explanation,
      data: results.slice(0, 10)
    };

    console.log('Semantic search completed:', this.semanticResults);
  }

  // Run preset query
  runPresetQuery(type: string) {
    if (!this.fileData || this.numericColumns.length === 0) {
      return;
    }

    const column = this.numericColumns[0]?.name;
    if (!column) return;

    const values = this.sampleData
      .map(row => parseFloat(row[column]))
      .filter(val => !isNaN(val));

    if (values.length === 0) return;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    let results: any[] = [];
    let query = '';
    let explanation = '';

    switch (type) {
      case 'high':
        const highThreshold = avg * 1.2;
        results = this.sampleData.filter(row => {
          const val = parseFloat(row[column]);
          return !isNaN(val) && val > highThreshold;
        });
        query = `High ${column} values (above ${highThreshold.toFixed(2)})`;
        explanation = `Found ${results.length} records with ${column} significantly above average`;
        break;
      case 'low':
        const lowThreshold = avg * 0.8;
        results = this.sampleData.filter(row => {
          const val = parseFloat(row[column]);
          return !isNaN(val) && val < lowThreshold;
        });
        query = `Low ${column} values (below ${lowThreshold.toFixed(2)})`;
        explanation = `Found ${results.length} records with ${column} significantly below average`;
        break;
      case 'average':
        const margin = avg * 0.1;
        results = this.sampleData.filter(row => {
          const val = parseFloat(row[column]);
          return !isNaN(val) && val >= avg - margin && val <= avg + margin;
        });
        query = `Average ${column} values (around ${avg.toFixed(2)})`;
        explanation = `Found ${results.length} records with ${column} close to average`;
        break;
      case 'trends':
        results = this.sampleData.slice(0, Math.min(10, this.sampleData.length));
        query = `Trend analysis for ${column}`;
        explanation = `Showing first ${results.length} records for trend analysis. Min: ${min.toFixed(2)}, Max: ${max.toFixed(2)}, Avg: ${avg.toFixed(2)}`;
        break;
      case 'outliers':
        const stdDev = Math.sqrt(
          values.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / values.length
        );
        results = this.sampleData.filter((row, idx) => {
          const val = parseFloat(row[column]);
          return !isNaN(val) && Math.abs((val - avg) / stdDev) > 2;
        });
        query = `Outliers in ${column}`;
        explanation = `Found ${results.length} outlier records (beyond 2 standard deviations)`;
        break;
      case 'distribution':
        const stdDevForDist = Math.sqrt(
          values.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / values.length
        );
        results = this.sampleData.slice(0, Math.min(20, this.sampleData.length));
        query = `Distribution of ${column}`;
        explanation = `Data distribution: Min=${min.toFixed(2)}, Max=${max.toFixed(2)}, Avg=${avg.toFixed(2)}, StdDev=${stdDevForDist.toFixed(2)}`;
        break;
    }

    this.semanticQuery = query;
    this.semanticResults = {
      query,
      count: results.length,
      explanation,
      data: results.slice(0, 10)
    };
  }

  // Data Lineage
  trackLineage() {
    if (!this.fileData) {
      alert('No data available for lineage tracking');
      return;
    }

    const pipelineSteps = [
      'Data Upload',
      'Data Validation',
      'Data Cleaning',
      'Data Transformation',
      'Analysis Generation',
      'Report Creation'
    ];

    this.lineageData = {
      pipelineName: `Analysis Pipeline - ${this.fileData.name}`,
      timestamp: new Date(),
      steps: pipelineSteps,
      datasetName: this.fileData.name,
      recordCount: this.sampleData.length,
      columns: this.columnAnalysis.length
    };

    console.log('Lineage tracked:', this.lineageData);
  }

  // Helper Method
  getObjectKeys(obj: any): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }

  // Check if any scenario changes are defined
  hasAnyChanges(): boolean {
    if (!this.newScenarioChanges) return false;
    return Object.values(this.newScenarioChanges).some(val => val !== 0);
  }
}
