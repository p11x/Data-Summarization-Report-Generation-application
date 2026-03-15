import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatasetParserService } from '../../../ai-assistant/services/dataset-parser.service';
import { FilterConfig } from '../../services/visualization-generator.service';

@Component({
  selector: 'app-visualization-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visualization-filter-panel.component.html',
  styleUrls: ['./visualization-filter-panel.component.css']
})
export class VisualizationFilterPanelComponent implements OnInit {
  @Input() isOpen = false;
  @Output() filterChange = new EventEmitter<FilterConfig[]>();
  @Output() closePanel = new EventEmitter<void>();

  filters: FilterConfig[] = [];
  columns: string[] = [];
  columnTypes: { [key: string]: string } = {};

  newFilter: Partial<FilterConfig> = {
    type: 'column',
    values: []
  };

  constructor(private datasetParser: DatasetParserService) {}

  ngOnInit() {
    const dataset = this.datasetParser.getCurrentDataset();
    if (dataset) {
      this.columns = dataset.metadata.columnNames;
      this.columnTypes = dataset.metadata.columnTypes;
    }
  }

  addFilter() {
    if (this.newFilter.column) {
      const filter: FilterConfig = {
        column: this.newFilter.column,
        type: this.newFilter.type || 'column',
        values: this.newFilter.values || [],
        min: this.newFilter.min,
        max: this.newFilter.max
      };
      this.filters.push(filter);
      this.filterChange.emit(this.filters);
      this.resetFilter();
    }
  }

  removeFilter(index: number) {
    this.filters.splice(index, 1);
    this.filterChange.emit(this.filters);
  }

  clearFilters() {
    this.filters = [];
    this.filterChange.emit(this.filters);
  }

  resetFilter() {
    this.newFilter = {
      type: 'column',
      values: []
    };
  }

  onClose() {
    this.closePanel.emit();
  }

  getColumnType(column: string): string {
    return this.columnTypes[column] || 'string';
  }

  getFilterTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'column': 'Column Filter',
      'value': 'Value Range',
      'date-range': 'Date Range',
      'category': 'Category'
    };
    return labels[type] || type;
  }
}
