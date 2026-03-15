import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataAnalysisService } from '../services/data-analysis.service';

interface FilterCondition {
  column: string;
  operator: string;
  value: string;
}

interface RenameMapping {
  oldName: string;
  newName: string;
}

@Component({
  selector: 'app-data-processing',
  templateUrl: './data-processing.component.html',
  styleUrls: ['./data-processing.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DataProcessingComponent implements OnInit {
  // Data
  originalData: any[] = [];
  processedData: any[] = [];
  columns: string[] = [];
  hasData: boolean = false;

  // Processing Options
  selectedOperation: string = 'filter';
  
  // Filter options
  filterColumns: string[] = [];
  selectedFilterColumn: string = '';
  filterOperator: string = '=';
  filterValue: string = '';
  filterConditions: FilterCondition[] = [];

  // Normalize options
  normalizeColumns: string[] = [];
  selectedNormalizeColumns: string[] = [];

  // Rename options
  renameMappings: RenameMapping[] = [];
  newRenameMapping: RenameMapping = { oldName: '', newName: '' };

  // Remove nulls options
  removeNullColumns: string[] = [];
  selectedNullColumns: string[] = [];

  // UI State
  isProcessing: boolean = false;
  showResults: boolean = false;
  processingMessage: string = '';

  // Table pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalPages: number = 1;

  // Available operators
  operators = [
    { value: '=', label: 'Equals (=)' },
    { value: '!=', label: 'Not Equals (!=)' },
    { value: '>', label: 'Greater Than (>)' },
    { value: '<', label: 'Less Than (<)' },
    { value: '>=', label: 'Greater or Equal (>=)' },
    { value: '<=', label: 'Less or Equal (<=)' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts With' },
    { value: 'endsWith', label: 'Ends With' },
    { value: 'isEmpty', label: 'Is Empty' },
    { value: 'isNotEmpty', label: 'Is Not Empty' }
  ];

  constructor(
    private router: Router,
    private dataAnalysisService: DataAnalysisService
  ) {}

  ngOnInit() {
    const fileData = this.dataAnalysisService.getFileData();
    if (fileData && fileData.parsedData.length > 0) {
      this.originalData = fileData.parsedData;
      this.columns = fileData.headers;
      this.processedData = [...this.originalData];
      this.hasData = true;
      this.filterColumns = [...this.columns];
      this.normalizeColumns = [...this.columns];
      this.removeNullColumns = [...this.columns];
      this.updatePagination();
    }
  }

  // Operation Selection
  selectOperation(operation: string) {
    this.selectedOperation = operation;
  }

  // Filter Methods
  addFilterCondition() {
    if (this.selectedFilterColumn && this.filterOperator) {
      this.filterConditions.push({
        column: this.selectedFilterColumn,
        operator: this.filterOperator,
        value: this.filterValue
      });
      this.selectedFilterColumn = '';
      this.filterOperator = '=';
      this.filterValue = '';
    }
  }

  removeFilterCondition(index: number) {
    this.filterConditions.splice(index, 1);
  }

  // Normalize Methods
  toggleNormalizeColumn(column: string) {
    const index = this.selectedNormalizeColumns.indexOf(column);
    if (index === -1) {
      this.selectedNormalizeColumns.push(column);
    } else {
      this.selectedNormalizeColumns.splice(index, 1);
    }
  }

  isNormalizeColumnSelected(column: string): boolean {
    return this.selectedNormalizeColumns.includes(column);
  }

  // Rename Methods
  addRenameMapping() {
    if (this.newRenameMapping.oldName && this.newRenameMapping.newName) {
      this.renameMappings.push({ ...this.newRenameMapping });
      this.newRenameMapping = { oldName: '', newName: '' };
    }
  }

  removeRenameMapping(index: number) {
    this.renameMappings.splice(index, 1);
  }

  // Remove Nulls Methods
  toggleNullColumn(column: string) {
    const index = this.selectedNullColumns.indexOf(column);
    if (index === -1) {
      this.selectedNullColumns.push(column);
    } else {
      this.selectedNullColumns.splice(index, 1);
    }
  }

  isNullColumnSelected(column: string): boolean {
    return this.selectedNullColumns.includes(column);
  }

  selectAllNullColumns(): void {
    this.selectedNullColumns = [...this.removeNullColumns];
  }

  // Process Data
  processData() {
    this.isProcessing = true;
    this.processingMessage = 'Processing data...';

    setTimeout(() => {
      let result = [...this.originalData];

      // Remove nulls
      if (this.selectedOperation === 'remove-nulls' && this.selectedNullColumns.length > 0) {
        result = this.dataAnalysisService.removeNulls(result, this.selectedNullColumns);
      }

      // Filter rows
      if (this.selectedOperation === 'filter' && this.filterConditions.length > 0) {
        result = this.dataAnalysisService.filterRows(result, this.filterConditions);
      }

      // Normalize columns
      if (this.selectedOperation === 'normalize' && this.selectedNormalizeColumns.length > 0) {
        result = this.dataAnalysisService.normalizeColumns(result, this.selectedNormalizeColumns);
      }

      // Rename fields
      if (this.selectedOperation === 'rename' && this.renameMappings.length > 0) {
        const renameMap: { [key: string]: string } = {};
        this.renameMappings.forEach(mapping => {
          renameMap[mapping.oldName] = mapping.newName;
        });
        result = this.dataAnalysisService.renameFields(result, renameMap);
        // Update columns list
        this.columns = Object.keys(result[0] || {});
      }

      this.processedData = result;
      this.updatePagination();
      this.showResults = true;
      this.isProcessing = false;
      this.processingMessage = '';
    }, 500);
  }

  // Reset to original
  resetData() {
    this.processedData = [...this.originalData];
    this.filterConditions = [];
    this.selectedNormalizeColumns = [];
    this.renameMappings = [];
    this.selectedNullColumns = [];
    this.showResults = false;
    this.currentPage = 1;
    this.updatePagination();
  }

  // Download CSV
  downloadCSV() {
    const filename = `processed_data_${Date.now()}.csv`;
    this.dataAnalysisService.exportToCSV(this.processedData, filename);
  }

  // Pagination
  updatePagination() {
    this.totalPages = Math.ceil(this.processedData.length / this.pageSize);
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.processedData.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Navigation
  goBack() {
    this.router.navigate(['/home']);
  }

  goToUpload() {
    this.router.navigate(['/upload']);
  }

  // Stats
  get originalRowCount(): number {
    return this.originalData.length;
  }

  get processedRowCount(): number {
    return this.processedData.length;
  }

  get removedRowCount(): number {
    return this.originalData.length - this.processedData.length;
  }
}
