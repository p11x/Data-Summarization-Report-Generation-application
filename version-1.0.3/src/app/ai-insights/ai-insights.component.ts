import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface AIInsight {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: 'available' | 'coming-soon';
  features: string[];
}

@Component({
  selector: 'app-ai-insights',
  templateUrl: './ai-insights.component.html',
  styleUrls: ['./ai-insights.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class AiInsightsComponent {
  insights: AIInsight[] = [
    {
      id: 'anomaly',
      name: 'Anomaly Detection',
      description: 'Automatically detect outliers and unusual patterns in your data using advanced statistical methods and ML algorithms',
      icon: '🚨',
      category: 'Detection',
      status: 'available',
      features: ['Z-Score Analysis', 'IQR Method', 'Auto-threshold', 'Severity Classification']
    },
    {
      id: 'forecasting',
      name: 'Forecasting',
      description: 'Predict future trends and patterns based on historical data using time series analysis',
      icon: '📈',
      category: 'Prediction',
      status: 'available',
      features: ['Moving Average', 'Linear Regression', 'Exponential Smoothing', 'Confidence Intervals']
    },
    {
      id: 'semantic',
      name: 'Semantic Search',
      description: 'Search and query your data using natural language to find relevant insights',
      icon: '🔎',
      category: 'Search',
      status: 'available',
      features: ['NLP Queries', 'Smart Suggestions', 'Contextual Results', 'Auto-categorization']
    },
    {
      id: 'whatif',
      name: 'What-If Analysis',
      description: 'Simulate different scenarios and see how changes in data affect your outcomes',
      icon: '🔮',
      category: 'Simulation',
      status: 'available',
      features: ['Scenario Builder', 'Impact Analysis', 'Custom Variables', 'Comparison Views']
    },
    {
      id: 'lineage',
      name: 'Data Lineage',
      description: 'Track the origin and transformation of your data throughout the pipeline',
      icon: '🔗',
      category: 'Tracking',
      status: 'available',
      features: ['Source Tracking', 'Transformation Log', 'Impact Analysis', 'Audit Trail']
    },
    {
      id: 'chatbot',
      name: 'AI Assistant',
      description: 'Interactive chatbot to help you analyze data and get insights through conversation',
      icon: '💬',
      category: 'Assistance',
      status: 'available',
      features: ['Natural Language', 'Data Queries', 'Insight Explanations', 'Step-by-step Guides']
    },
    {
      id: 'clustering',
      name: 'Cluster Analysis',
      description: 'Group similar data points together to discover hidden patterns',
      icon: '🎯',
      category: 'Analysis',
      status: 'coming-soon',
      features: ['K-Means Clustering', 'Hierarchical', 'DBSCAN', 'Visual Clusters']
    },
    {
      id: 'nlp',
      name: 'Text Analytics',
      description: 'Extract insights from text data using natural language processing',
      icon: '📝',
      category: 'NLP',
      status: 'coming-soon',
      features: ['Sentiment Analysis', 'Entity Extraction', 'Topic Modeling', 'Text Summary']
    }
  ];

  constructor(private router: Router) {}

  getAvailableInsights(): AIInsight[] {
    return this.insights.filter(i => i.status === 'available');
  }

  getComingSoonInsights(): AIInsight[] {
    return this.insights.filter(i => i.status === 'coming-soon');
  }

  goToDashboard() {
    this.router.navigate(['/home']);
  }

  goToReport() {
    this.router.navigate(['/report']);
  }
}
