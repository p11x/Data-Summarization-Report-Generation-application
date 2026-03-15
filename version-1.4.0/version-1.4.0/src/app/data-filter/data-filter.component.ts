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
  selector: 'app-data-filter',
  templateUrl: './data-filter.component.html',
  styleUrls: ['./data-filter.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DataFilterComponent implements OnInit {
  // Data
  originalData: any[] = [];
  processedData: any[] = [];
  columns: string[] = [];
  hasData: boolean = false;

  // Enable/disable operations
  operations = {
    removeNulls: false,
    normalize: false,
    rename: false,
    filter: false
  };

  // Filter options
  filterColumns: string[] = [];
  selectedFilterColumn: string = '';
  filterOperator: string = '=';
  filterValue: string = '';
  filterConditions: FilterCondition[] = [];

  // Normalize options
  selectedNormalizeColumns: string[] = [];

  // Rename options
  renameMappings: RenameMapping[] = [];
  newRenameMapping: RenameMapping = { oldName: '', newName: '' };

  // Remove nulls options
  selectedNullColumns: string[] = [];

  // UI State
  isProcessing: boolean = false;
  appliedOperations: string[] = [];

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
    }
  }

  // Check if any operation is enabled
  hasActiveOperations(): boolean {
    return this.operations.removeNulls || 
           this.operations.normalize || 
           this.operations.rename || 
           this.operations.filter;
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

  selectAllNullColumns() {
    this.selectedNullColumns = [...this.columns];
  }

  // Process Data - Apply all selected operations
  applyFilters() {
    if (!this.hasActiveOperations()) {
      alert('Please enable at least one operation.');
      return;
    }

    // Validate operations
    if (this.operations.filter && this.filterConditions.length === 0) {
      alert('Please add at least one filter condition.');
      return;
    }

    if (this.operations.normalize && this.selectedNormalizeColumns.length === 0) {
      alert('Please select at least one column to normalize.');
      return;
    }

    if (this.operations.rename && this.renameMappings.length === 0) {
      alert('Please add at least one field rename mapping.');
      return;
    }

    if (this.operations.removeNulls && this.selectedNullColumns.length === 0) {
      alert('Please select at least one column to check for nulls.');
      return;
    }

    this.isProcessing = true;
    this.appliedOperations = [];

    setTimeout(() => {
      let result = [...this.originalData];

      // Remove nulls (always do first)
      if (this.operations.removeNulls && this.selectedNullColumns.length > 0) {
        result = this.dataAnalysisService.removeNulls(result, this.selectedNullColumns);
        this.appliedOperations.push('Remove Nulls');
      }

      // Filter rows
      if (this.operations.filter && this.filterConditions.length > 0) {
        result = this.dataAnalysisService.filterRows(result, this.filterConditions);
        this.appliedOperations.push('Filter Rows');
      }

      // Normalize columns
      if (this.operations.normalize && this.selectedNormalizeColumns.length > 0) {
        result = this.dataAnalysisService.normalizeColumns(result, this.selectedNormalizeColumns);
        this.appliedOperations.push('Normalize Columns');
      }

      // Rename fields (always do last)
      if (this.operations.rename && this.renameMappings.length > 0) {
        const renameMap: { [key: string]: string } = {};
        this.renameMappings.forEach(mapping => {
          renameMap[mapping.oldName] = mapping.newName;
        });
        result = this.dataAnalysisService.renameFields(result, renameMap);
        this.appliedOperations.push('Rename Fields');
      }

      this.processedData = result;
      
      // Get updated headers
      const headers = Object.keys(result[0] || {});
      
      // Store filtered data for the preview page
      this.dataAnalysisService.setFilteredData(result, headers, this.appliedOperations);
      
      // Navigate to filtered data preview page
      this.router.navigate(['/filtered-data']);
      
      this.isProcessing = false;
    }, 500);
  }

  // Reset all filters
  resetFilters() {
    this.operations = {
      removeNulls: false,
      normalize: false,
      rename: false,
      filter: false
    };
    this.filterConditions = [];
    this.selectedNormalizeColumns = [];
    this.renameMappings = [];
    this.selectedNullColumns = [];
    this.processedData = [...this.originalData];
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
