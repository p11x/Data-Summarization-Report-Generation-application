import { Injectable } from '@angular/core';
import { Topic } from './topics.service';
import { toCSV } from './utils';

export interface TopicDataRecord {
  id: number;
  date: string;
  value: number;
  category: string;
  status: string;
  description: string;
  metric1: number;
  metric2: number;
  metric3: number;
}

@Injectable({
  providedIn: 'root'
})
export class TopicDataService {
  private topicStorage: Map<number, TopicDataRecord[]> = new Map();

  constructor() {
    this.initializeTopicData();
  }

  private initializeTopicData() {
    // Generate data for all 30 topics
    const topics = this.getTopicDefinitions();
    
    topics.forEach(topic => {
      const data = this.generateTopicData(topic);
      this.topicStorage.set(topic.id, data);
    });
  }

  private getTopicDefinitions(): Topic[] {
    return [
      { id: 1, category: 'Technology', name: 'Artificial Intelligence', description: 'AI and machine learning technologies', keywords: ['AI', 'machine learning'] },
      { id: 2, category: 'Technology', name: 'Cloud Computing', description: 'Cloud infrastructure and services', keywords: ['cloud', 'AWS'] },
      { id: 3, category: 'Technology', name: 'Cybersecurity', description: 'Security measures and threat analysis', keywords: ['security', 'encryption'] },
      { id: 4, category: 'Technology', name: 'Data Science', description: 'Statistical analysis and data mining', keywords: ['statistics', 'analytics'] },
      { id: 5, category: 'Technology', name: 'Internet of Things', description: 'IoT devices and sensor data', keywords: ['IoT', 'sensors'] },
      { id: 6, category: 'Business', name: 'Financial Analysis', description: 'Financial data and market trends', keywords: ['finance', 'investment'] },
      { id: 7, category: 'Business', name: 'Marketing Analytics', description: 'Marketing performance analysis', keywords: ['marketing', 'campaigns'] },
      { id: 8, category: 'Business', name: 'Supply Chain', description: 'Supply chain optimization', keywords: ['supply chain', 'logistics'] },
      { id: 9, category: 'Business', name: 'Human Resources', description: 'HR metrics and workforce analytics', keywords: ['HR', 'employees'] },
      { id: 10, category: 'Business', name: 'Sales Performance', description: 'Sales data and revenue tracking', keywords: ['sales', 'revenue'] },
      { id: 11, category: 'Healthcare', name: 'Medical Research', description: 'Clinical trials and medical data', keywords: ['clinical', 'trials'] },
      { id: 12, category: 'Healthcare', name: 'Patient Analytics', description: 'Patient data and outcomes', keywords: ['patients', 'diagnosis'] },
      { id: 13, category: 'Healthcare', name: 'Drug Development', description: 'Pharmaceutical research data', keywords: ['pharmaceutical', 'drugs'] },
      { id: 14, category: 'Healthcare', name: 'Healthcare Operations', description: 'Hospital operational metrics', keywords: ['operations', 'hospital'] },
      { id: 15, category: 'Environment', name: 'Climate Change', description: 'Climate data analysis', keywords: ['climate', 'temperature'] },
      { id: 16, category: 'Environment', name: 'Pollution Monitoring', description: 'Air and water quality data', keywords: ['pollution', 'air quality'] },
      { id: 17, category: 'Environment', name: 'Wildlife Conservation', description: 'Wildlife population data', keywords: ['wildlife', 'conservation'] },
      { id: 18, category: 'Environment', name: 'Natural Resources', description: 'Natural resource management', keywords: ['resources', 'water'] },
      { id: 19, category: 'Education', name: 'Student Performance', description: 'Academic performance data', keywords: ['students', 'grades'] },
      { id: 20, category: 'Education', name: 'Institutional Analytics', description: 'School operational data', keywords: ['institutions', 'enrollment'] },
      { id: 21, category: 'Education', name: 'Online Learning', description: 'E-learning platform data', keywords: ['e-learning', 'courses'] },
      { id: 22, category: 'Education', name: 'Research Output', description: 'Academic research metrics', keywords: ['research', 'publications'] },
      { id: 23, category: 'Sports', name: 'Player Performance', description: 'Athlete statistics', keywords: ['athletes', 'statistics'] },
      { id: 24, category: 'Sports', name: 'Team Analytics', description: 'Team performance data', keywords: ['team', 'strategy'] },
      { id: 25, category: 'Sports', name: 'Fan Engagement', description: 'Fan behavior metrics', keywords: ['fans', 'engagement'] },
      { id: 26, category: 'Sports', name: 'Event Analytics', description: 'Sports event data', keywords: ['events', 'audience'] },
      { id: 27, category: 'Entertainment', name: 'Streaming Analytics', description: 'Streaming platform data', keywords: ['streaming', 'viewers'] },
      { id: 28, category: 'Entertainment', name: 'Social Media', description: 'Social media trends', keywords: ['social media', 'likes'] },
      { id: 29, category: 'Entertainment', name: 'Gaming Analytics', description: 'Gaming industry data', keywords: ['gaming', 'players'] },
      { id: 30, category: 'Entertainment', name: 'Content Performance', description: 'Media content metrics', keywords: ['content', 'views'] }
    ];
  }

