import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReportVersionService, ReportVersion } from '../services/report-version.service';
import { DataAnalysisService, FileData, DataSummary, ColumnAnalysis, KeyInsight, ReportConfig } from '../services/data-analysis.service';

@Component({
  selector: 'app-version-history',
  templateUrl: './version-history.component.html',
  styleUrls: ['./version-history.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class VersionHistoryComponent implements OnInit, OnDestroy {
  versions: ReportVersion[] = [];
  filteredVersions: ReportVersion[] = [];
  selectedVersions: ReportVersion[] = [];
  comparisonResult: any = null;
  
  // Filters
  searchTerm: string = '';
  sortBy: 'date' | 'version' | 'name' = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';
  filterReportId: string = '';
  
  // UI State
  isLoading: boolean = false;
  showComparisonModal: boolean = false;
  showVersionDetailModal: boolean = false;
  selectedVersion: ReportVersion | null = null;
  showSaveVersionModal: boolean = false;
  newVersionDescription: string = '';
  newVersionTags: string = '';
  
  // Current report data for saving new version
  currentReportId: string = '';
  currentFileName: string = '';
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private versionService: ReportVersionService,
    private dataAnalysisService: DataAnalysisService
  ) {}

  ngOnInit() {
    // Load versions from service
    this.subscriptions.add(
      this.versionService.versions$.subscribe(versions => {
        this.versions = versions;
        this.applyFilters();
      })
    );

    // Load selected versions for comparison
    this.subscriptions.add(
      this.versionService.selectedVersions$.subscribe(versions => {
        this.selectedVersions = versions;
      })
    );

    // Load comparison result
    this.subscriptions.add(
      this.versionService.comparisonResult$.subscribe(result => {
        this.comparisonResult = result;
      })
    );

    // Get current report data
    this.loadCurrentReportData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Load current report data for saving new version
   */
  loadCurrentReportData() {
    const fileData = this.dataAnalysisService.getFileData();
    const reportConfig = this.dataAnalysisService.getReportConfig();
    
    if (fileData && reportConfig) {
      this.currentReportId = reportConfig.reportId;
      this.currentFileName = fileData.name;
    }
  }

  /**
   * Apply filters and sorting
   */
  applyFilters() {
    let result = [...this.versions];

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(v => 
        v.fileName.toLowerCase().includes(term) ||
        v.reportId.toLowerCase().includes(term) ||
        v.description.toLowerCase().includes(term) ||
        v.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Filter by report ID
    if (this.filterReportId) {
      result = result.filter(v => v.reportId === this.filterReportId);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'version':
          comparison = a.versionNumber - b.versionNumber;
          break;
        case 'name':
          comparison = a.fileName.localeCompare(b.fileName);
          break;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.filteredVersions = result;
  }

  /**
   * Get unique report IDs for filtering
   */
  getUniqueReportIds(): string[] {
    const reportIds = new Set(this.versions.map(v => v.reportId));
    return Array.from(reportIds);
  }

  /**
   * Toggle version selection for comparison
   */
  toggleVersionSelection(version: ReportVersion) {
    const index = this.selectedVersions.findIndex(v => v.id === version.id);
    
    if (index >= 0) {
      // Remove from selection
      this.selectedVersions.splice(index, 1);
    } else {
      // Add to selection (max 2)
      if (this.selectedVersions.length < 2) {
        this.selectedVersions.push(version);
      } else {
        // Replace oldest selection
        this.selectedVersions.shift();
        this.selectedVersions.push(version);
      }
    }
    
    // Update service
    const versionIds = this.selectedVersions.map(v => v.id);
    this.versionService.selectVersionsForComparison(versionIds);
  }

  /**
   * Check if version is selected
   */
  isVersionSelected(version: ReportVersion): boolean {
    return this.selectedVersions.some(v => v.id === version.id);
  }

  /**
   * Compare selected versions
   */
  compareSelectedVersions() {
    if (this.selectedVersions.length === 2) {
      this.comparisonResult = this.versionService.compareVersions();
      this.showComparisonModal = true;
    }
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.versionService.clearSelectedVersions();
  }

  /**
   * View version details
   */
  viewVersion(version: ReportVersion) {
    this.selectedVersion = version;
    this.showVersionDetailModal = true;
  }

  /**
   * Load a version as the current report
   */
  loadVersion(version: ReportVersion) {
    // Set the version data as the current report data
    this.dataAnalysisService.setFileData(version.fileData);
    this.dataAnalysisService.setDataSummary(version.dataSummary);
    this.dataAnalysisService.setColumnAnalysis(version.columnAnalysis);
    this.dataAnalysisService.setKeyInsights(version.keyInsights);
    this.dataAnalysisService.setReportConfig(version.reportConfig);
    
    // Navigate to report
    this.router.navigate(['/report']);
  }

  /**
   * Delete a version
   */
  deleteVersion(version: ReportVersion, event: Event) {
    event.stopPropagation();
    
    if (confirm(`Are you sure you want to delete version ${version.versionNumber}?`)) {
      this.versionService.deleteVersion(version.id);
    }
  }

  /**
   * Toggle favorite
   */
  toggleFavorite(version: ReportVersion, event: Event) {
    event.stopPropagation();
    this.versionService.updateVersionMetadata(version.id, {
      isFavorite: !version.isFavorite
    });
  }

  /**
   * Save current report as new version
   */
  saveCurrentVersion() {
    const fileData = this.dataAnalysisService.getFileData();
    const dataSummary = this.dataAnalysisService.getDataSummary();
    const columnAnalysis = this.dataAnalysisService.getColumnAnalysis();
    const keyInsights = this.dataAnalysisService.getKeyInsights();
    const reportConfig = this.dataAnalysisService.getReportConfig();

    if (!fileData || !dataSummary || !reportConfig) {
      alert('No report data available to save');
      return;
    }

    const tags = this.newVersionTags.split(',').map(t => t.trim()).filter(t => t);

    this.versionService.saveVersion(
      reportConfig.reportId,
      fileData.name,
      fileData,
      dataSummary,
      columnAnalysis,
      keyInsights,
      reportConfig,
      this.newVersionDescription,
      tags
    );

    this.showSaveVersionModal = false;
    this.newVersionDescription = '';
    this.newVersionTags = '';
  }

  /**
   * Export version
   */
  exportVersion(version: ReportVersion, event: Event) {
    event.stopPropagation();
    const json = this.versionService.exportVersion(version.id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_version_${version.versionNumber}_${version.fileName}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }

  /**
   * Get change type class
   */
  getChangeTypeClass(changeType: string): string {
    switch (changeType) {
      case 'added': return 'change-added';
      case 'removed': return 'change-removed';
      case 'modified': return 'change-modified';
      default: return 'change-unchanged';
    }
  }

  /**
   * Format date
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /**
   * Navigate to report
   */
  goToReport() {
    this.router.navigate(['/report']);
  }

  /**
   * Navigate to dashboard
   */
  goToDashboard() {
    this.router.navigate(['/home']);
  }
}
