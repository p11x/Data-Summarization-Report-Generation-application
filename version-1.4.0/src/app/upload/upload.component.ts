import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DataAnalysisService, FileData } from '../services/data-analysis.service';
import { DatasetStorageService } from '../services/dataset-storage.service';

interface DatasetPreview {
  name: string;
  rows: number;
  columns: string[];
  sampleData: any[];
}

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
  
  // Dataset preview
  datasetPreview: DatasetPreview | null = null;
  showPreview = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dataAnalysisService: DataAnalysisService,
    private datasetStorage: DatasetStorageService,
    private ngZone: NgZone
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
      this.datasetPreview = null;
      this.showPreview = false;
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
      
      // Get file data for preview
      const fileData = this.dataAnalysisService.getFileData();
      
      if (fileData) {
        // Store dataset in shared storage
        this.datasetStorage.setDatasetFromUpload(
          fileData,
          this.dataAnalysisService.getDataSummary(),
          this.dataAnalysisService.getColumnAnalysis(),
          this.dataAnalysisService.getKeyInsights(),
          this.dataAnalysisService.getReportConfig()
        );
        
        // Create preview
        this.datasetPreview = {
          name: fileData.name,
          rows: fileData.parsedData.length,
          columns: fileData.headers,
          sampleData: fileData.parsedData.slice(0, 5)
        };
      }
      
      // Small delay to show processing message
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.uploadSuccess = true;
      this.processingMessage = 'Analysis complete!';
      
      // Show preview for 1.5 seconds before redirecting
      this.showPreview = true;
      
      console.log('[Upload] Preview shown, will redirect in 1.5s...');
      
      // Use NgZone to ensure navigation runs inside Angular
      this.ngZone.run(() => {
        setTimeout(() => {
          console.log('[Upload] Executing redirect to /report');
          // Navigate to report page with dataset info
          const datasetId = this.selectedFile?.name || 'uploaded-dataset';
          const rowCount = fileData?.parsedData?.length || 0;
          
          console.log('[Upload] Navigation params:', { datasetId, rowCount });
          
          this.router.navigate(['/report'], { 
            queryParams: { 
              dataset: datasetId,
              name: this.selectedFile?.name,
              rows: rowCount
            }
          }).then(navigated => {
            console.log('[Upload] Navigation result:', navigated);
          }).catch(err => {
            console.error('[Upload] Navigation error:', err);
          });
        }, 1500);
      });
      
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
