import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  FileData,
  DataSummary,
  ColumnAnalysis,
  KeyInsight,
  ReportConfig
} from './data-analysis.service';

export interface ReportVersion {
  id: string;
  versionNumber: number;
  reportId: string;
  fileName: string;
  createdAt: Date;
  createdBy: string;
  description: string;
  
  // Report data snapshots
  fileData: FileData;
  dataSummary: DataSummary;
  columnAnalysis: ColumnAnalysis[];
  keyInsights: KeyInsight[];
  reportConfig: ReportConfig;
  
  // Metadata
  fileSize: number;
  processingTime: number;
  tags: string[];
  isFavorite: boolean;
}

export interface VersionComparison {
  version1: ReportVersion;
  version2: ReportVersion;
  differences: VersionDifference[];
}

export interface VersionDifference {
  category: 'summary' | 'columns' | 'insights' | 'metrics';
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
}

@Injectable({
  providedIn: 'root'
})
export class ReportVersionService {
  private readonly STORAGE_KEY = 'report_versions';
  private readonly MAX_VERSIONS = 50;
  
  private versionsSubject = new BehaviorSubject<ReportVersion[]>([]);
  versions$ = this.versionsSubject.asObservable();
  
  private selectedVersionsSubject = new BehaviorSubject<ReportVersion[]>([]);
  selectedVersions$ = this.selectedVersionsSubject.asObservable();
  
  private comparisonResultSubject = new BehaviorSubject<VersionComparison | null>(null);
  comparisonResult$ = this.comparisonResultSubject.asObservable();

  constructor() {
    this.loadVersionsFromStorage();
  }

  /**
   * Generate a unique version ID
   */
  private generateVersionId(): string {
    return 'V-' + Date.now().toString(36).toUpperCase() + '-' + 
           Math.random().toString(36).substr(2, 4).toUpperCase();
  }

  /**
   * Get all saved versions
   */
  getVersions(): ReportVersion[] {
    return this.versionsSubject.getValue();
  }

