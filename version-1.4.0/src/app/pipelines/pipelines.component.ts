import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Pipeline {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: 'available' | 'coming-soon';
  features: string[];
}

@Component({
  selector: 'app-pipelines',
  templateUrl: './pipelines.component.html',
  styleUrls: ['./pipelines.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class PipelinesComponent implements OnInit {
  pipelines: Pipeline[] = [
    {
      id: 'etl',
      name: 'ETL Pipeline',
      description: 'Extract, Transform, Load - Move and transform data between systems',
      icon: '🔄',
      category: 'Data Movement',
      status: 'available',
      features: ['Data extraction', 'Data transformation', 'Data loading', 'Scheduling']
    },
    {
      id: 'streaming',
      name: 'Real-time Streaming',
      description: 'Process data streams in real-time for instant insights',
      icon: '🌊',
      category: 'Data Movement',
      status: 'available',
      features: ['Real-time processing', 'Event-driven', 'Low latency', 'Scalable']
    },
    {
      id: 'batch',
      name: 'Batch Processing',
      description: 'Process large volumes of data in scheduled batches',
      icon: '📦',
      category: 'Data Movement',
      status: 'available',
      features: ['Bulk processing', 'Scheduled jobs', 'Error handling', 'Retry logic']
    },
    {
      id: 'ml',
      name: 'ML Pipeline',
      description: 'Build and deploy machine learning workflows',
      icon: '🤖',
      category: 'AI/ML',
      status: 'available',
      features: ['Model training', 'Feature engineering', 'Model deployment', 'A/B testing']
    },
    {
      id: 'data-quality',
      name: 'Data Quality',
      description: 'Monitor and ensure data quality across your pipelines',
      icon: '✅',
      category: 'Data Management',
      status: 'available',
      features: ['Validation rules', 'Data profiling', 'Anomaly detection', 'Reporting']
    },
    {
      id: 'integration',
      name: 'API Integration',
      description: 'Connect to external APIs and services',
      icon: '🔗',
      category: 'Integration',
      status: 'available',
      features: ['REST APIs', 'GraphQL', 'Webhooks', 'Authentication']
    },
    {
      id: 'data-warehouse',
      name: 'Data Warehouse',
      description: 'Build and maintain data warehouses for analytics',
      icon: '🏢',
      category: 'Storage',
      status: 'coming-soon',
      features: ['OLAP cubes', 'Columnar storage', 'Query optimization']
    },
    {
      id: 'data-lake',
      name: 'Data Lake',
      description: 'Store and manage raw data at scale',
      icon: '🏞️',
      category: 'Storage',
      status: 'coming-soon',
      features: ['Object storage', 'Schema evolution', 'Tiered storage']
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {}

  getAvailablePipelines(): Pipeline[] {
    return this.pipelines.filter(p => p.status === 'available');
  }

  getComingSoonPipelines(): Pipeline[] {
    return this.pipelines.filter(p => p.status === 'coming-soon');
  }

  goToDashboard() {
    this.router.navigate(['/home']);
  }

  goToPipelineBuilder() {
    this.router.navigate(['/pipeline']);
  }
}
