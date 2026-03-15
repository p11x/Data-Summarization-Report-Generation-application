import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DataAnalysisService, CleaningStats } from '../services/data-analysis.service';

interface PipelineStage {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
  completed: boolean;
  route?: string;
}

interface PipelineConnection {
  from: string;
  to: string;
}

@Component({
  selector: 'app-pipeline-builder',
  templateUrl: './pipeline-builder.component.html',
  styleUrls: ['./pipeline-builder.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class PipelineBuilderComponent implements OnInit {
  // Available pipeline stages
  availableStages: PipelineStage[] = [
    {
      id: 'upload',
      name: 'Upload File',
      icon: '📤',
      description: 'Upload CSV data file',
      enabled: true,
      completed: false,
      route: '/upload'
    },
    {
      id: 'clean',
      name: 'Data Cleaning',
      icon: '🧹',
      description: 'Remove duplicates, empty rows, columns',
      enabled: true,
      completed: false,
      route: '/data-cleaning'
    },
    {
      id: 'filter',
      name: 'Data Filter',
      icon: '🔍',
      description: 'Filter, normalize, transform data',
      enabled: true,
      completed: false,
      route: '/data-filter'
    },
    {
      id: 'summarize',
      name: 'Summarize',
      icon: '📊',
      description: 'Generate data summary & insights',
      enabled: true,
      completed: false,
      route: '/report'
    },
    {
      id: 'chart',
      name: 'Visualize',
      icon: '📈',
      description: 'Create charts & visualizations',
      enabled: true,
      completed: false,
      route: '/report'
    },
    {
      id: 'report',
      name: 'Report',
      icon: '📄',
      description: 'View & export final report',
      enabled: true,
      completed: false,
      route: '/report'
    }
  ];

  // Current pipeline (ordered stages)
  pipeline: PipelineStage[] = [];
  
  // Pipeline connections
  connections: PipelineConnection[] = [];
  
  // Drag and drop state
  draggedStage: PipelineStage | null = null;
  dragOverIndex: number = -1;
  
  // UI State
  showCleanModal: boolean = false;
  skipCleaning: boolean = false;
  
  // Data for cleaning preview
  originalData: any[] = [];
  columns: string[] = [];
  hasData: boolean = false;
  
  // Cleaning options
  cleaningOptions = {
    removeDuplicates: false,
    removeEmptyRows: false,
    removeColumns: [] as string[]
  };
  
  cleaningStats: CleaningStats | null = null;
  isCleaning: boolean = false;

  constructor(
    public router: Router,
    private dataAnalysisService: DataAnalysisService
  ) {}

  ngOnInit() {
    // Initialize pipeline with all stages
    this.pipeline = [...this.availableStages];
    this.generateConnections();
    
    // Check if data is already loaded
    this.checkData();
  }

  checkData() {
    const fileData = this.dataAnalysisService.getFileData();
    if (fileData && fileData.parsedData.length > 0) {
      this.hasData = true;
      this.originalData = fileData.parsedData;
      this.columns = fileData.headers;
      
      // Mark upload as completed
      const uploadStage = this.pipeline.find(s => s.id === 'upload');
      if (uploadStage) uploadStage.completed = true;
    }
  }

  generateConnections() {
    this.connections = [];
    for (let i = 0; i < this.pipeline.length - 1; i++) {
      if (this.pipeline[i].enabled && this.pipeline[i + 1].enabled) {
        this.connections.push({
          from: this.pipeline[i].id,
          to: this.pipeline[i + 1].id
        });
      }
    }
  }

  // Drag and Drop Methods
  onDragStart(event: DragEvent, stage: PipelineStage) {
    this.draggedStage = stage;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    this.dragOverIndex = index;
  }

  onDragLeave() {
    this.dragOverIndex = -1;
  }

  onDrop(event: DragEvent, targetIndex: number) {
    event.preventDefault();
    
    if (!this.draggedStage) return;
    
    const sourceIndex = this.pipeline.findIndex(s => s.id === this.draggedStage!.id);
    if (sourceIndex === -1 || sourceIndex === targetIndex) return;
    
    // Remove from source and insert at target
    const [removed] = this.pipeline.splice(sourceIndex, 1);
    this.pipeline.splice(targetIndex, 0, removed);
    
    // Regenerate connections
    this.generateConnections();
    
    this.draggedStage = null;
    this.dragOverIndex = -1;
  }

  onDragEnd() {
    this.draggedStage = null;
    this.dragOverIndex = -1;
  }

  // Toggle stage enabled/disabled
  toggleStage(stage: PipelineStage) {
    stage.enabled = !stage.enabled;
    this.generateConnections();
  }

  // Stage Actions
  goToStage(stage: PipelineStage) {
    if (!stage.completed && stage.id !== 'upload' && !this.hasData) {
      alert('Please upload a file first');
      return;
    }
    
    if (stage.route) {
      this.router.navigate([stage.route]);
    }
  }

  // Upload action
  onUploadComplete() {
    this.checkData();
    // Mark upload as completed and move to next
    const uploadStage = this.pipeline.find(s => s.id === 'upload');
    if (uploadStage) {
      uploadStage.completed = true;
    }
  }

  // Data Cleaning Methods
  openCleanModal() {
    this.cleaningOptions = {
      removeDuplicates: false,
      removeEmptyRows: false,
      removeColumns: []
    };
    this.cleaningStats = null;
    this.showCleanModal = true;
  }

  closeCleanModal() {
    this.showCleanModal = false;
  }

  toggleColumnRemoval(column: string) {
    const index = this.cleaningOptions.removeColumns.indexOf(column);
    if (index === -1) {
      this.cleaningOptions.removeColumns.push(column);
    } else {
      this.cleaningOptions.removeColumns.splice(index, 1);
    }
  }

  isColumnSelected(column: string): boolean {
    return this.cleaningOptions.removeColumns.includes(column);
  }

  selectAllColumns() {
    this.cleaningOptions.removeColumns = [...this.columns];
  }

  deselectAllColumns() {
    this.cleaningOptions.removeColumns = [];
  }

  applyCleaning() {
    this.isCleaning = true;
    
    setTimeout(() => {
      const result = this.dataAnalysisService.cleanData(
        this.originalData,
        this.cleaningOptions
      );
      
      // Update the file data with cleaned data
      const fileData = this.dataAnalysisService.getFileData();
      if (fileData) {
        const cleanedHeaders = Object.keys(result.cleanedData[0] || {});
        this.dataAnalysisService.setFileData({
          ...fileData,
          parsedData: result.cleanedData,
          headers: cleanedHeaders
        });
      }
      
      this.cleaningStats = result.stats;
      this.originalData = result.cleanedData;
      this.columns = Object.keys(result.cleanedData[0] || {});
      
      // Mark cleaning as completed
      const cleanStage = this.pipeline.find(s => s.id === 'clean');
      if (cleanStage) cleanStage.completed = true;
      
      this.isCleaning = false;
      this.showCleanModal = false;
    }, 500);
  }

  skipCleaningAndContinue() {
    // Mark cleaning as skipped/completed
    const cleanStage = this.pipeline.find(s => s.id === 'clean');
    if (cleanStage) cleanStage.completed = true;
    
    // Go directly to report/summarize
    this.router.navigate(['/report']);
  }

  // Get stats for display
  get totalDuplicates(): number {
    if (!this.hasData) return 0;
    const seen = new Set<string>();
    let count = 0;
    this.originalData.forEach(row => {
      const key = JSON.stringify(row);
      if (seen.has(key)) {
        count++;
      } else {
        seen.add(key);
      }
    });
    return count;
  }

  get totalEmptyRows(): number {
    if (!this.hasData) return 0;
    return this.originalData.filter(row => {
      const values = Object.values(row);
      return !values.some(v => v !== null && v !== undefined && v !== '');
    }).length;
  }

  // Navigation
  goToHome() {
    this.router.navigate(['/home']);
  }

  goToUpload() {
    this.router.navigate(['/upload']);
  }

  // Reset pipeline
  resetPipeline() {
    this.pipeline.forEach(stage => {
      if (stage.id !== 'upload') {
        stage.completed = false;
      }
    });
    this.generateConnections();
  }
}
