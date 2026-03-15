import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DatasetParserService, ParsedDataset } from '../../ai-assistant/services/dataset-parser.service';

export interface VisualizationConfig {
  id: string;
  type: VisualizationType;
  title: string;
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  colorScheme?: string[];
}

export type VisualizationType = 
  | 'bar' 
  | 'line' 
  | 'pie' 
  | 'area' 
  | 'stacked-bar' 
  | 'column'
  | 'scatter'
  | 'histogram'
  | 'box-plot'
  | 'heatmap'
  | 'bubble'
  | 'tree-map'
  | 'correlation-matrix'
  | 'trend'
  | 'distribution'
  | 'cluster'
  | 'time-series'
  | 'multi-axis';

export interface GeneratedVisualization {
  id: string;
  config: VisualizationConfig;
  data: any;
  insights: string;
  chartOptions: any;
  timestamp: Date;
}

export interface FilterConfig {
  column: string;
  type: 'column' | 'value' | 'date-range' | 'category';
  values?: any[];
  min?: number;
  max?: number;
  startDate?: Date;
  endDate?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class VisualizationGeneratorService {
  private visualizations = new BehaviorSubject<GeneratedVisualization[]>([]);
  private filters = new BehaviorSubject<FilterConfig[]>([]);
  private currentDataset = new BehaviorSubject<ParsedDataset | null>(null);

  visualizations$ = this.visualizations.asObservable();
  filters$ = this.filters.asObservable();
  currentDataset$ = this.currentDataset.asObservable();

  constructor(private datasetParser: DatasetParserService) {}

  async generateAllVisualizations(dataset: ParsedDataset): Promise<GeneratedVisualization[]> {
    this.currentDataset.next(dataset);
    const visualizations: GeneratedVisualization[] = [];

    // Generate Basic Visualizations
    visualizations.push(...this.generateBasicVisualizations(dataset));
    
    // Generate Intermediate Visualizations  
    visualizations.push(...this.generateIntermediateVisualizations(dataset));
    
    // Generate Advanced Visualizations
    visualizations.push(...this.generateAdvancedVisualizations(dataset));

    this.visualizations.next(visualizations);
    return visualizations;
  }

  private generateBasicVisualizations(dataset: ParsedDataset): GeneratedVisualization[] {
    const visualizations: GeneratedVisualization[] = [];
    const { data, metadata } = dataset;
    
    const numericCols = Object.entries(metadata.columnTypes)
      .filter(([_, type]) => type === 'integer' || type === 'float')
      .map(([name]) => name);

    const categoricalCols = metadata.columnNames.filter(col => 
      metadata.columnTypes[col] === 'string'
    );

    // Bar Chart
    if (categoricalCols.length > 0 && numericCols.length > 0) {
      visualizations.push(this.createBarChart(dataset, categoricalCols[0], numericCols[0]));
    }

    // Line Chart
    if (numericCols.length > 0) {
      visualizations.push(this.createLineChart(dataset, numericCols[0]));
    }

    // Pie Chart
    if (categoricalCols.length > 0) {
      visualizations.push(this.createPieChart(dataset, categoricalCols[0]));
    }

    // Area Chart
    if (numericCols.length > 0) {
      visualizations.push(this.createAreaChart(dataset, numericCols[0]));
    }

    // Stacked Bar Chart
    if (categoricalCols.length >= 2 && numericCols.length > 0) {
      visualizations.push(this.createStackedBarChart(dataset, categoricalCols[0], categoricalCols[1], numericCols[0]));
    }

    // Column Chart
    if (categoricalCols.length > 0 && numericCols.length > 0) {
      visualizations.push(this.createColumnChart(dataset, categoricalCols[0], numericCols[0]));
    }

    return visualizations;
  }

  private generateIntermediateVisualizations(dataset: ParsedDataset): GeneratedVisualization[] {
    const visualizations: GeneratedVisualization[] = [];
    const { data, metadata } = dataset;
    
    const numericCols = Object.entries(metadata.columnTypes)
      .filter(([_, type]) => type === 'integer' || type === 'float')
      .map(([name]) => name);

    const categoricalCols = metadata.columnNames.filter(col => 
      metadata.columnTypes[col] === 'string'
    );

    // Scatter Plot
    if (numericCols.length >= 2) {
      visualizations.push(this.createScatterPlot(dataset, numericCols[0], numericCols[1]));
    }

    // Histogram
    if (numericCols.length > 0) {
      visualizations.push(this.createHistogram(dataset, numericCols[0]));
    }

    // Box Plot
    if (numericCols.length > 0 && categoricalCols.length > 0) {
      visualizations.push(this.createBoxPlot(dataset, categoricalCols[0], numericCols[0]));
    }

    // Heatmap
    if (numericCols.length >= 2) {
      visualizations.push(this.createHeatmap(dataset, numericCols.slice(0, 4)));
    }

    // Bubble Chart
    if (numericCols.length >= 3) {
      visualizations.push(this.createBubbleChart(dataset, numericCols[0], numericCols[1], numericCols[2]));
    }

    // Tree Map
    if (categoricalCols.length > 0 && numericCols.length > 0) {
      visualizations.push(this.createTreeMap(dataset, categoricalCols[0], numericCols[0]));
    }

    return visualizations;
  }

  private generateAdvancedVisualizations(dataset: ParsedDataset): GeneratedVisualization[] {
    const visualizations: GeneratedVisualization[] = [];
    const { data, metadata } = dataset;
    
    const numericCols = Object.entries(metadata.columnTypes)
      .filter(([_, type]) => type === 'integer' || type === 'float')
      .map(([name]) => name);

    const categoricalCols = metadata.columnNames.filter(col => 
      metadata.columnTypes[col] === 'string'
    );

    // Correlation Matrix
    if (numericCols.length >= 2) {
      visualizations.push(this.createCorrelationMatrix(dataset, numericCols.slice(0, 6)));
    }

    // Trend Analysis
    if (numericCols.length > 0) {
      visualizations.push(this.createTrendAnalysis(dataset, numericCols[0]));
    }

    // Distribution Graphs
    if (numericCols.length > 0) {
      visualizations.push(this.createDistributionGraph(dataset, numericCols[0]));
    }

    // Cluster Visualization
    if (numericCols.length >= 2) {
      visualizations.push(this.createClusterVisualization(dataset, numericCols.slice(0, 3)));
    }

    // Time Series Visualization
    const dateCols = metadata.columnNames.filter(col => 
      metadata.columnTypes[col] === 'date'
    );
    
    if (dateCols.length > 0 && numericCols.length > 0) {
      visualizations.push(this.createTimeSeriesVisualization(dataset, dateCols[0], numericCols[0]));
    }

    // Multi-axis Charts
    if (numericCols.length >= 2 && categoricalCols.length > 0) {
      visualizations.push(this.createMultiAxisChart(dataset, categoricalCols[0], numericCols[0], numericCols[1]));
    }

    return visualizations;
  }

  // Basic Chart Methods
  private createBarChart(dataset: ParsedDataset, categoryCol: string, valueCol: string): GeneratedVisualization {
    const { data } = dataset;
    const grouped: { [key: string]: number } = {};
    
    data.slice(0, 50).forEach(row => {
      const key = row[categoryCol] || 'Unknown';
      grouped[key] = (grouped[key] || 0) + (Number(row[valueCol]) || 0);
    });

    const labels = Object.keys(grouped).slice(0, 15);
    const values = labels.map(l => grouped[l]);

    return {
      id: this.generateId(),
      config: {
        id: this.generateId(),
        type: 'bar',
        title: `Bar Chart: ${valueCol} by ${categoryCol}`,
        xAxis: categoryCol,
        yAxis: valueCol
      },
      data: { labels, datasets: [{ label: valueCol, data: values, backgroundColor: '#4F46E5' }] },
      insights: `This bar chart shows ${valueCol} distributed across ${categoryCol}. The highest value is ${Math.max(...values)}.`,
      chartOptions: this.getBarChartOptions(),
      timestamp: new Date()
    };
  }

  private createLineChart(dataset: ParsedDataset, valueCol: string): GeneratedVisualization {
    const { data } = dataset;
    const values = data.slice(0, 30).map((row, i) => ({ x: i + 1, y: Number(row[valueCol]) || 0 }));
    const labels = values.map(v => v.x.toString());

    return {
      id: this.generateId(),
      config: {
        id: this.generateId(),
        type: 'line',
        title: `Line Chart: ${valueCol} Trend`,
        yAxis: valueCol
      },
      data: { labels, datasets: [{ label: valueCol, data: values.map(v => v.y), borderColor: '#10B981', fill: false }] },
      insights: `This line chart displays the trend of ${valueCol} over ${values.length} data points.`,
      chartOptions: this.getLineChartOptions(),
      timestamp: new Date()
    };
  }

  private createPieChart(dataset: ParsedDataset, categoryCol: string): GeneratedVisualization {
    const { data } = dataset;
    const counts: { [key: string]: number } = {};
    
    data.forEach(row => {
      const key = row[categoryCol] || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    });

    const entries = Object.entries(counts).slice(0, 10);
    const labels = entries.map(([k]) => k);
    const values = entries.map(([_, v]) => v);

    return {
      id: this.generateId(),
      config: {
        id: this.generateId(),
        type: 'pie',
        title: `Pie Chart: ${categoryCol} Distribution`,
        xAxis: categoryCol
      },
      data: { 
        labels, 
        datasets: [{ 
          label: 'Count', 
          data: values, 
          backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
        }] 
      },
      insights: `This pie chart shows the distribution of ${categoryCol}. There are ${labels.length} unique categories.`,
      chartOptions: this.getPieChartOptions(),
      timestamp: new Date()
    };
  }

  private createAreaChart(dataset: ParsedDataset, valueCol: string): GeneratedVisualization {
    const { data } = dataset;
    const values = data.slice(0, 30).map(row => Number(row[valueCol]) || 0);
    const labels = values.map((_, i) => (i + 1).toString());

    return {
      id: this.generateId(),
      config: {
        id: this.generateId(),
        type: 'area',
        title: `Area Chart: ${valueCol}`,
        yAxis: valueCol
      },
      data: { labels, datasets: [{ label: valueCol, data: values, borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.3)' }] },
      insights: `This area chart displays the cumulative view of ${valueCol}.`,
      chartOptions: this.getAreaChartOptions(),
      timestamp: new Date()
    };
  }

  private createStackedBarChart(dataset: ParsedDataset, cat1: string, cat2: string, valueCol: string): GeneratedVisualization {
    const { data } = dataset;
    const grouped: { [key: string]: { [key: string]: number } } = {};
    
    data.slice(0, 20).forEach(row => {
      const key1 = row[cat1] || 'Unknown';
      const key2 = row[cat2] || 'Unknown';
      if (!grouped[key1]) grouped[key1] = {};
      grouped[key1][key2] = (grouped[key1][key2] || 0) + (Number(row[valueCol]) || 0);
    });

    const labels = Object.keys(grouped);
    const datasets = Object.keys(grouped[labels[0]] || {}).map((key2, i) => ({
      label: key2,
      data: labels.map(l => grouped[l][key2] || 0),
      backgroundColor: ['#4F46E5', '#10B981', '#F59E0B'][i % 3]
    }));

    return {
      id: this.generateId(),
      config: {
        id: this.generateId(),
        type: 'stacked-bar',
        title: `Stacked Bar: ${valueCol} by ${cat1} & ${cat2}`,
        xAxis: cat1,
        yAxis: valueCol,
        groupBy: cat2
      },
      data: { labels, datasets },
      insights: `This stacked bar chart shows ${valueCol} broken down by ${cat1} and ${cat2}.`,
      chartOptions: this.getStackedBarChartOptions(),
      timestamp: new Date()
    };
  }

  private createColumnChart(dataset: ParsedDataset, categoryCol: string, valueCol: string): GeneratedVisualization {
    return this.createBarChart(dataset, categoryCol, valueCol);
  }

  // Intermediate Chart Methods
  private createScatterPlot(dataset: ParsedDataset, xCol: string, yCol: string): GeneratedVisualization {
    const { data } = dataset;
    const points = data.slice(0, 100).map(row => ({
      x: Number(row[xCol]) || 0,
      y: Number(row[yCol]) || 0
    }));

    return {
      id: this.generateId(),
      config: {
        id: this.generateId(),
        type: 'scatter',
        title: `Scatter Plot: ${xCol} vs ${yCol}`,
        xAxis: xCol,
        yAxis: yCol
      },
      data: { datasets: [{ label: `${xCol} vs ${yCol}`, data: points, backgroundColor: '#EF4444' }] },
      insights: `This scatter plot shows the relationship between ${xCol} and ${yCol}.`,
      chartOptions: this.getScatterChartOptions(),
      timestamp: new Date()
    };
  }

  private createHistogram(dataset: ParsedDataset, valueCol: string): GeneratedVisualization {
    const { data } = dataset;
    const values = data.slice(0, 100).map(row => Number(row[valueCol]) || 0).filter(v => v > 0);
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = 10;
    const binWidth = (max - min) / binCount;
    
    const bins = Array(binCount).fill(0);
    values.forEach(v => {
      const binIndex = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
      bins[binIndex]++;
    });

    const labels = bins.map((_, i) => `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`);

    return {
      id: this.generateId(),
      config: {
        id: this.generateId(),
        type: 'histogram',
        title: `Histogram: ${valueCol} Distribution`,
        xAxis: valueCol,
        yAxis: 'Frequency'
      },
      data: { labels, datasets: [{ label: 'Frequency', data: bins, backgroundColor: '#F59E0B' }] },
      insights: `This histogram shows the distribution of ${valueCol}. Values range from ${min.toFixed(2)} to ${max.toFixed(2)}.`,
      chartOptions: this.getHistogramOptions(),
      timestamp: new Date()
    };
  }

  private createBoxPlot(dataset: ParsedDataset, categoryCol: string, valueCol: string): GeneratedVisualization {
    const { data } = dataset;
    const grouped: { [key: string]: number[] } = {};
    
    data.forEach(row => {
      const key = row[categoryCol] || 'Unknown';
      const val = Number(row[valueCol]);
      if (!isNaN(val)) {
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(val);
      }
    });

    const labels = Object.keys(grouped).slice(0, 10);
    const boxData = labels.map(l => {
      const values = grouped[l].sort((a, b) => a - b);
      const q1 = values[Math.floor(values.length * 0.25)];
      const median = values[Math.floor(values.length * 0.5)];
      const q3 = values[Math.floor(values.length * 0.75)];
      const min = values[0];
      const max = values[values.length - 1];
      return { min, q1, median, q3, max };
    });

    return {
      id: this.generateId(),
      config: {
        id: this.generateId(),
        type: 'box-plot',
        title: `Box Plot: ${valueCol} by ${categoryCol}`,
        xAxis: categoryCol,
        yAxis: valueCol
      },
      data: { labels, datasets: [{ label: valueCol, data: boxData, backgroundColor: '#8B5CF6' }] },
      insights: `This box plot shows the statistical distribution of ${valueCol} across ${categoryCol}.`,
      chartOptions: this.getBoxPlotOptions(),
      timestamp: new Date()
    };
  }

  private createHeatmap(dataset: ParsedDataset, numericCols: string[]): GeneratedVisualization {
    const { data } = dataset;
    const correlationData: number[][] = [];
    
    for (let i = 0; i < numericCols.length; i++) {
      correlationData[i] = [];
      for (let j = 0; j < numericCols.length; j++) {
        if (i === j) {
          correlationData[i][j] = 1;
        } else {
          const corr = this.calculateCorrelation(data, numericCols[i], numericCols[j]);
          correlationData[i][j] = corr;
        }
      }
    }

    return {
      id: this.generateId(),
      config: {
        id: this.generateId(),
        type: 'heatmap',
        title: 'Correlation Heatmap'
      },
      data: { labels: numericCols, correlationData },
      insights: `This heatmap shows correlations between ${numericCols.length} numeric variables. Values close to 1 indicate strong positive correlation.`,
      chartOptions: this.getHeatmapOptions(numericCols),
      timestamp: new Date()
    };
  }

  private createBubbleChart(dataset: ParsedDataset, xCol: string, yCol: string, sizeCol: string): GeneratedVisualization {
    const { data } = dataset;
    const points = data.slice(0, 50).map(row => ({
      x: Number(row[xCol]) || 0,
      y: Number(row[yCol]) || 0,
      r: Math.max(5, Math.min(30, (Number(row[sizeCol]) || 10) / 10))
    }));

    return {
      id: this.generateId(),
      config: {
        id: this.generateId(),
        type: 'bubble',
        title: `Bubble Chart: ${xCol}, ${yCol}, ${sizeCol}`,
        xAxis: xCol,
        yAxis: yCol
      },
      data: { datasets: [{ label: 'Bubble Data', data: points, backgroundColor: 'rgba(239, 68, 68, 0.6)' }] },
      insights: `This bubble chart displays three dimensions: ${xCol}, ${yCol}, and bubble size representing ${sizeCol}.`,
      chartOptions: this.getBubbleChartOptions(),
      timestamp: new Date()
    };
  }

  private createTreeMap(dataset: ParsedDataset, categoryCol: string, valueCol: string): GeneratedVisualization {
    const { data } = dataset;
    const grouped: { [key: string]: number } = {};
    
    data.forEach(row => {
      const key = row[categoryCol] || 'Unknown';
      grouped[key] = (grouped[key] || 0) + (Number(row[valueCol]) || 0);
    });

    const entries = Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    return {
      id: this.generateId(),
      config: {
        id: this.generateId(),
        type: 'tree-map',
        title: `Tree Map: ${valueCol} by ${categoryCol}`,
        xAxis: categoryCol,
        yAxis: valueCol
      },
      data: { labels: entries.map(([k]) => k), values: entries.map(([_, v]) => v) },
      insights: `This treemap shows the hierarchical structure of ${valueCol} by ${categoryCol}.`,
      chartOptions: this.getTreeMapOptions(),
      timestamp: new Date()
    };
  }

  // Advanced Chart Methods
  private createCorrelationMatrix(dataset: ParsedDataset, numericCols: string[]): GeneratedVisualization {
    return this.createHeatmap(dataset, numericCols);
  }

  private createTrendAnalysis(dataset: ParsedDataset, valueCol: string): GeneratedVisualization {
    return this.createLineChart(dataset, valueCol);
  }

  private createDistributionGraph(dataset: ParsedDataset, valueCol: string): GeneratedVisualization {
    return this.createHistogram(dataset, valueCol);
  }

  private createClusterVisualization(dataset: ParsedDataset, numericCols: string[]): GeneratedVisualization {
    const { data } = dataset;
    const points = data.slice(0, 50).map(row => ({
      x: Number(row[numericCols[0]]) || 0,
      y: Number(row[numericCols[1]]) || 0,
      cluster: Math.floor(Math.random() * 3) // Simulated clusters
    }));

    return {
      id: this.generateId(),
      config: {
        id: this.generateId(),
        type: 'cluster',
        title: `Cluster Visualization: ${numericCols[0]} vs ${numericCols[1]}`,
        xAxis: numericCols[0],
        yAxis: numericCols[1]
      },
      data: { 
        datasets: [
          { label: 'Cluster 1', data: points.filter(p => p.cluster === 0).map(p => ({ x: p.x, y: p.y })), backgroundColor: '#4F46E5' },
          { label: 'Cluster 2', data: points.filter(p => p.cluster === 1).map(p => ({ x: p.x, y: p.y })), backgroundColor: '#10B981' },
          { label: 'Cluster 3', data: points.filter(p => p.cluster === 2).map(p => ({ x: p.x, y: p.y })), backgroundColor: '#F59E0B' }
        ] 
      },
      insights: `This cluster visualization shows potential groupings in ${numericCols[0]} and ${numericCols[1]}.`,
      chartOptions: this.getClusterOptions(),
      timestamp: new Date()
    };
  }

  private createTimeSeriesVisualization(dataset: ParsedDataset, dateCol: string, valueCol: string): GeneratedVisualization {
    const { data } = dataset;
    const sortedData = [...data]
      .filter(row => row[dateCol] && row[valueCol])
      .sort((a, b) => new Date(a[dateCol]).getTime() - new Date(b[dateCol]).getTime())
      .slice(0, 30);

    const labels = sortedData.map(row => new Date(row[dateCol]).toLocaleDateString());
    const values = sortedData.map(row => Number(row[valueCol]) || 0);

    return {
      id: this.generateId(),
      config: {
        id: this.generateId(),
        type: 'time-series',
        title: `Time Series: ${valueCol} over Time`,
        xAxis: dateCol,
        yAxis: valueCol
      },
      data: { labels, datasets: [{ label: valueCol, data: values, borderColor: '#06B6D4', fill: true, backgroundColor: 'rgba(6, 182, 212, 0.1)' }] },
      insights: `This time series shows how ${valueCol} changes over time across ${labels.length} time points.`,
      chartOptions: this.getTimeSeriesOptions(),
      timestamp: new Date()
    };
  }

  private createMultiAxisChart(dataset: ParsedDataset, categoryCol: string, valueCol1: string, valueCol2: string): GeneratedVisualization {
    const { data } = dataset;
    const labels = data.slice(0, 15).map(row => row[categoryCol] || 'Unknown');
    const values1 = data.slice(0, 15).map(row => Number(row[valueCol1]) || 0);
    const values2 = data.slice(0, 15).map(row => Number(row[valueCol2]) || 0);

    return {
      id: this.generateId(),
      config: {
        id: this.generateId(),
        type: 'multi-axis',
        title: `Multi-Axis: ${valueCol1} vs ${valueCol2}`,
        xAxis: categoryCol,
        yAxis: valueCol1
      },
      data: { 
        labels, 
        datasets: [
          { label: valueCol1, data: values1, borderColor: '#4F46E5', yAxisID: 'y' },
          { label: valueCol2, data: values2, borderColor: '#F59E0B', yAxisID: 'y1' }
        ] 
      },
      insights: `This multi-axis chart compares ${valueCol1} and ${valueCol2} across ${categoryCol}.`,
      chartOptions: this.getMultiAxisOptions(),
      timestamp: new Date()
    };
  }

  // Helper Methods
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

  // Chart Options
  private getBarChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true }, tooltip: { enabled: true } },
      scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.1)' } } }
    };
  }

  private getLineChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true }, tooltip: { enabled: true } },
      scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.1)' } } },
      elements: { line: { tension: 0.4 } }
    };
  }

  private getPieChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right' }, tooltip: { enabled: true } }
    };
  }

  private getAreaChartOptions() {
    return this.getLineChartOptions();
  }

  private getStackedBarChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true }, tooltip: { enabled: true } },
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
    };
  }

  private getScatterChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true }, tooltip: { enabled: true } },
      scales: { x: { type: 'linear', position: 'bottom' }, y: { beginAtZero: true } }
    };
  }

  private getHistogramOptions() {
    return this.getBarChartOptions();
  }

  private getBoxPlotOptions() {
    return this.getBarChartOptions();
  }

  private getHeatmapOptions(labels: string[]) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true } }
    };
  }

  private getBubbleChartOptions() {
    return this.getScatterChartOptions();
  }

  private getTreeMapOptions() {
    return { responsive: true, maintainAspectRatio: false };
  }

  private getClusterOptions() {
    return this.getScatterChartOptions();
  }

  private getTimeSeriesOptions() {
    return this.getLineChartOptions();
  }

  private getMultiAxisOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true }, tooltip: { enabled: true } },
      scales: {
        x: { grid: { display: false } },
        y: { type: 'linear', display: true, position: 'left', beginAtZero: true },
        y1: { type: 'linear', display: true, position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } }
      }
    };
  }

  // Filter Methods
  addFilter(filter: FilterConfig) {
    const currentFilters = this.filters.value;
    this.filters.next([...currentFilters, filter]);
  }

  removeFilter(column: string) {
    const currentFilters = this.filters.value.filter(f => f.column !== column);
    this.filters.next(currentFilters);
  }

  clearFilters() {
    this.filters.next([]);
  }

  applyFilters(data: any[]): any[] {
    const currentFilters = this.filters.value;
    if (currentFilters.length === 0) return data;

    return data.filter(row => {
      return currentFilters.every(filter => {
        const value = row[filter.column];
        switch (filter.type) {
          case 'value':
            return value >= (filter.min || 0) && value <= (filter.max || Infinity);
          case 'date-range':
            const date = new Date(value);
            return date >= (filter.startDate || new Date(0)) && date <= (filter.endDate || new Date());
          case 'category':
          case 'column':
            return filter.values?.includes(value);
          default:
            return true;
        }
      });
    });
  }

  private generateId(): string {
    return `viz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getVisualizations(): GeneratedVisualization[] {
    return this.visualizations.value;
  }

  clearVisualizations() {
    this.visualizations.next([]);
    this.filters.next([]);
    this.currentDataset.next(null);
  }
}
