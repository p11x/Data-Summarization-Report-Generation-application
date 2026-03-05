import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataAnalysisService } from '../services/data-analysis.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule]
})
export class UploadComponent {
  selectedFile: File | null = null;
  uploading = false;
  uploadSuccess = false;
  uploadError = '';
  processingMessage = '';

  constructor(
    private router: Router,
    private dataAnalysisService: DataAnalysisService
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type - now includes DOCX
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf', 'text/xml', 'application/xml', 'text/html', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const validExtensions = ['.csv', '.txt', '.xlsx', '.xls', '.pdf', '.xml', '.html', '.htm', '.docx'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        this.uploadError = 'Please upload a CSV, TXT, Excel, PDF, XML, HTML, or DOCX file';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
      this.uploadError = '';
      this.uploadSuccess = false;
    }
  }

  async onUpload() {
    if (!this.selectedFile) {
      this.uploadError = 'Please select a file first';
      return;
    }

    this.uploading = true;
    this.uploadError = '';
    this.processingMessage = 'Reading file...';

    try {
      await this.dataAnalysisService.processFile(this.selectedFile);
      this.processingMessage = 'Analyzing data...';
      await new Promise(resolve => setTimeout(resolve, 500));
      this.uploadSuccess = true;
      this.processingMessage = 'Analysis complete!';
      setTimeout(() => this.router.navigate(['/report']), 800);
    } catch (error) {
      this.uploadError = 'Error processing file. Please ensure it is a valid CSV, TXT, Excel, PDF, XML, HTML, or DOCX file.';
      this.uploading = false;
      this.processingMessage = '';
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
