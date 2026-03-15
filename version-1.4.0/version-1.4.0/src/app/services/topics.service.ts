import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { parseCSVLine } from './utils';

export interface Topic {
  id: number;
  category: string;
  name: string;
  description: string;
  keywords: string[];
  selected?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TopicsService {
  private topicsUrl = 'assets/data/topics.csv';
  private selectedTopics: Topic[] = [];

  constructor(private http: HttpClient) {}

  getTopics(): Observable<Topic[]> {
    return this.http.get(this.topicsUrl, { responseType: 'text' }).pipe(
      map(csvData => this.parseCSV(csvData)),
      catchError(error => {
        console.error('Error loading topics:', error);
        return of(this.getDefaultTopics());
      })
    );
  }

  private parseCSV(csvData: string): Topic[] {
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = this.parseCSVLine(line);
      return {
        id: parseInt(values[0]) || 0,
        category: values[1] || '',
        name: values[2] || '',
        description: values[3] || '',
        keywords: values[4] ? values[4].split(';').map(k => k.trim()) : [],
        selected: false
      };
    });
  }

  private parseCSVLine(line: string): string[] {
    return parseCSVLine(line);
  }

  private getDefaultTopics(): Topic[] {
    return [
      { id: 1, category: 'Technology', name: 'Artificial Intelligence', description: 'AI and machine learning technologies', keywords: ['AI', 'machine learning', 'neural networks'], selected: false },
      { id: 2, category: 'Technology', name: 'Cloud Computing', description: 'Cloud infrastructure and services', keywords: ['cloud', 'AWS', 'Azure'], selected: false },
      { id: 3, category: 'Business', name: 'Financial Analysis', description: 'Financial data analysis and market trends', keywords: ['finance', 'investment', 'market'], selected: false },
      { id: 4, category: 'Healthcare', name: 'Medical Research', description: 'Clinical trials and medical data', keywords: ['clinical', 'trials', 'patients'], selected: false },
      { id: 5, category: 'Environment', name: 'Climate Change', description: 'Climate data analysis', keywords: ['climate', 'temperature', 'emissions'], selected: false }
    ];
  }

  setSelectedTopics(topics: Topic[]): void {
    this.selectedTopics = topics.filter(t => t.selected);
    localStorage.setItem('selectedTopics', JSON.stringify(this.selectedTopics));
  }

  getSelectedTopics(): Topic[] {
    const saved = localStorage.getItem('selectedTopics');
    if (saved) {
      return JSON.parse(saved);
    }
    return this.selectedTopics;
  }

  clearSelectedTopics(): void {
    this.selectedTopics = [];
    localStorage.removeItem('selectedTopics');
  }

  getCategories(topics: Topic[]): string[] {
    const categories = new Set(topics.map(t => t.category));
    return Array.from(categories);
  }

  searchTopics(topics: Topic[], query: string): Topic[] {
    if (!query.trim()) return topics;
    
    const lowerQuery = query.toLowerCase();
    return topics.filter(topic => 
      topic.name.toLowerCase().includes(lowerQuery) ||
      topic.description.toLowerCase().includes(lowerQuery) ||
      topic.category.toLowerCase().includes(lowerQuery) ||
      topic.keywords.some(k => k.toLowerCase().includes(lowerQuery))
    );
  }

  filterByCategory(topics: Topic[], category: string): Topic[] {
    if (!category || category === 'all') return topics;
    return topics.filter(t => t.category === category);
  }
}