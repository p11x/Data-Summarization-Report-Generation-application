import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectService, Project, Workspace } from '../services/project.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  workspaces: Workspace[] = [];
  
  // Create project modal
  showCreateModal = false;
  newProjectName = '';
  newProjectDescription = '';
  selectedWorkspaceId = '';

  // Create workspace modal
  showCreateWorkspaceModal = false;
  newWorkspaceName = '';
  newWorkspaceDescription = '';

  // Filter
  filterWorkspace = '';

  constructor(
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit() {
    this.projectService.workspaces$.subscribe(workspaces => {
      this.workspaces = workspaces;
    });
    
    this.projectService.projects$.subscribe(projects => {
      this.projects = projects;
    });
  }

  get filteredProjects(): Project[] {
    if (!this.filterWorkspace) {
      return this.projects;
    }
    return this.projects.filter(p => p.workspaceId === this.filterWorkspace);
  }

  getWorkspaceName(workspaceId: string): string {
    const workspace = this.workspaces.find(w => w.id === workspaceId);
    return workspace?.name || 'Unknown Workspace';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'draft': return 'status-draft';
      case 'archived': return 'status-archived';
      default: return '';
    }
  }

  // Workspace Methods
  openCreateWorkspaceModal() {
    this.showCreateWorkspaceModal = true;
  }

  closeCreateWorkspaceModal() {
    this.showCreateWorkspaceModal = false;
    this.newWorkspaceName = '';
    this.newWorkspaceDescription = '';
  }

  createWorkspace() {
    if (!this.newWorkspaceName.trim()) return;
    
    this.projectService.createWorkspace(this.newWorkspaceName, this.newWorkspaceDescription);
    this.closeCreateWorkspaceModal();
  }

  // Project Methods
  openCreateProjectModal() {
    if (this.workspaces.length === 0) {
      alert('Please create a workspace first');
      return;
    }
    this.selectedWorkspaceId = this.workspaces[0].id;
    this.showCreateModal = true;
  }

  closeCreateProjectModal() {
    this.showCreateModal = false;
    this.newProjectName = '';
    this.newProjectDescription = '';
  }

  createProject() {
    if (!this.newProjectName.trim() || !this.selectedWorkspaceId) return;
    
    this.projectService.createProject(
      this.newProjectName, 
      this.selectedWorkspaceId, 
      this.newProjectDescription
    );
    this.closeCreateProjectModal();
  }

  openProject(project: Project) {
    this.projectService.setCurrentProject(project);
    // Navigate to data filter to view/edit the project
    this.router.navigate(['/data-filter']);
  }

  deleteProject(project: Project) {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      this.projectService.deleteProject(project.id);
    }
  }

  reRunAnalysis(project: Project) {
    this.projectService.setCurrentProject(project);
    this.router.navigate(['/data-filter']);
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
