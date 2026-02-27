import { Injectable } from '@angular/core';
import { ChartConfiguration, ChartEvent, ChartOptions } from 'chart.js';

export interface DrillDownData {
  label: string;
  value: number;
  originalLabel: string;
  details?: {
    count: number;
    percentage: number;
    category?: string;
    date?: string;
  };
}

export interface ChartInteractionConfig {
  enableDrillDown: boolean;
  enableZoom: boolean;
  enableHoverDetails: boolean;
  drillDownCallback?: (data: DrillDownData) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ChartConfigService {
  
  // Power BI-inspired color palette
  readonly powerBIColors = [
    'rgba(0, 120, 212, 0.85)',    // Blue
    'rgba(127, 127, 127, 0.85)',   // Gray
    'rgba(255, 185, 0, 0.85)',     // Yellow/Gold
    'rgba(216, 30, 40, 0.85)',     // Red
    'rgba(16, 124, 16, 0.85)',     // Green
    'rgba(0, 153, 153, 0.85)',    // Teal
    'rgba(204, 51, 204, 0.85)',   // Purple
    'rgba(255, 102, 0, 0.85)',    // Orange
    'rgba(0, 102, 204, 0.85)',    // Light Blue
    'rgba(102, 102, 102, 0.85)',  // Dark Gray
  ];

  readonly powerBIBorderColors = [
    'rgba(0, 120, 212, 1)',
    'rgba(127, 127, 127, 1)',
    'rgba(255, 185, 0, 1)',
    'rgba(216, 30, 40, 1)',
    'rgba(16, 124, 16, 1)',
    'rgba(0, 153, 153, 1)',
    'rgba(204, 51, 204, 1)',
    'rgba(255, 102, 0, 1)',
    'rgba(0, 102, 204, 1)',
    'rgba(102, 102, 102, 1)',
  ];

  // Drill-down state
  private drillDownStack: { label: string; data: DrillDownData[] }[] = [];
  private currentDrillLevel = 0;

  constructor() {}

  /**
   * Get Power BI-style bar chart options with all interactive features
   */
  getBarChartOptions(config?: ChartInteractionConfig): ChartConfiguration['options'] {
    const enableDrillDown = config?.enableDrillDown ?? true;
    const enableZoom = config?.enableZoom ?? false;
    const enableHover = config?.enableHoverDetails ?? true;

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
          position: 'top',
          labels: {
            font: {
              family: "'Segoe UI', 'Roboto', sans-serif",
              size: 12
            },
            usePointStyle: true,
            padding: 20
          }
        },
        title: {
          display: true,
          font: {
            family: "'Segoe UI', 'Roboto', sans-serif",
            size: 16,
            weight: 'bold' as const
          },
          color: '#333',
          padding: { bottom: 20 }
        },
        tooltip: {
          enabled: enableHover,
          backgroundColor: 'rgba(50, 50, 50, 0.95)',
          titleFont: {
            family: "'Segoe UI', 'Roboto', sans-serif",
            size: 14,
            weight: 'bold' as const
          },
          bodyFont: {
            family: "'Segoe UI', 'Roboto', sans-serif",
            size: 13
          },
          padding: 12,
          cornerRadius: 8,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          displayColors: true,
          boxPadding: 6,
          callbacks: {
            title: (items) => {
              if (items.length > 0) {
                return `📊 ${items[0].label}`;
              }
              return '';
            },
            label: (context) => {
              const value = context.parsed.y ?? 0;
              const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return [
                `   Value: ${value.toLocaleString()}`,
                `   Share: ${percentage}%`,
                `   Total: ${total.toLocaleString()}`
              ];
            },
            afterLabel: () => '\n💡 Click to drill down'
          }
        }
        // Zoom plugin is handled separately via chartjs-plugin-zoom
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawTicks: true,
          },
          ticks: {
            font: {
              family: "'Segoe UI', 'Roboto', sans-serif",
              size: 11
            },
            color: '#666',
            maxRotation: 45,
            minRotation: 0
          },
          border: {
            display: true,
            color: 'rgba(0, 0, 0, 0.08)'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            lineWidth: 1
          },
          ticks: {
            font: {
              family: "'Segoe UI', 'Roboto', sans-serif",
              size: 11
            },
            color: '#666',
            padding: 8,
            callback: (value) => {
              if (typeof value === 'number') {
                if (value >= 1000000) {
                  return (value / 1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return (value / 1000).toFixed(1) + 'K';
                }
              }
              return value;
            }
          },
          border: {
            display: false
          }
        }
      },
      onClick: enableDrillDown ? (event, elements, chart) => {
        if (elements.length > 0 && config?.drillDownCallback) {
          const index = elements[0].index;
          const label = chart.data.labels?.[index] as string;
          const value = chart.data.datasets[0].data[index] as number;
          
          const drillData: DrillDownData = {
            label: label,
            value: value,
            originalLabel: label,
            details: {
              count: value,
              percentage: 0,
              category: label
            }
          };
          
          config.drillDownCallback(drillData);
        }
      } : undefined,
      onHover: (event, elements, chart) => {
        const canvas = event.native?.target as HTMLCanvasElement;
        if (canvas) {
          canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
        }
      }
    };
  }

  /**
   * Get Power BI-style line chart options with zoom support
   */
  getLineChartOptions(config?: ChartInteractionConfig): ChartConfiguration['options'] {
    const enableZoom = config?.enableZoom ?? true;
    const enableHover = config?.enableHoverDetails ?? true;

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              family: "'Segoe UI', 'Roboto', sans-serif",
              size: 12
            },
            usePointStyle: true,
            padding: 20
          }
        },
        title: {
          display: true,
          font: {
            family: "'Segoe UI', 'Roboto', sans-serif",
            size: 16,
            weight: 'bold' as const
          },
          color: '#333',
          padding: { bottom: 20 }
        },
        tooltip: {
          enabled: enableHover,
          backgroundColor: 'rgba(50, 50, 50, 0.95)',
          titleFont: {
            family: "'Segoe UI', 'Roboto', sans-serif",
            size: 14,
            weight: 'bold' as const
          },
          bodyFont: {
            family: "'Segoe UI', 'Roboto', sans-serif",
            size: 13
          },
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            title: (items) => {
              if (items.length > 0) {
                return `📈 ${items[0].label}`;
              }
              return '';
            },
            label: (context) => {
              const value = context.parsed.y ?? 0;
              const datasetLabel = context.dataset.label || 'Value';
              return `   ${datasetLabel}: ${value.toLocaleString()}`;
            },
            afterBody: (items) => {
              if (items.length > 1) {
                const total = items.reduce((sum, item) => sum + (item.parsed.y ?? 0), 0);
                return [`\n📊 Total: ${total.toLocaleString()}`];
              }
              return [];
            }
          }
        }
        // Zoom plugin is handled separately via chartjs-plugin-zoom
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: "'Segoe UI', 'Roboto', sans-serif",
              size: 11
            },
            color: '#666',
            maxRotation: 45
          },
          border: {
            display: true,
            color: 'rgba(0, 0, 0, 0.08)'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              family: "'Segoe UI', 'Roboto', sans-serif",
              size: 11
            },
            color: '#666',
            padding: 8
          },
          border: {
            display: false
          }
        }
      },
      elements: {
        line: {
          tension: 0.4,
          borderWidth: 3
        },
        point: {
          radius: 4,
          hoverRadius: 8,
          hoverBorderWidth: 3
        }
      }
    };
  }

  /**
   * Get Power BI-style pie/doughnut chart options
   */
  getPieChartOptions(config?: ChartInteractionConfig): ChartConfiguration['options'] {
    const enableHover = config?.enableHoverDetails ?? true;
    const enableDrillDown = config?.enableDrillDown ?? true;

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
      },
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            font: {
              family: "'Segoe UI', 'Roboto', sans-serif",
              size: 12
            },
            usePointStyle: true,
            padding: 15,
            generateLabels: (chart) => {
              const data = chart.data;
              if (data.labels && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const value = data.datasets[0].data[i];
                  const total = (data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
                  const percentage = ((value as number) / total * 100).toFixed(1);
                  return {
                    text: `${label} (${percentage}%)`,
                    fillStyle: this.powerBIColors[i % this.powerBIColors.length],
                    strokeStyle: this.powerBIColors[i % this.powerBIColors.length],
                    hidden: false,
                    index: i,
                    pointStyle: 'circle'
                  };
                });
              }
              return [];
            }
          }
        },
        title: {
          display: true,
          font: {
            family: "'Segoe UI', 'Roboto', sans-serif",
            size: 16,
            weight: 'bold' as const
          },
          color: '#333',
          padding: { bottom: 20 }
        },
        tooltip: {
          enabled: enableHover,
          backgroundColor: 'rgba(50, 50, 50, 0.95)',
          titleFont: {
            family: "'Segoe UI', 'Roboto', sans-serif",
            size: 14,
            weight: 'bold' as const
          },
          bodyFont: {
            family: "'Segoe UI', 'Roboto', sans-serif",
            size: 13
          },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            title: (items) => {
              if (items.length > 0) {
                return `🍩 ${items[0].label}`;
              }
              return '';
            },
            label: (context) => {
              const value = context.parsed ?? 0;
              const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return [
                `   Count: ${value.toLocaleString()}`,
                `   Share: ${percentage}%`,
                `   Total: ${total.toLocaleString()}`
              ];
            },
            afterLabel: enableDrillDown ? (() => '\n💡 Click to drill down') : undefined
          }
        }
      },
      onClick: enableDrillDown ? (event, elements, chart) => {
        if (elements.length > 0 && config?.drillDownCallback) {
          const index = elements[0].index;
          const label = chart.data.labels?.[index] as string;
          const value = chart.data.datasets[0].data[index] as number;
          
          const drillData: DrillDownData = {
            label: label,
            value: value,
            originalLabel: label,
            details: {
              count: value,
              percentage: 0,
              category: label
            }
          };
          
          config.drillDownCallback(drillData);
        }
      } : undefined
    };
  }

  /**
   * Generate gradient colors for bar charts
   */
  getGradientColors(count: number): string[] {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(this.powerBIColors[i % this.powerBIColors.length]);
    }
    return colors;
  }

  /**
   * Get colors with transparency for backgrounds
   */
  getBackgroundColors(count: number, alpha: number = 0.85): string[] {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      const baseColor = this.powerBIColors[i % this.powerBIColors.length];
      // Convert rgba to different alpha
      const colorMatch = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
      if (colorMatch) {
        colors.push(`rgba(${colorMatch[1]}, ${colorMatch[2]}, ${colorMatch[3]}, ${alpha})`);
      } else {
        colors.push(baseColor);
      }
    }
    return colors;
  }

  /**
   * Create drill-down data from column analysis
   */
  createDrillDownData(columnName: string, values: any[], type: string): DrillDownData[] {
    if (type === 'Text') {
      const valueCounts: { [key: string]: number } = {};
      values.forEach(v => {
        const key = String(v);
        valueCounts[key] = (valueCounts[key] || 0) + 1;
      });

      const total = values.length;
      return Object.entries(valueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([key, count]) => ({
          label: key.length > 20 ? key.substring(0, 20) + '...' : key,
          value: count,
          originalLabel: key,
          details: {
            count: count,
            percentage: (count / total) * 100,
            category: key
          }
        }));
    } else if (type === 'Numeric') {
      const numValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      const min = Math.min(...numValues);
      const max = Math.max(...numValues);
      const binCount = 10;
      const binSize = (max - min) / binCount || 1;
      const total = numValues.length;

      const bins: DrillDownData[] = [];
      for (let i = 0; i < binCount; i++) {
        const binStart = min + i * binSize;
        const binEnd = binStart + binSize;
        const count = numValues.filter(v => v >= binStart && (i === binCount - 1 ? v <= binEnd : v < binEnd)).length;
        
        if (count > 0) {
          bins.push({
            label: `${Math.round(binStart)}-${Math.round(binEnd)}`,
            value: count,
            originalLabel: `${binStart.toFixed(2)} to ${binEnd.toFixed(2)}`,
            details: {
              count: count,
              percentage: (count / total) * 100,
              category: `Range: ${binStart.toFixed(2)} - ${binEnd.toFixed(2)}`
            }
          });
        }
      }
      return bins;
    }

    return [];
  }

  /**
   * Reset drill-down state
   */
  resetDrillDown(): void {
    this.drillDownStack = [];
    this.currentDrillLevel = 0;
  }

  /**
   * Go back to previous drill-down level
   */
  goBackDrillDown(): { label: string; data: DrillDownData[] } | null {
    if (this.drillDownStack.length > 0) {
      this.currentDrillLevel--;
      return this.drillDownStack.pop() || null;
    }
    return null;
  }

  /**
   * Get current drill level
   */
  getCurrentDrillLevel(): number {
    return this.currentDrillLevel;
  }

  /**
   * Get Power BI-style chart title
   */
  getChartTitle(title: string, subtitle?: string): { display: boolean; text: string[]; font: { size: number; weight: string }; color: string } {
    return {
      display: true,
      text: subtitle ? [title, subtitle] : [title],
      font: {
        size: 16,
        weight: '600'
      },
      color: '#333'
    };
  }
}