  private generateTopicData(topic: Topic): TopicDataRecord[] {
    const records: TopicDataRecord[] = [];
    const categories = this.getCategoriesForTopic(topic);
    const statuses = ['Active', 'Pending', 'Completed', 'In Progress', 'Review'];
    
    for (let i = 1; i <= 50; i++) {
      const date = this.generateRandomDate();
      records.push({
        id: i,
        date: date,
        value: Math.floor(Math.random() * 10000) + 1000,
        category: categories[Math.floor(Math.random() * categories.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        description: `${topic.name} data record ${i} - ${this.generateDescription(topic)}`,
        metric1: Math.floor(Math.random() * 100),
        metric2: Math.floor(Math.random() * 500) + 50,
        metric3: Math.random() * 10
      });
    }
    
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private getCategoriesForTopic(topic: Topic): string[] {
    const categoryMap: { [key: string]: string[] } = {
      'Technology': ['Development', 'Testing', 'Deployment', 'Maintenance', 'Research'],
      'Business': ['Operations', 'Strategy', 'Analysis', 'Planning', 'Execution'],
      'Healthcare': ['Treatment', 'Diagnosis', 'Prevention', 'Research', 'Care'],
      'Environment': ['Monitoring', 'Analysis', 'Conservation', 'Research', 'Action'],
      'Education': ['Learning', 'Teaching', 'Assessment', 'Research', 'Development'],
      'Sports': ['Training', 'Competition', 'Analysis', 'Recovery', 'Strategy'],
      'Entertainment': ['Production', 'Distribution', 'Marketing', 'Analysis', 'Engagement']
    };
    return categoryMap[topic.category] || ['General', 'Specific', 'Specialized', 'Custom', 'Standard'];
  }

  private generateRandomDate(): string {
    const start = new Date(2023, 0, 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
  }

  private generateDescription(topic: Topic): string {
    const actions = ['analyzed', 'processed', 'reviewed', 'evaluated', 'assessed', 'measured', 'tracked'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    return `${action} ${topic.keywords[0]?.toLowerCase() || 'data'} metrics`;
  }

  getTopicData(topicId: number): TopicDataRecord[] {
    return this.topicStorage.get(topicId) || [];
  }

  saveTopicData(topicId: number, data: TopicDataRecord[]): void {
    this.topicStorage.set(topicId, data);
  }

  addDataToTopic(topicId: number, newData: TopicDataRecord[]): void {
    const existingData = this.getTopicData(topicId);
    const combinedData = [...existingData, ...newData];
    this.topicStorage.set(topicId, combinedData);
  }

  getTopicSummary(topicId: number) {
    const data = this.getTopicData(topicId);
    
    if (data.length === 0) {
      return null;
    }

    const totalValue = data.reduce((sum, r) => sum + r.value, 0);
    const avgValue = totalValue / data.length;
    const maxValue = Math.max(...data.map(r => r.value));
    const minValue = Math.min(...data.map(r => r.value));
    
    const avgMetric1 = data.reduce((sum, r) => sum + r.metric1, 0) / data.length;
    const avgMetric2 = data.reduce((sum, r) => sum + r.metric2, 0) / data.length;
    const avgMetric3 = data.reduce((sum, r) => sum + r.metric3, 0) / data.length;

    const statusCounts: { [key: string]: number } = {};
    data.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });

    const categoryCounts: { [key: string]: number } = {};
    data.forEach(r => {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    });

    return {
      totalRecords: data.length,
      totalValue,
      avgValue,
      maxValue,
      minValue,
      avgMetric1,
      avgMetric2,
      avgMetric3,
      statusCounts,
      categoryCounts,
      recentRecords: data.slice(0, 10)
    };
  }

  exportToCSV(topicId: number): string {
    const data = this.getTopicData(topicId);
    if (data.length === 0) return '';

    const headers = ['ID', 'Date', 'Value', 'Category', 'Status', 'Description', 'Metric1', 'Metric2', 'Metric3'];
    
    // Use the toCSV utility for proper CSV formatting
    return toCSV(headers, data);
  }
}