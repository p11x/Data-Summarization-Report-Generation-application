import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TopicsService, Topic } from '../services/topics.service';

@Component({
  selector: 'app-topics',
  templateUrl: './topics.component.html',
  styleUrls: ['./topics.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TopicsComponent implements OnInit {
  allTopics: Topic[] = [];
  filteredTopics: Topic[] = [];
  categories: string[] = [];
  selectedCategory: string = 'all';
  searchQuery: string = '';
  isLoading: boolean = true;

  constructor(
    private topicsService: TopicsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadTopics();
  }

  loadTopics() {
    this.isLoading = true;
    this.topicsService.getTopics().subscribe({
      next: (topics) => {
        this.allTopics = topics;
        this.filteredTopics = [...topics];
        this.categories = this.topicsService.getCategories(topics);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading topics:', error);
        this.isLoading = false;
      }
    });
  }

  onSearch() {
    this.applyFilters();
  }

  onCategoryChange() {
    this.applyFilters();
  }

  applyFilters() {
    let result = this.allTopics;
    
    // Apply category filter
    if (this.selectedCategory !== 'all') {
      result = this.topicsService.filterByCategory(result, this.selectedCategory);
    }
    
    // Apply search filter
    if (this.searchQuery.trim()) {
      result = this.topicsService.searchTopics(result, this.searchQuery);
    }
    
    this.filteredTopics = result;
  }

  onTopicClick(topic: Topic) {
    // Navigate to topic detail page with topic ID
    this.router.navigate(['/topic', topic.id]);
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Technology': '💻',
      'Business': '📊',
      'Healthcare': '🏥',
      'Environment': '🌍',
      'Education': '📚',
      'Sports': '⚽',
      'Entertainment': '🎬'
    };
    return icons[category] || '📁';
  }
}