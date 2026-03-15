import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatasetParserService, ParsedDataset } from '../../../ai-assistant/services/dataset-parser.service';

@Component({
  selector: 'app-visualization-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visualization-upload.component.html',
  styleUrls: ['./visualization-upload.component.css']
})
export class VisualizationUploadComponent implements OnInit {
  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  dataset: ParsedDataset | null = null;
  error: string | null = null;
  isDragging = false;

  constructor(
    private datasetParser: DatasetParserService,
    private router: Router
  ) {}

  ngOnInit() {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  private processFile(file: File) {
    const validTypes = ['.csv', '.xlsx', '.xls', '.json'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(extension)) {
      this.error = 'Please select a valid file type (CSV, Excel, or JSON)';
      return;
    }

    this.error = null;
    this.selectedFile = file;
    this.isUploading = true;
    this.uploadProgress = 0;

    const progressInterval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 100) {
        clearInterval(progressInterval);
        this.parseDataset(file);
      }
    }, 100);
  }

  private async parseDataset(file: File) {
    try {
      this.dataset = await this.datasetParser.parseFile(file);
      this.isUploading = false;
    } catch (error) {
      this.error = 'Failed to parse dataset. Please check the file format.';
      this.isUploading = false;
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.dataset = null;
    this.uploadProgress = 0;
    this.error = null;
  }

  continueToDashboard() {
    if (this.dataset) {
      this.router.navigate(['/visualization-dashboard']);
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'integer': return '#️⃣';
      case 'float': return '🔢';
      case 'string': return '📝';
      case 'boolean': return '✓✗';
      case 'date': return '📅';
      default: return '❓';
    }
  }
}
