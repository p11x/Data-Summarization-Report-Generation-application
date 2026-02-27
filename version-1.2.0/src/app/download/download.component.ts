import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { jsPDF } from 'jspdf';
import { 
  DataAnalysisService, 
  ColumnAnalysis, 
  DataSummary, 
  FileData, 
  KeyInsight,
  ReportConfig 
} from '../services/data-analysis.service';

interface ExportFeature {
  id: string;
  name: string;
  description: string;
  selected: boolean;
}

@Component({
  selector: 'app-download',
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DownloadComponent implements OnInit {
  // Data
  fileData: FileData | null = null;
  dataSummary: DataSummary | null = null;
  columnAnalysis: ColumnAnalysis[] = [];
  keyInsights: KeyInsight[] = [];
  reportConfig: ReportConfig | null = null;
  hasData: boolean = false;

  // Export features
  exportFeatures: ExportFeature[] = [
    { id: 'header', name: 'Report Header', description: 'Title, date, source file info, and metadata', selected: true },
    { id: 'overview', name: 'Data Overview', description: 'File statistics, record count, column types', selected: true },
    { id: 'summary', name: 'Automated Summary', description: 'Key insights, trends, and data quality assessment', selected: true },
    { id: 'metrics', name: 'Key Metrics', description: 'Statistical measures for numeric columns', selected: true },
    { id: 'table', name: 'Data Table', description: 'Detailed table view with all records', selected: false },
    { id: 'conclusion', name: 'Conclusion', description: 'Interpretation and recommendations', selected: true },
    { id: 'rawData', name: 'Raw Data', description: 'Complete raw data from the uploaded file', selected: false }
  ];

  // Export options
  isExporting: boolean = false;
  exportProgress: number = 0;

  constructor(
    private router: Router,
    private dataAnalysisService: DataAnalysisService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.fileData = this.dataAnalysisService.getFileData();
    this.dataSummary = this.dataAnalysisService.getDataSummary();
    this.columnAnalysis = this.dataAnalysisService.getColumnAnalysis();
    this.keyInsights = this.dataAnalysisService.getKeyInsights();
    this.reportConfig = this.dataAnalysisService.getReportConfig();

    if (!this.fileData) {
      this.hasData = false;
      return;
    }

    this.hasData = true;
  }

  // Feature selection
  toggleFeature(featureId: string) {
    const feature = this.exportFeatures.find(f => f.id === featureId);
    if (feature) {
      feature.selected = !feature.selected;
    }
  }

  selectAll() {
    this.exportFeatures.forEach(f => f.selected = true);
  }

  deselectAll() {
    this.exportFeatures.forEach(f => f.selected = false);
  }

  getSelectedFeaturesCount(): number {
    return this.exportFeatures.filter(f => f.selected).length;
  }

  // Export
  async exportReport() {
    if (!this.fileData || this.getSelectedFeaturesCount() === 0) {
      alert('Please select at least one feature to export.');
      return;
    }

    this.isExporting = true;
    this.exportProgress = 0;

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        this.exportProgress += 10;
        if (this.exportProgress >= 90) {
          clearInterval(progressInterval);
        }
      }, 200);

      await this.generatePDF();

      clearInterval(progressInterval);
      this.exportProgress = 100;

      setTimeout(() => {
        this.isExporting = false;
        this.exportProgress = 0;
      }, 500);

    } catch (error) {
      console.error('Export error:', error);
      this.isExporting = false;
      this.exportProgress = 0;
      alert('An error occurred during export. Please try again.');
    }
  }

  private async generatePDF() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 20;
    const lineHeight = 7;
    const selectedFeatures = this.exportFeatures.filter(f => f.selected);

    // Helper function to add text with wrapping
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      
      const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
      
      // Check if we need a new page
      if (yPos + lines.length * lineHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(lines, margin, yPos);
      yPos += lines.length * lineHeight + 3;
    };

    // Helper function to add a section title
    const addSectionTitle = (title: string) => {
      yPos += 5;
      if (yPos > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFillColor(102, 126, 234);
      doc.rect(margin, yPos - 3, pageWidth - margin * 2, 8, 'F');
      doc.setTextColor(255, 255, 255);
      addText(title, 12, true);
      doc.setTextColor(0, 0, 0);
    };

    // Header
    if (selectedFeatures.some(f => f.id === 'header')) {
      // Title
      doc.setFillColor(26, 26, 46);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(this.reportConfig?.title || 'Data Analysis Report', margin, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report ID: ${this.reportConfig?.reportId}`, margin, 30);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 35);
      doc.setTextColor(0, 0, 0);
      yPos = 50;
    }

    // Overview
    if (selectedFeatures.some(f => f.id === 'overview') && this.dataSummary) {
      addSectionTitle('DATA OVERVIEW');
      
      addText(`File: ${this.fileData?.name}`, 10, true);
      addText(`Total Records: ${this.dataSummary.totalRows}`);
      addText(`Total Columns: ${this.dataSummary.totalColumns}`);
      addText(`Numeric Columns: ${this.dataSummary.numericColumns}`);
      addText(`Text Columns: ${this.dataSummary.textColumns}`);
      addText(`Missing Values: ${this.dataSummary.missingValues} (${this.dataSummary.missingPercentage.toFixed(1)}%)`);
      addText(`Duplicate Rows: ${this.dataSummary.duplicateRows}`);
    }

    // Summary
    if (selectedFeatures.some(f => f.id === 'summary') && this.keyInsights.length > 0) {
      addSectionTitle('KEY INSIGHTS');
      
      this.keyInsights.forEach((insight, index) => {
        addText(`${index + 1}. ${insight.title}`, 10, true);
        addText(`   Type: ${insight.type.toUpperCase()} | Importance: ${insight.importance}`);
        addText(`   ${insight.description}`);
        yPos += 3;
      });
    }

    // Metrics
    if (selectedFeatures.some(f => f.id === 'metrics')) {
      const numericCols = this.columnAnalysis.filter(c => c.type === 'Numeric');
      if (numericCols.length > 0) {
        addSectionTitle('KEY METRICS');
        
        numericCols.forEach(col => {
          addText(col.name, 10, true);
          addText(`   Min: ${col.min} | Max: ${col.max}`);
          addText(`   Mean: ${col.mean} | Median: ${col.median}`);
          addText(`   Std Dev: ${col.stdDev}`);
          yPos += 3;
        });
      }
    }

    // Table (limited rows for PDF)
    if (selectedFeatures.some(f => f.id === 'table') && this.fileData) {
      addSectionTitle('DATA TABLE (First 30 rows)');
      
      const tableData = this.fileData.parsedData.slice(0, 30);
      const headers = this.fileData.headers;
      
      // Simple table representation
      addText(headers.join(' | '), 8, true);
      addText('-'.repeat(100), 8);
      
      tableData.forEach(row => {
        const rowText = headers.map(h => String(row[h] || '').substring(0, 15)).join(' | ');
        addText(rowText, 8);
      });
      
      if (this.fileData.parsedData.length > 30) {
        addText(`... and ${this.fileData.parsedData.length - 30} more rows`, 8, true);
      }
    }

    // Raw Data
    if (selectedFeatures.some(f => f.id === 'rawData') && this.fileData) {
      addSectionTitle('RAW DATA');
      
      const headers = this.fileData.headers;
      const maxRows = Math.min(this.fileData.parsedData.length, 50);
      
      addText(headers.join(' | '), 8, true);
      addText('-'.repeat(100), 8);
      
      for (let i = 0; i < maxRows; i++) {
        const row = this.fileData.parsedData[i];
        const rowText = headers.map(h => String(row[h] || '').substring(0, 15)).join(' | ');
        addText(rowText, 8);
      }
      
      if (this.fileData.parsedData.length > 50) {
        addText(`... and ${this.fileData.parsedData.length - 50} more rows`, 8, true);
      }
    }

    // Conclusion
    if (selectedFeatures.some(f => f.id === 'conclusion') && this.dataSummary) {
      addSectionTitle('CONCLUSION');
      
      addText('This report analyzed data with the following characteristics:', 10);
      addText(`• Total Records: ${this.dataSummary.totalRows}`);
      addText(`• Total Columns: ${this.dataSummary.totalColumns}`);
      addText(`• Data Quality: ${this.dataSummary.missingPercentage < 5 ? 'Excellent' : this.dataSummary.missingPercentage < 20 ? 'Moderate' : 'Needs improvement'}`);
      addText(`• Missing Values: ${this.dataSummary.missingPercentage.toFixed(1)}%`);
      
      if (this.dataSummary.duplicateRows > 0) {
        addText(`• Warning: ${this.dataSummary.duplicateRows} duplicate rows detected`);
      }
      
      yPos += 5;
      addText('Recommendations:', 10, true);
      if (this.dataSummary.missingPercentage > 5) {
        addText('• Consider data imputation for missing values');
      }
      if (this.dataSummary.duplicateRows > 0) {
        addText('• Remove or review duplicate records');
      }
      addText('• Explore numeric columns for statistical analysis');
      addText('• Use text columns for categorical analysis');
    }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated by Data Analysis System v1.0 | Page ${i} of ${totalPages}`,
        margin,
        doc.internal.pageSize.getHeight() - 10
      );
    }

    // Save the PDF
    const filename = `report_${this.fileData?.name?.replace(/\.[^/.]+$/, '') || 'export'}_${Date.now()}.pdf`;
    doc.save(filename);
    
    // Track downloaded file
    this.dataAnalysisService.addDownloadedFile(filename);
  }

  // Navigation
  goBack() {
    this.router.navigate(['/report']);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }
}
