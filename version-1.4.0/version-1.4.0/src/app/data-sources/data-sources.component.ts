import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataAnalysisService, RecentFile } from '../services/data-analysis.service';

@Component({
  selector: 'app-data-sources',
  templateUrl: './data-sources.component.html',
  styleUrls: ['./data-sources.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class DataSourcesComponent implements OnInit {
  dataSources: any[] = [];
  isLoading: boolean = false;

  constructor(
    private dataAnalysisService: DataAnalysisService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDataSources();
  }

  loadDataSources() {
    this.isLoading = true;
    
    // Get recent uploaded files
    const recentFiles = this.dataAnalysisService.getRecentUploadedFiles();
    
    // Get current file data
    const currentFile = this.dataAnalysisService.getFileData();
    
    // Combine into data sources
    this.dataSources = [
      ...recentFiles.map(f => ({
        id: f.name,
        name: f.name,
        type: this.getFileType(f.name),
        size: this.parseSize(f.size),
        uploadedAt: new Date(f.date),
        status: 'active',
        records: 0
      }))
    ];

    if (currentFile && currentFile.name) {
      const exists = this.dataSources.find(d => d.name === currentFile.name);
      if (!exists) {
        this.dataSources.unshift({
          id: currentFile.name,
          name: currentFile.name,
          type: this.getFileType(currentFile.name),
          size: currentFile.size,
          uploadedAt: new Date(),
          status: 'active',
          records: currentFile.parsedData?.length || 0
        });
      }
    }

    this.isLoading = false;
  }

  parseSize(sizeStr: string): number {
    if (!sizeStr) return 0;
    const match = sizeStr.match(/([\d.]+)\s*(KB|MB|B)/i);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      if (unit === 'MB') return value * 1024 * 1024;
      if (unit === 'KB') return value * 1024;
      return value;
    }
    return 0;
  }

  getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'csv': return 'CSV';
      case 'xlsx': 
      case 'xls': return 'Excel';
      case 'json': return 'JSON';
      case 'pdf': return 'PDF';
      case 'txt': return 'Text';
      default: return 'Unknown';
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'CSV': return '📊';
      case 'Excel': return '📗';
      case 'JSON': return '📋';
      case 'PDF': return '📕';
      case 'Text': return '📄';
      default: return '📁';
    }
  }

  getTotalRecords(): number {
    return this.dataSources.reduce((sum, s) => sum + (s.records || 0), 0);
  }

  getTotalSize(): number {
    return this.dataSources.reduce((sum, s) => sum + (s.size || 0), 0);
  }

  loadDataSource(source: any) {
    // Navigate to upload to reload data
    this.router.navigate(['/upload']);
  }

  deleteDataSource(source: any, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to remove ${source.name}?`)) {
      this.dataSources = this.dataSources.filter(d => d.id !== source.id);
    }
  }

  goToUpload() {
    this.router.navigate(['/upload']);
  }

  goToDashboard() {
    this.router.navigate(['/home']);
  }
}
