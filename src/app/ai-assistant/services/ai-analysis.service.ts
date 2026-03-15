import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ParsedDataset } from './dataset-parser.service';

export interface AnalysisResult {
  id: string;
  type: 'summary' | 'insight' | 'chart' | 'table';
  title: string;
  content: string;
  chartData?: ChartConfig;
  rawData?: any;
  timestamp: Date;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'trend';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AiAnalysisService {
  private results = new BehaviorSubject<AnalysisResult[]>([]);
  private isProcessing = new BehaviorSubject<boolean>(false);

  results$ = this.results.asObservable();
  isProcessing$ = this.isProcessing.asObservable();

  constructor() {
    this.loadResults();
  }

  private loadResults() {
    const saved = localStorage.getItem('ai-analysis-results');
    if (saved) {
      try {
        this.results.next(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading results:', e);
      }
    }
  }

  private saveResults() {
    localStorage.setItem('ai-analysis-results', JSON.stringify(this.results.value));
  }

  async analyze(query: string, dataset: ParsedDataset): Promise<AnalysisResult> {
    this.isProcessing.next(true);

    try {
      // Simulate AI processing
      await this.delay(1000 + Math.random() * 2000);

      const result = this.generateAnalysis(query, dataset);
      const currentResults = this.results.value;
      this.results.next([result, ...currentResults]);
      this.saveResults();

      this.isProcessing.next(false);
      return result;
    } catch (error) {
      this.isProcessing.next(false);
      throw error;
    }
  }

  private generateAnalysis(query: string, dataset: ParsedDataset): AnalysisResult {
    const lowerQuery = query.toLowerCase();
    const { data, metadata } = dataset;

    // Determine analysis type based on query
    if (lowerQuery.includes('summarize') || lowerQuery.includes('summary')) {
      return this.generateSummary(query, dataset);
    } else if (lowerQuery.includes('chart') || lowerQuery.includes('visual')) {
      return this.generateChart(query, dataset);
    } else if (lowerQuery.includes('top') || lowerQuery.includes('highest')) {
      return this.generateTopValues(query, dataset);
    } else if (lowerQuery.includes('correlation') || lowerQuery.includes('correlate')) {
      return this.generateCorrelation(query, dataset);
    } else if (lowerQuery.includes('insight') || lowerQuery.includes('analyze')) {
      return this.generateInsights(query, dataset);
    } else {
      return this.generateGeneralResponse(query, dataset);
    }
  }

  private generateSummary(query: string, dataset: ParsedDataset): AnalysisResult {
    const { data, metadata } = dataset;
    const summary = this.createBasicSummary(data, metadata);
    
    return {
      id: this.generateId(),
      type: 'summary',
      title: 'Dataset Summary',
      content: summary,
      timestamp: new Date()
    };
  }

  private createBasicSummary(data: any[], metadata: any): string {
    const numericColumns = Object.entries(metadata.columnTypes)
      .filter(([_, type]) => type === 'integer' || type === 'float')
      .map(([name]) => name);

    let summary = `## Dataset Overview\n\n`;
    summary += `This dataset contains **${metadata.rowCount} rows** and **${metadata.columnNames.length} columns**.\n\n`;
    summary += `**Columns:** ${metadata.columnNames.join(', ')}\n\n`;
    summary += `**Data Types:**\n`;
    Object.entries(metadata.columnTypes).forEach(([col, type]) => {
      summary += `- ${col}: ${type}\n`;
    });

    if (numericColumns.length > 0) {
      summary += `\n**Numeric Analysis:**\n`;
      numericColumns.slice(0, 3).forEach(col => {
        const values = data.map(row => row[col]).filter(v => typeof v === 'number');
        if (values.length > 0) {
          const sum = values.reduce((a: number, b: number) => a + b, 0);
          const avg = sum / values.length;
          const min = Math.min(...values);
          const max = Math.max(...values);
          summary += `- ${col}: Min=${min.toFixed(2)}, Max=${max.toFixed(2)}, Avg=${avg.toFixed(2)}\n`;
        }
      });
    }

    return summary;
  }

  private generateChart(query: string, dataset: ParsedDataset): AnalysisResult {
    const { data, metadata } = dataset;
    
    // Determine chart type based on query
    let chartType: ChartConfig['type'] = 'bar';
    if (query.toLowerCase().includes('line') || query.toLowerCase().includes('trend')) {
      chartType = 'line';
    } else if (query.toLowerCase().includes('pie') || query.toLowerCase().includes('distribution')) {
      chartType = 'pie';
    } else if (query.toLowerCase().includes('scatter')) {
      chartType = 'scatter';
    }

    // Find suitable columns for chart
    const numericCols = Object.entries(metadata.columnTypes)
      .filter(([_, type]) => type === 'integer' || type === 'float')
      .map(([name]) => name);

    const categoricalCols = metadata.columnNames.filter(col => 
      metadata.columnTypes[col] === 'string'
    );

    let chartData: ChartConfig;

    if (chartType === 'pie' && categoricalCols.length > 0) {
      // Pie chart - use categorical data
      const col = categoricalCols[0];
      const counts: { [key: string]: number } = {};
      data.forEach(row => {
        const val = row[col] || 'Unknown';
        counts[val] = (counts[val] || 0) + 1;
      });

      const entries = Object.entries(counts).slice(0, 10);
      chartData = {
        type: 'pie',
        labels: entries.map(([k]) => k),
        datasets: [{
          label: col,
          data: entries.map(([_, v]) => v),
          backgroundColor: this.generateColors(entries.length)
        }]
      };
    } else if (numericCols.length >= 2 && categoricalCols.length > 0) {
      // Bar/Line chart
      const catCol = categoricalCols[0];
      const numCol = numericCols[0];
      
      const grouped: { [key: string]: number } = {};
      data.slice(0, 20).forEach(row => {
        const key = row[catCol] || 'Unknown';
        grouped[key] = (grouped[key] || 0) + (Number(row[numCol]) || 0);
      });

      const labels = Object.keys(grouped);
      chartData = {
        type: chartType,
        labels,
        datasets: [{
          label: numCol,
          data: labels.map(l => grouped[l]),
          backgroundColor: '#4F46E5',
          borderColor: '#4F46E5'
        }]
      };
    } else if (numericCols.length >= 2) {
      // Scatter chart
      chartData = {
        type: 'scatter',
        labels: data.slice(0, 20).map((_, i) => `Point ${i + 1}`),
        datasets: [{
          label: `${numericCols[0]} vs ${numericCols[1]}`,
          data: data.slice(0, 20).map(row => [row[numericCols[0]], row[numericCols[1]]]).flat() as any
        }]
      };
    } else {
      // Default bar chart
      chartData = {
        type: 'bar',
        labels: metadata.columnNames.slice(0, 5),
        datasets: [{
          label: 'Sample Data',
          data: data.slice(0, 5).map((_, i) => i + 1),
          backgroundColor: '#4F46E5'
        }]
      };
    }

    return {
      id: this.generateId(),
      type: 'chart',
      title: this.getChartTitle(chartType),
      content: this.generateChartDescription(chartType, dataset),
      chartData,
      timestamp: new Date()
    };
  }

  private getChartTitle(type: string): string {
    switch (type) {
      case 'bar': return 'Bar Chart Visualization';
      case 'line': return 'Line Chart - Trend Analysis';
      case 'pie': return 'Pie Chart - Distribution';
      case 'scatter': return 'Scatter Plot';
      default: return 'Data Visualization';
    }
  }

  private generateChartDescription(type: string, dataset: ParsedDataset): string {
    return `This ${type} chart provides a visual representation of your dataset (${dataset.metadata.filename}). It shows the distribution and relationships within your ${dataset.metadata.rowCount} rows of data.`;
  }

  private generateTopValues(query: string, dataset: ParsedDataset): AnalysisResult {
    const { data, metadata } = dataset;
    const numericCols = Object.entries(metadata.columnTypes)
      .filter(([_, type]) => type === 'integer' || type === 'float')
      .map(([name]) => name);

    if (numericCols.length === 0) {
      return {
        id: this.generateId(),
        type: 'table',
        title: 'Top Values',
        content: 'No numeric columns found in the dataset.',
        timestamp: new Date()
      };
    }

    const col = numericCols[0];
    const sorted = [...data]
      .sort((a, b) => (b[col] as number) - (a[col] as number))
      .slice(0, 10);

    let content = `## Top 10 Highest Values in ${col}\n\n`;
    content += `| Rank | ${col} | \n|------|------|\n`;
    sorted.forEach((row, i) => {
      content += `| ${i + 1} | ${row[col]} |\n`;
    });

    return {
      id: this.generateId(),
      type: 'table',
      title: `Top 10 ${col} Values`,
      content,
      rawData: sorted,
      timestamp: new Date()
    };
  }

  private generateCorrelation(query: string, dataset: ParsedDataset): AnalysisResult {
    const { data, metadata } = dataset;
    const numericCols = Object.entries(metadata.columnTypes)
      .filter(([_, type]) => type === 'integer' || type === 'float')
      .map(([name]) => name);

    if (numericCols.length < 2) {
      return {
        id: this.generateId(),
        type: 'insight',
        title: 'Correlation Analysis',
        content: 'Not enough numeric columns to perform correlation analysis. Need at least 2 numeric columns.',
        timestamp: new Date()
      };
    }

    // Calculate basic correlations
    const correlations: string[] = [];
    for (let i = 0; i < Math.min(numericCols.length, 3); i++) {
      for (let j = i + 1; j < Math.min(numericCols.length, 3); j++) {
        const col1 = numericCols[i];
        const col2 = numericCols[j];
        const corr = this.calculateCorrelation(data, col1, col2);
        correlations.push(`- **${col1}** and **${col2}**: ${corr > 0 ? 'positive' : 'negative'} correlation (${corr.toFixed(2)})`);
      }
    }

    return {
      id: this.generateId(),
      type: 'insight',
      title: 'Correlation Analysis',
      content: `## Correlation Analysis\n\n${correlations.join('\n\n')}\n\nThis analysis shows the relationship between numeric variables in your dataset. Values close to 1 indicate strong positive correlation, while values close to -1 indicate strong negative correlation.`,
      timestamp: new Date()
    };
  }

  private calculateCorrelation(data: any[], col1: string, col2: string): number {
    const values = data.filter(row => 
      typeof row[col1] === 'number' && typeof row[col2] === 'number'
    );
    
    if (values.length < 2) return 0;

    const n = values.length;
    const sum1 = values.reduce((s, r) => s + r[col1], 0);
    const sum2 = values.reduce((s, r) => s + r[col2], 0);
    const sum1Sq = values.reduce((s, r) => s + r[col1] * r[col1], 0);
    const sum2Sq = values.reduce((s, r) => s + r[col2] * r[col2], 0);
    const pSum = values.reduce((s, r) => s + r[col1] * r[col2], 0);

    const num = n * pSum - sum1 * sum2;
    const den = Math.sqrt((n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2));

    return den === 0 ? 0 : num / den;
  }

  private generateInsights(query: string, dataset: ParsedDataset): AnalysisResult {
    const { data, metadata } = dataset;
    const insights: string[] = [];

    // Basic insights
    insights.push(`- Dataset contains **${metadata.rowCount} records** across **${metadata.columnNames.length} fields**`);
    
    // Check for missing values
    const missingCounts: { [key: string]: number } = {};
    data.forEach(row => {
      metadata.columnNames.forEach(col => {
        if (!row[col] || row[col] === '') {
          missingCounts[col] = (missingCounts[col] || 0) + 1;
        }
      });
    });

    const colsWithMissing = Object.entries(missingCounts).filter(([_, v]) => v > 0);
    if (colsWithMissing.length > 0) {
      insights.push(`- **${colsWithMissing.length} columns** have missing values`);
    }

    // Numeric insights
    const numericCols = Object.entries(metadata.columnTypes)
      .filter(([_, type]) => type === 'integer' || type === 'float')
      .map(([name]) => name);

    if (numericCols.length > 0) {
      insights.push(`- **${numericCols.length} numeric columns** available for analysis`);
    }

    return {
      id: this.generateId(),
      type: 'insight',
      title: 'Data Insights',
      content: `## Key Insights\n\n${insights.join('\n')}\n\n---\n\nThis analysis provides an overview of your dataset's structure and quality. Use the AI chat to ask specific questions about patterns, trends, or anomalies in your data.`,
      timestamp: new Date()
    };
  }

  private generateGeneralResponse(query: string, dataset: ParsedDataset): AnalysisResult {
    const { metadata } = dataset;
    
    return {
      id: this.generateId(),
      type: 'summary',
      title: 'AI Response',
      content: `## Response to: "${query}"\n\nI've analyzed your dataset (${metadata.filename}) which contains ${metadata.rowCount} rows and ${metadata.columnNames.length} columns.\n\n**Available columns:** ${metadata.columnNames.join(', ')}\n\nYou can ask me to:\n- 📊 "Summarize this dataset"\n- 📈 "Generate a chart"\n- 🔝 "Show top 10 values"\n- 🔗 "Find correlations"\n- 💡 "Provide insights"\n\nWhat would you like to explore?`,
      timestamp: new Date()
    };
  }

  private generateColors(count: number): string[] {
    const colors = [
      '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    return Array(count).fill(0).map((_, i) => colors[i % colors.length]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getResults(): AnalysisResult[] {
    return this.results.value;
  }

  clearResults() {
    this.results.next([]);
    localStorage.removeItem('ai-analysis-results');
  }

  deleteResult(id: string) {
    const filtered = this.results.value.filter(r => r.id !== id);
    this.results.next(filtered);
    this.saveResults();
  }
}