  /**
   * Get versions for a specific report
   */
  getVersionsByReportId(reportId: string): ReportVersion[] {
    return this.versionsSubject.getValue()
      .filter(v => v.reportId === reportId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  /**
   * Get a specific version by ID
   */
  getVersionById(versionId: string): ReportVersion | undefined {
    return this.versionsSubject.getValue().find(v => v.id === versionId);
  }

  /**
   * Save a new version of the report
   */
  saveVersion(
    reportId: string,
    fileName: string,
    fileData: FileData,
    dataSummary: DataSummary,
    columnAnalysis: ColumnAnalysis[],
    keyInsights: KeyInsight[],
    reportConfig: ReportConfig,
    description: string = '',
    tags: string[] = []
  ): ReportVersion {
    const versions = this.versionsSubject.getValue();
    const reportVersions = versions.filter(v => v.reportId === reportId);
    const nextVersionNumber = reportVersions.length > 0 
      ? Math.max(...reportVersions.map(v => v.versionNumber)) + 1 
      : 1;

    const newVersion: ReportVersion = {
      id: this.generateVersionId(),
      versionNumber: nextVersionNumber,
      reportId,
      fileName,
      createdAt: new Date(),
      createdBy: reportConfig.generatedBy,
      description,
      fileData,
      dataSummary,
      columnAnalysis,
      keyInsights,
      reportConfig,
      fileSize: fileData.size,
      processingTime: fileData.processingTime,
      tags,
      isFavorite: false
    };

    // Add new version to the beginning
    const updatedVersions = [newVersion, ...versions];
    
    // Limit stored versions
    const limitedVersions = updatedVersions.slice(0, this.MAX_VERSIONS);
    
    this.versionsSubject.next(limitedVersions);
    this.saveVersionsToStorage(limitedVersions);
    
    console.log(`Saved version ${nextVersionNumber} for report ${reportId}`);
    return newVersion;
  }

  /**
   * Update version metadata (description, tags, favorite)
   */
  updateVersionMetadata(
    versionId: string, 
    updates: { description?: string; tags?: string[]; isFavorite?: boolean }
  ): ReportVersion | null {
    const versions = this.versionsSubject.getValue();
    const index = versions.findIndex(v => v.id === versionId);
    
    if (index === -1) return null;
    
    const updatedVersion = {
      ...versions[index],
      ...updates
    };
    
    versions[index] = updatedVersion;
    this.versionsSubject.next([...versions]);
    this.saveVersionsToStorage(versions);
    
    return updatedVersion;
  }

  /**
   * Delete a specific version
   */
  deleteVersion(versionId: string): boolean {
    const versions = this.versionsSubject.getValue();
    const filteredVersions = versions.filter(v => v.id !== versionId);
    
    if (filteredVersions.length === versions.length) return false;
    
    this.versionsSubject.next(filteredVersions);
    this.saveVersionsToStorage(filteredVersions);
    return true;
  }

  /**
   * Delete all versions for a specific report
   */
  deleteVersionsByReportId(reportId: string): void {
    const versions = this.versionsSubject.getValue();
    const filteredVersions = versions.filter(v => v.reportId !== reportId);
    
    this.versionsSubject.next(filteredVersions);
    this.saveVersionsToStorage(filteredVersions);
  }

  /**
   * Select versions for comparison
   */
  selectVersionsForComparison(versionIds: string[]): void {
    const versions = versionIds
      .map(id => this.getVersionById(id))
      .filter((v): v is ReportVersion => v !== undefined);
    
    this.selectedVersionsSubject.next(versions);
  }

  /**
   * Clear selected versions
   */
  clearSelectedVersions(): void {
    this.selectedVersionsSubject.next([]);
    this.comparisonResultSubject.next(null);
  }

  /**
   * Compare two selected versions
   */
  compareVersions(): VersionComparison | null {
    const selectedVersions = this.selectedVersionsSubject.getValue();
    
    if (selectedVersions.length !== 2) {
      console.warn('Exactly 2 versions must be selected for comparison');
      return null;
    }

    const [version1, version2] = selectedVersions;
    const differences: VersionDifference[] = [];

    // Compare data summaries
    this.compareDataSummary(version1.dataSummary, version2.dataSummary, differences);
    
    // Compare column analysis
    this.compareColumnAnalysis(version1.columnAnalysis, version2.columnAnalysis, differences);
    
    // Compare key insights
    this.compareKeyInsights(version1.keyInsights, version2.keyInsights, differences);

    const comparison: VersionComparison = {
      version1,
      version2,
      differences
    };

    this.comparisonResultSubject.next(comparison);
    return comparison;
  }

  /**
   * Compare data summaries
   */
  private compareDataSummary(
    summary1: DataSummary, 
    summary2: DataSummary, 
    differences: VersionDifference[]
  ): void {
    const fields: (keyof DataSummary)[] = [
      'totalRows', 'totalColumns', 'numericColumns', 'textColumns',
      'dateColumns', 'missingValues', 'missingPercentage', 'duplicateRows'
    ];

    fields.forEach(field => {
      const oldValue = summary1[field];
      const newValue = summary2[field];
      
      let changeType: VersionDifference['changeType'] = 'unchanged';
      if (oldValue !== newValue) {
        changeType = oldValue === undefined || oldValue === null ? 'added' : 'modified';
      }

      differences.push({
        category: 'summary',
        field: this.formatFieldName(field),
        oldValue: oldValue ?? '-',
        newValue: newValue ?? '-',
        changeType
      });
    });
  }

  /**
   * Compare column analysis
   */
  private compareColumnAnalysis(
    columns1: ColumnAnalysis[], 
    columns2: ColumnAnalysis[], 
    differences: VersionDifference[]
  ): void {
    const columnNames1 = new Set(columns1.map(c => c.name));
    const columnNames2 = new Set(columns2.map(c => c.name));

    // Find added columns
    [...columnNames2].forEach(name => {
      if (!columnNames1.has(name)) {
        differences.push({
          category: 'columns',
          field: `Column: ${name}`,
          oldValue: '-',
          newValue: 'Added',
          changeType: 'added'
        });
      }
    });

    // Find removed columns
    [...columnNames1].forEach(name => {
      if (!columnNames2.has(name)) {
        differences.push({
          category: 'columns',
          field: `Column: ${name}`,
          oldValue: 'Present',
          newValue: '-',
          changeType: 'removed'
        });
      }
    });

    // Find modified columns
    columnNames1.forEach(name => {
      if (columnNames2.has(name)) {
        const col1 = columns1.find(c => c.name === name)!;
        const col2 = columns2.find(c => c.name === name)!;
        
        if (col1.type !== col2.type) {
          differences.push({
            category: 'columns',
            field: `${name}: Type`,
            oldValue: col1.type,
            newValue: col2.type,
            changeType: 'modified'
          });
        }
        
        if (col1.nullCount !== col2.nullCount) {
          differences.push({
            category: 'columns',
            field: `${name}: Missing Values`,
            oldValue: col1.nullCount,
            newValue: col2.nullCount,
            changeType: 'modified'
          });
        }
      }
    });
  }

  /**
   * Compare key insights
   */
  private compareKeyInsights(
    insights1: KeyInsight[], 
    insights2: KeyInsight[], 
    differences: VersionDifference[]
  ): void {
    // Count differences
    const count1 = insights1.length;
    const count2 = insights2.length;
    
    if (count1 !== count2) {
      differences.push({
        category: 'insights',
        field: 'Total Insights',
        oldValue: count1,
        newValue: count2,
        changeType: 'modified'
      });
    }

    // Compare insight types
    const types1 = this.getInsightTypeCounts(insights1);
    const types2 = this.getInsightTypeCounts(insights2);
    const allTypes = new Set([...Object.keys(types1), ...Object.keys(types2)]);

    allTypes.forEach(type => {
      const count = types1[type] || 0;
      const newCount = types2[type] || 0;
      if (count !== newCount) {
        differences.push({
          category: 'insights',
          field: `Insight Type: ${type}`,
          oldValue: count,
          newValue: newCount,
          changeType: 'modified'
        });
      }
    });
  }

  /**
   * Get insight type counts
   */
  private getInsightTypeCounts(insights: KeyInsight[]): { [key: string]: number } {
    return insights.reduce((acc, insight) => {
      acc[insight.type] = (acc[insight.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  /**
   * Format field name for display
   */
  private formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Export a specific version as JSON
   */
  exportVersion(versionId: string): string | null {
    const version = this.getVersionById(versionId);
    if (!version) return null;
    
    return JSON.stringify(version, null, 2);
  }

  /**
   * Import a version from JSON
   */
  importVersion(jsonString: string): ReportVersion | null {
    try {
      const importedVersion = JSON.parse(jsonString) as ReportVersion;
      
      // Validate required fields
      if (!importedVersion.id || !importedVersion.reportId || !importedVersion.versionNumber) {
        throw new Error('Invalid version format');
      }
      
      // Generate new ID to avoid conflicts
      const newVersion: ReportVersion = {
        ...importedVersion,
        id: this.generateVersionId(),
        createdAt: new Date()
      };
      
      const versions = this.versionsSubject.getValue();
      this.versionsSubject.next([newVersion, ...versions]);
      this.saveVersionsToStorage([...versions, newVersion]);
      
      return newVersion;
    } catch (error) {
      console.error('Failed to import version:', error);
      return null;
    }
  }

  /**
   * Get statistics for versions
   */
  getVersionStats(): {
    totalVersions: number;
    totalReports: number;
    oldestVersion: ReportVersion | null;
    newestVersion: ReportVersion | null;
  } {
    const versions = this.versionsSubject.getValue();
    
    if (versions.length === 0) {
      return {
        totalVersions: 0,
        totalReports: 0,
        oldestVersion: null,
        newestVersion: null
      };
    }

    const reportIds = new Set(versions.map(v => v.reportId));
    
    return {
      totalVersions: versions.length,
      totalReports: reportIds.size,
      oldestVersion: versions[versions.length - 1],
      newestVersion: versions[0]
    };
  }

  /**
   * Save versions to localStorage
   */
  private saveVersionsToStorage(versions: ReportVersion[]): void {
    try {
      // Convert Date objects to ISO strings for storage
      const versionsForStorage = versions.map(v => ({
        ...v,
        createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt
      }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(versionsForStorage));
    } catch (error) {
      console.error('Failed to save versions to storage:', error);
    }
  }

  /**
   * Load versions from localStorage
   */
  private loadVersionsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;
      
      const versions = JSON.parse(stored) as ReportVersion[];
      // Convert ISO strings back to Date objects
      const loadedVersions = versions.map(v => ({
        ...v,
        createdAt: new Date(v.createdAt)
      }));
      
      this.versionsSubject.next(loadedVersions);
    } catch (error) {
      console.error('Failed to load versions from storage:', error);
    }
  }

  /**
   * Clear all versions (use with caution)
   */
  clearAllVersions(): void {
    this.versionsSubject.next([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
