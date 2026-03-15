import { Component, Input, Output, EventEmitter, OnInit, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subject, debounceTime } from 'rxjs';
import { GeneratedVisualization, VisualizationType } from '../../services/visualization-generator.service';

export interface ChartConfig {
  chartType: VisualizationType;
  xAxis: string;
  yAxis: string;
  aggregation: 'sum' | 'average' | 'count' | 'min' | 'max';
  scale: 'linear' | 'logarithmic' | 'auto';
}

@Component({
  selector: 'app-visualization-chart-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visualization-chart-card.component.html',
  styleUrls: ['./visualization-chart-card.component.css']
})
export class VisualizationChartCardComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() visualization!: GeneratedVisualization;
  @Input() isSelected = false;
  @Input() datasetData: any[] = [];
  @Input() columnNames: string[] = [];
  @Input() numericColumns: string[] = [];
  @Input() categoricalColumns: string[] = [];
  @Output() refresh = new EventEmitter<void>();
  @Output() configChange = new EventEmitter<ChartConfig>();

  @ViewChild('chartCanvas') chartCanvas!: ElementRef;

  chartRendered = false;
  
  // Control options
  chartTypes: { value: VisualizationType; label: string; icon: string }[] = [
    { value: 'bar', label: 'Bar Chart', icon: '📊' },
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧' },
    { value: 'scatter', label: 'Scatter Plot', icon: '⚡' },
    { value: 'area', label: 'Area Chart', icon: '📉' },
    { value: 'histogram', label: 'Histogram', icon: '📊' },
    { value: 'bubble', label: 'Bubble Chart', icon: '⭕' }
  ];

  aggregations: { value: 'sum' | 'average' | 'count' | 'min' | 'max'; label: string }[] = [
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Min' },
    { value: 'max', label: 'Max' }
  ];

  scales: { value: 'linear' | 'logarithmic' | 'auto'; label: string }[] = [
    { value: 'linear', label: 'Linear' },
    { value: 'logarithmic', label: 'Logarithmic' },
    { value: 'auto', label: 'Auto' }
  ];

  // Current configuration
  currentConfig: ChartConfig = {
    chartType: 'bar',
    xAxis: '',
    yAxis: '',
    aggregation: 'sum',
    scale: 'linear'
  };

  // For debouncing updates
  private configUpdate$ = new Subject<ChartConfig>();
  private initialized = false;

  ngOnInit() {
    // Initialize config from visualization
    if (this.visualization?.config) {
      this.currentConfig = {
        chartType: this.visualization.config.type as VisualizationType,
        xAxis: this.visualization.config.xAxis || '',
        yAxis: this.visualization.config.yAxis || '',
        aggregation: 'sum',
        scale: 'linear'
      };
    }

    // Set default columns if not set
    if (!this.currentConfig.xAxis && this.categoricalColumns.length > 0) {
      this.currentConfig.xAxis = this.categoricalColumns[0];
    }
    if (!this.currentConfig.yAxis && this.numericColumns.length > 0) {
      this.currentConfig.yAxis = this.numericColumns[0];
    }

    // Setup debounced config updates
    this.configUpdate$.pipe(debounceTime(300)).subscribe(config => {
      this.updateChartData(config);
      this.configChange.emit(config);
    });
  }

  ngAfterViewInit() {
    this.initialized = true;
    setTimeout(() => {
      this.renderChart();
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.initialized && changes['visualization']) {
      setTimeout(() => {
        this.renderChart();
      }, 100);
    }
  }

  // Event handlers for control changes
  onChartTypeChange() {
    this.triggerConfigUpdate();
  }

  onXAxisChange() {
    this.triggerConfigUpdate();
  }

  onYAxisChange() {
    this.triggerConfigUpdate();
  }

  onAggregationChange() {
    this.triggerConfigUpdate();
  }

  onScaleChange() {
    this.triggerConfigUpdate();
  }

  private triggerConfigUpdate() {
    this.configUpdate$.next({ ...this.currentConfig });
  }

  private updateChartData(config: ChartConfig) {
    if (!this.datasetData || this.datasetData.length === 0) return;

    // Aggregate data based on configuration
    const aggregatedData = this.aggregateData(
      this.datasetData,
      config.xAxis,
      config.yAxis,
      config.aggregation,
      config.chartType
    );

    // Update visualization data
    this.visualization.data = aggregatedData;
    this.visualization.config.type = config.chartType;
    this.visualization.config.xAxis = config.xAxis;
    this.visualization.config.yAxis = config.yAxis;
    this.visualization.config.title = `${this.formatAggregation(config.aggregation)} ${config.yAxis} by ${config.xAxis}`;

    // Re-render chart
    setTimeout(() => this.renderChart(), 50);
  }

  private aggregateData(data: any[], xCol: string, yCol: string, agg: string, chartType: string): any {
    if (!xCol || !yCol) return this.visualization?.data || {};

    const grouped: { [key: string]: number[] } = {};
    
    data.forEach(row => {
      const key = row[xCol] || 'Unknown';
      if (!grouped[key]) grouped[key] = [];
      const val = Number(row[yCol]);
      if (!isNaN(val)) {
        grouped[key].push(val);
      }
    });

    const labels = Object.keys(grouped).slice(0, 20);
    let values: number[];

    switch (agg) {
      case 'sum':
        values = labels.map(l => grouped[l].reduce((a, b) => a + b, 0));
        break;
      case 'average':
        values = labels.map(l => grouped[l].reduce((a, b) => a + b, 0) / grouped[l].length);
        break;
      case 'count':
        values = labels.map(l => grouped[l].length);
        break;
      case 'min':
        values = labels.map(l => Math.min(...grouped[l]));
        break;
      case 'max':
        values = labels.map(l => Math.max(...grouped[l]));
        break;
      default:
        values = labels.map(l => grouped[l].reduce((a, b) => a + b, 0));
    }

    return {
      labels,
      datasets: [{
        label: yCol,
        data: values,
        backgroundColor: this.getChartColor(chartType),
        borderColor: this.getChartColor(chartType)
      }]
    };
  }

  private formatAggregation(agg: string): string {
    return agg.charAt(0).toUpperCase() + agg.slice(1);
  }

  private getChartColor(chartType: string): string | string[] {
    const colors: { [key: string]: string | string[] } = {
      'bar': '#4F46E5',
      'line': '#10B981',
      'pie': ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
      'scatter': '#EF4444',
      'area': '#8B5CF6',
      'histogram': '#F59E0B',
      'bubble': 'rgba(239, 68, 68, 0.6)'
    };
    return colors[chartType] || '#4F46E5';
  }

  renderChart() {
    if (!this.visualization || !this.chartCanvas) return;

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.visualization.data;
    const chartType = this.visualization.config.type;

    this.renderSimpleChart(ctx, chartType, data);
    this.chartRendered = true;
  }

  private renderSimpleChart(ctx: CanvasRenderingContext2D, type: string, data: any) {
    const canvas = ctx.canvas;
    const width = canvas.width || 800;
    const height = canvas.height || 400;
    const padding = 50;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw based on chart type
    switch (type) {
      case 'bar':
      case 'column':
        this.drawBarChart(ctx, data, width, height, padding);
        break;
      case 'line':
      case 'trend':
      case 'time-series':
        this.drawLineChart(ctx, data, width, height, padding);
        break;
      case 'pie':
        this.drawPieChart(ctx, data, width, height);
        break;
      case 'area':
        this.drawAreaChart(ctx, data, width, height, padding);
        break;
      case 'scatter':
        this.drawScatterChart(ctx, data, width, height, padding);
        break;
      case 'histogram':
      case 'distribution':
        this.drawHistogram(ctx, data, width, height, padding);
        break;
      case 'bubble':
        this.drawBubbleChart(ctx, data, width, height, padding);
        break;
      default:
        this.drawDefaultChart(ctx, data, width, height, padding);
    }
  }

  private drawBarChart(ctx: CanvasRenderingContext2D, data: any, width: number, height: number, padding: number) {
    const labels = data.labels || [];
    const datasets = data.datasets || [];
    if (!datasets.length) return;

    const values = datasets[0].data || [];
    const maxVal = Math.max(...values, 1);
    const barWidth = Math.min(60, (width - padding * 2) / labels.length - 10);
    const chartHeight = height - padding * 2;

    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw bars
    values.forEach((val: number, i: number) => {
      const barHeight = (val / maxVal) * chartHeight;
      const x = padding + i * (barWidth + 10) + 5;
      const y = height - padding - barHeight;

      // Bar gradient
      const gradient = ctx.createLinearGradient(x, y, x, height - padding);
      gradient.addColorStop(0, '#4F46E5');
      gradient.addColorStop(1, '#7C3AED');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Value label
      ctx.fillStyle = '#333';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(val.toFixed(0), x + barWidth / 2, y - 5);

      // X-axis label
      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      const label = labels[i] ? labels[i].toString().substring(0, 10) : '';
      ctx.fillText(label, x + barWidth / 2, height - padding + 20);
    });

    // Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    for (let i = 0; i <= 5; i++) {
      const y = height - padding - (i / 5) * chartHeight;
      const val = ((i / 5) * maxVal).toFixed(0);
      ctx.textAlign = 'right';
      ctx.fillText(val, padding - 10, y + 4);
      ctx.beginPath();
      ctx.moveTo(padding - 5, y);
      ctx.lineTo(padding, y);
      ctx.stroke();
    }
  }

  private drawLineChart(ctx: CanvasRenderingContext2D, data: any, width: number, height: number, padding: number) {
    const labels = data.labels || [];
    const datasets = data.datasets || [];
    if (!datasets.length) return;

    const values = datasets[0].data || [];
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const chartHeight = height - padding * 2;
    const step = (width - padding * 2) / Math.max(values.length - 1, 1);

    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw line with gradient
    ctx.beginPath();
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, '#10B981');
    gradient.addColorStop(1, '#10B981');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;

    values.forEach((val: number, i: number) => {
      const x = padding + i * step;
      const y = height - padding - ((val - minVal) / (maxVal - minVal || 1)) * chartHeight;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw points and labels
    values.forEach((val: number, i: number) => {
      const x = padding + i * step;
      const y = height - padding - ((val - minVal) / (maxVal - minVal || 1)) * chartHeight;
      
      // Point
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#10B981';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // X label
      if (i % Math.ceil(labels.length / 10) === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i]?.toString().substring(0, 8) || '', x, height - padding + 20);
      }
    });

    // Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    for (let i = 0; i <= 5; i++) {
      const y = height - padding - (i / 5) * chartHeight;
      const val = (minVal + (i / 5) * (maxVal - minVal)).toFixed(0);
      ctx.textAlign = 'right';
      ctx.fillText(val, padding - 10, y + 4);
    }
  }

  private drawPieChart(ctx: CanvasRenderingContext2D, data: any, width: number, height: number) {
    const labels = data.labels || [];
    const datasets = data.datasets || [];
    if (!datasets.length) return;

    const values = datasets[0].data || [];
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#A855F7'];
    const total = values.reduce((a: number, b: number) => a + b, 0);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;

    let startAngle = 0;
    values.forEach((val: number, i: number) => {
      const sliceAngle = (val / total) * Math.PI * 2;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      // Add border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle += sliceAngle;
    });

    // Draw legend
    const legendX = width - 120;
    const legendY = 20;
    labels.slice(0, 8).forEach((label: string, i: number) => {
      const y = legendY + i * 25;
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(legendX, y, 15, 15);
      ctx.fillStyle = '#333';
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(label?.toString().substring(0, 10) || '', legendX + 22, y + 12);
    });
  }

  private drawAreaChart(ctx: CanvasRenderingContext2D, data: any, width: number, height: number, padding: number) {
    const labels = data.labels || [];
    const datasets = data.datasets || [];
    if (!datasets.length) return;

    const values = datasets[0].data || [];
    const maxVal = Math.max(...values, 1);
    const chartHeight = height - padding * 2;
    const step = (width - padding * 2) / Math.max(values.length - 1, 1);

    // Draw area
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    
    values.forEach((val: number, i: number) => {
      const x = padding + i * step;
      const y = height - padding - (val / maxVal) * chartHeight;
      ctx.lineTo(x, y);
    });
    
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.7)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line on top
    ctx.beginPath();
    ctx.strokeStyle = '#8B5CF6';
    ctx.lineWidth = 2;
    values.forEach((val: number, i: number) => {
      const x = padding + i * step;
      const y = height - padding - (val / maxVal) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  private drawScatterChart(ctx: CanvasRenderingContext2D, data: any, width: number, height: number, padding: number) {
    const datasets = data.datasets || [];
    if (!datasets.length) return;

    const points = datasets[0].data || [];
    if (!points.length) return;

    const xValues = points.map((p: any) => p.x);
    const yValues = points.map((p: any) => p.y);
    const maxX = Math.max(...xValues, 1);
    const maxY = Math.max(...yValues, 1);
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw points
    points.forEach((point: any) => {
      const x = padding + (point.x / maxX) * chartWidth;
      const y = height - padding - (point.y / maxY) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  private drawHistogram(ctx: CanvasRenderingContext2D, data: any, width: number, height: number, padding: number) {
    this.drawBarChart(ctx, data, width, height, padding);
  }

  private drawBubbleChart(ctx: CanvasRenderingContext2D, data: any, width: number, height: number, padding: number) {
    const datasets = data.datasets || [];
    if (!datasets.length) return;

    const points = datasets[0].data || [];
    if (!points.length) return;

    const xValues = points.map((p: any) => p.x || 0);
    const yValues = points.map((p: any) => p.y || 0);
    const maxX = Math.max(...xValues, 1);
    const maxY = Math.max(...yValues, 1);
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw bubbles
    points.forEach((point: any, i: number) => {
      const x = padding + ((point.x || 0) / maxX) * chartWidth;
      const y = height - padding - ((point.y || 0) / maxY) * chartHeight;
      const r = Math.max(5, Math.min(30, (point.r || point.y || 10) / 10));
      
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.fill();
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  private drawDefaultChart(ctx: CanvasRenderingContext2D, data: any, width: number, height: number, padding: number) {
    this.drawBarChart(ctx, data, width, height, padding);
  }

  getChartTypeIcon(): string {
    const icons: { [key: string]: string } = {
      'bar': '📊',
      'line': '📈',
      'pie': '🥧',
      'area': '📉',
      'stacked-bar': '📊',
      'column': '📊',
      'scatter': '⚡',
      'histogram': '📊',
      'box-plot': '📦',
      'heatmap': '🔥',
      'bubble': '⭕',
      'tree-map': '🌳',
      'correlation-matrix': '🔗',
      'trend': '📈',
      'distribution': '📊',
      'cluster': '🎯',
      'time-series': '📅',
      'multi-axis': '🔄'
    };
    return icons[this.visualization?.config?.type] || '📊';
  }

  getChartTypeColor(): string {
    const colors: { [key: string]: string } = {
      'bar': '#4F46E5',
      'line': '#10B981',
      'pie': '#F59E0B',
      'area': '#8B5CF6',
      'stacked-bar': '#EC4899',
      'column': '#06B6D4',
      'scatter': '#EF4444',
      'histogram': '#F97316',
      'box-plot': '#84CC16',
      'heatmap': '#6366F1',
      'bubble': '#14B8A6',
      'tree-map': '#A855F7',
      'correlation-matrix': '#22C55E',
      'trend': '#3B82F6',
      'distribution': '#EAB308',
      'cluster': '#F43F5E',
      'time-series': '#0EA5E9',
      'multi-axis': '#E879F9'
    };
    return colors[this.visualization?.config?.type] || '#4F46E5';
  }

  onRefresh() {
    this.refresh.emit();
    setTimeout(() => this.renderChart(), 100);
  }
}
