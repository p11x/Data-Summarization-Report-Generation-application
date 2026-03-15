import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataAnalysisService } from '../services/data-analysis.service';
import { TopicDataService } from '../services/topic-data.service';
import { TopicsService, Topic } from '../services/topics.service';
import { ProjectService, Workspace, Project } from '../services/project.service';

@Component({
  selector: 'app-filtered-data',
  templateUrl: './filtered-data.component.html',
  styleUrls: ['./filtered-data.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class FilteredDataComponent implements OnInit {
  filteredData: any[] = [];
  headers: string[] = [];
  appliedOperations: string[] = [];
  hasData: boolean = false;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 20;
  totalPages: number = 1;

  // Save to topic
  availableTopics: Topic[] = [];
  selectedTopicId: number | null = null;
  newTopicName: string = '';
  showSaveModal: boolean = false;
  saveSuccess: boolean = false;

  // Save to project
  showSaveProjectModal: boolean = false;
  availableWorkspaces: Workspace[] = [];
  availableProjects: Project[] = [];
  selectedWorkspaceId: string = '';
  selectedProjectId: string = '';
  newProjectName: string = '';
  newProjectDescription: string = '';

  // Download
  isDownloading: boolean = false;

  constructor(
    private router: Router,
    private dataAnalysisService: DataAnalysisService,
    private topicDataService: TopicDataService,
    private topicsService: TopicsService,
    private projectService: ProjectService
  ) {}

  ngOnInit() {
    const data = this.dataAnalysisService.getFilteredData();
    if (data && data.data.length > 0) {
      this.filteredData = data.data;
      this.headers = data.headers;
      this.appliedOperations = data.appliedOperations;
      this.hasData = true;
      this.updatePagination();
    }
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredData.slice(start, start + this.pageSize);
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
    this.router.navigate(['/data-filter']);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  // Download CSV
  downloadCSV() {
    this.isDownloading = true;
    const filename = `filtered_data_${Date.now()}.csv`;
    
    setTimeout(() => {
      this.dataAnalysisService.exportToCSV(this.filteredData, filename);
      this.isDownloading = false;
    }, 300);
  }

  // Save to Topic
  openSaveModal() {
    this.showSaveModal = true;
    this.topicsService.getTopics().subscribe(topics => {
      this.availableTopics = topics;
    });
  }

  closeSaveModal() {
    this.showSaveModal = false;
    this.selectedTopicId = null;
    this.newTopicName = '';
  }

  // Save to Project
  openSaveProjectModal() {
    this.showSaveProjectModal = true;
    this.availableWorkspaces = this.projectService.getWorkspaces();
    this.availableProjects = this.projectService.getProjects();
    if (this.availableWorkspaces.length > 0) {
      this.selectedWorkspaceId = this.availableWorkspaces[0].id;
    }
  }

  closeSaveProjectModal() {
    this.showSaveProjectModal = false;
    this.selectedWorkspaceId = '';
    this.selectedProjectId = '';
    this.newProjectName = '';
    this.newProjectDescription = '';
  }

  saveToExistingProject() {
    if (!this.selectedProjectId) {
      alert('Please select a project');
      return;
    }

    // Add filtered data to the project
    this.projectService.setFilteredData(this.selectedProjectId, this.filteredData, this.headers);
    
    this.saveSuccess = true;
    setTimeout(() => {
      this.closeSaveProjectModal();
    }, 1500);
  }

  createAndSaveToProject() {
    if (!this.newProjectName.trim() || !this.selectedWorkspaceId) {
      alert('Please enter a project name and select a workspace');
      return;
    }

    // Create a new project
    const project = this.projectService.createProject(
      this.newProjectName,
      this.selectedWorkspaceId,
      this.newProjectDescription
    );

    // Add filtered data to the project
    this.projectService.setFilteredData(project.id, this.filteredData, this.headers);
    
    this.saveSuccess = true;
    setTimeout(() => {
      this.closeSaveProjectModal();
    }, 1500);
  }

  getProjectsForWorkspace(workspaceId: string): Project[] {
    return this.availableProjects.filter(p => p.workspaceId === workspaceId);
  }

  saveToExistingTopic() {
    if (!this.selectedTopicId) {
      alert('Please select a topic');
      return;
    }

    // Convert filtered data to topic data format
    const topicData = this.convertToTopicData(this.filteredData);
    
    // Get existing data for the topic
    const existingData = this.topicDataService.getTopicData(this.selectedTopicId);
    
    // Combine existing and new data
    const combinedData = [...existingData, ...topicData];
    
    // Save to topic
    this.topicDataService.saveTopicData(this.selectedTopicId, combinedData);
    
    this.saveSuccess = true;
    setTimeout(() => {
      this.closeSaveModal();
    }, 1500);
  }

  createNewTopic() {
    if (!this.newTopicName.trim()) {
      alert('Please enter a topic name');
      return;
    }

    // Create a new topic with the filtered data
    const newId = Date.now() % 1000 + 100;
    const topicData = this.convertToTopicData(this.filteredData);
    
    // Save to the new topic
    this.topicDataService.saveTopicData(newId, topicData);
    
    this.saveSuccess = true;
    setTimeout(() => {
      this.closeSaveModal();
    }, 1500);
  }

  private convertToTopicData(data: any[]): any[] {
    // Convert the filtered data to match the TopicDataRecord format
    // Try to map common column names to the expected format
    return data.map((row, index) => {
      const converted: any = {
        id: index + 1,
        date: this.findColumnValue(row, ['date', 'Date', 'DATE', 'timestamp', 'created_at']) || this.generateRandomDate(),
        value: this.findColumnValue(row, ['value', 'Value', 'VALUE', 'amount', 'count', 'total']) || Math.floor(Math.random() * 100),
        category: this.findColumnValue(row, ['category', 'Category', 'CATEGORY', 'type', 'group']) || 'General',
        status: this.findColumnValue(row, ['status', 'Status', 'STATUS', 'state']) || 'Active',
        description: this.findColumnValue(row, ['description', 'Description', 'DESC', 'name', 'title']) || 'Filtered data record',
        metric1: this.findColumnValue(row, ['metric1', 'metric_1', 'score', 'rating']) || Math.random() * 100,
        metric2: this.findColumnValue(row, ['metric2', 'metric_2', 'percentage', 'rate']) || Math.random() * 100,
        metric3: this.findColumnValue(row, ['metric3', 'metric_3', 'quantity', 'count']) || Math.random() * 100
      };
      return converted;
    });
  }

  private findColumnValue(row: any, possibleNames: string[]): any {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null) {
        return row[name];
      }
    }
    return null;
  }

  private generateRandomDate(): string {
    const start = new Date(2023, 0, 1);
    const end = new Date();
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
  }

  // Stats
  get rowCount(): number {
    return this.filteredData.length;
  }

  get columnCount(): number {
    return this.headers.length;
  }
}
