import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisResult, ChartConfig } from '../../services/ai-analysis.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ai-result-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-result-card.component.html',
  styleUrls: ['./ai-result-card.component.css']
})
export class AiResultCardComponent {
  @Input() result!: AnalysisResult;
  @Output() viewDetails = new EventEmitter<AnalysisResult>();

  isExpanded = false;

  constructor(private router: Router) {}

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  onViewDetails() {
    this.viewDetails.emit(this.result);
  }

  goToReport() {
    this.router.navigate(['/ai-report']);
  }

  getTypeIcon(): string {
    switch (this.result.type) {
      case 'summary': return '📝';
      case 'insight': return '💡';
      case 'chart': return '📊';
      case 'table': return '📋';
      default: return '📄';
    }
  }

  getTypeColor(): string {
    switch (this.result.type) {
      case 'summary': return '#667eea';
      case 'insight': return '#10b981';
      case 'chart': return '#f59e0b';
      case 'table': return '#8b5cf6';
      default: return '#666';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }
}