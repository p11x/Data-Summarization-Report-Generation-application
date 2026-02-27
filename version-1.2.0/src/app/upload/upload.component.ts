import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataAnalysisService } from '../services/data-analysis.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
  standalone: true,
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
      // Validate file type
      const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
      const validExtensions = ['.csv', '.txt'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        this.uploadError = 'Please upload a CSV file';
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
      // Process the file
      await this.dataAnalysisService.processFile(this.selectedFile);
      
      // Track uploaded file
      this.dataAnalysisService.addUploadedFile({
        name: this.selectedFile.name,
        size: this.selectedFile.size
      });
      
      this.processingMessage = 'Analyzing data...';
      
      // Small delay to show processing message
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.uploadSuccess = true;
      this.processingMessage = 'Analysis complete!';
      
      // Navigate to report page
      setTimeout(() => {
        this.router.navigate(['/report']);
      }, 800);
    } catch (error) {
      this.uploadError = 'Error processing file. Please ensure it is a valid CSV.';
      this.uploading = false;
      this.processingMessage = '';
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
