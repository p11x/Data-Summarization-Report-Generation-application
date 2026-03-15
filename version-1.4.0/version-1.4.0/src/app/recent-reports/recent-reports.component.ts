import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReportVersionService, ReportVersion } from '../services/report-version.service';

@Component({
  selector: 'app-recent-reports',
  templateUrl: './recent-reports.component.html',
  styleUrls: ['./recent-reports.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class RecentReportsComponent implements OnInit {
  reports: any[] = [];
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private versionService: ReportVersionService
  ) {}

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.isLoading = true;
    const versions = this.versionService.getVersions();
    
    this.reports = versions.map(v => ({
      id: v.id,
      name: v.fileName,
      version: v.versionNumber,
      createdAt: v.createdAt,
      description: v.description || 'No description',
      tags: v.tags,
      records: v.dataSummary.totalRows,
      columns: v.dataSummary.totalColumns,
      isFavorite: v.isFavorite
    }));

    this.isLoading = false;
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

  viewReport(report: any) {
    const version = this.versionService.getVersionById(report.id);
    if (version) {
      this.router.navigate(['/report']);
    }
  }

  toggleFavorite(report: any) {
    this.versionService.updateVersionMetadata(report.id, {
      isFavorite: !report.isFavorite
    });
    report.isFavorite = !report.isFavorite;
  }

  deleteReport(report: any, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete this report?`)) {
      this.versionService.deleteVersion(report.id);
      this.reports = this.reports.filter(r => r.id !== report.id);
    }
  }

  getFavoriteCount(): number {
    return this.reports.filter(r => r.isFavorite).length;
  }

  goToDashboard() {
    this.router.navigate(['/home']);
  }

  goToReport() {
    this.router.navigate(['/report']);
  }
}
