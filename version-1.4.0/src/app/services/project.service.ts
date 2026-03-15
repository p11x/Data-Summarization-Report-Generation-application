import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DataSource {
  id: string;
  name: string;
  type: 'csv' | 'api' | 'website' | 'database';
  fileName?: string;
  apiUrl?: string;
  websiteUrl?: string;
  uploadDate: Date;
  data?: any[];
  headers?: string[];
}

export interface FilterOperation {
  type: 'removeNulls' | 'normalize' | 'rename' | 'filter';
  columns?: string[];
  conditions?: any[];
  mappings?: { [key: string]: string };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  dataSources: DataSource[];
  filterOperations: FilterOperation[];
  filteredData?: any[];
  filteredHeaders?: string[];
  status: 'draft' | 'completed' | 'archived';
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  projectCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private workspacesSubject = new BehaviorSubject<Workspace[]>([]);
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  private currentProjectSubject = new BehaviorSubject<Project | null>(null);

  workspaces$ = this.workspacesSubject.asObservable();
  projects$ = this.projectsSubject.asObservable();
  currentProject$ = this.currentProjectSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const workspaces = this.getFromStorage(`workspaces_${userId}`) as Workspace[] || [];
    const projects = this.getFromStorage(`projects_${userId}`) as Project[] || [];

    this.workspacesSubject.next(workspaces);
    this.projectsSubject.next(projects);
  }

  private getFromStorage(key: string): any {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
      return null;
    }
  }

  private saveToStorage(key: string, data: any): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private getCurrentUserId(): string | null {
    const user = localStorage.getItem('currentUser');
    if (!user) return null;
    try {
      const userData = JSON.parse(user);
      return userData.username || userData.email || null;
    } catch {
      return null;
    }
  }

  // Workspace Methods
  createWorkspace(name: string, description: string = ''): Workspace {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not logged in');

    const workspace: Workspace = {
      id: `ws_${Date.now()}`,
      name,
      description,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      projectCount: 0
    };

    const workspaces = [...this.workspacesSubject.value, workspace];
    this.workspacesSubject.next(workspaces);
    this.saveToStorage(`workspaces_${userId}`, workspaces);

    return workspace;
  }

  getWorkspaces(): Workspace[] {
    return this.workspacesSubject.value;
  }

  getWorkspaceById(id: string): Workspace | undefined {
    return this.workspacesSubject.value.find(w => w.id === id);
  }

  updateWorkspace(id: string, updates: Partial<Workspace>): void {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const workspaces = this.workspacesSubject.value.map(w => {
      if (w.id === id) {
        return { ...w, ...updates, updatedAt: new Date() };
      }
      return w;
    });

    this.workspacesSubject.next(workspaces);
    this.saveToStorage(`workspaces_${userId}`, workspaces);
  }

  deleteWorkspace(id: string): void {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    // Delete all projects in the workspace
    const projects = this.projectsSubject.value.filter(p => p.workspaceId !== id);
    this.projectsSubject.next(projects);
    this.saveToStorage(`projects_${userId}`, projects);

    const workspaces = this.workspacesSubject.value.filter(w => w.id !== id);
    this.workspacesSubject.next(workspaces);
    this.saveToStorage(`workspaces_${userId}`, workspaces);
  }

  // Project Methods
  createProject(name: string, workspaceId: string, description: string = ''): Project {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('User not logged in');

    const project: Project = {
      id: `proj_${Date.now()}`,
      name,
      description,
      workspaceId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      dataSources: [],
      filterOperations: [],
      status: 'draft'
    };

    const projects = [...this.projectsSubject.value, project];
    this.projectsSubject.next(projects);
    this.saveToStorage(`projects_${userId}`, projects);

    // Update workspace project count
    const workspace = this.getWorkspaceById(workspaceId);
    if (workspace) {
      this.updateWorkspace(workspaceId, { projectCount: workspace.projectCount + 1 });
    }

    return project;
  }

  getProjects(): Project[] {
    return this.projectsSubject.value;
  }

  getProjectsByWorkspace(workspaceId: string): Project[] {
    return this.projectsSubject.value.filter(p => p.workspaceId === workspaceId);
  }

  getProjectById(id: string): Project | undefined {
    return this.projectsSubject.value.find(p => p.id === id);
  }

  updateProject(id: string, updates: Partial<Project>): void {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const projects = this.projectsSubject.value.map(p => {
      if (p.id === id) {
        return { ...p, ...updates, updatedAt: new Date() };
      }
      return p;
    });

    this.projectsSubject.next(projects);
    this.saveToStorage(`projects_${userId}`, projects);

    // Update current project if it's the one being updated
    const currentProject = this.currentProjectSubject.value;
    if (currentProject && currentProject.id === id) {
      this.currentProjectSubject.next({ ...currentProject, ...updates });
    }
  }

  deleteProject(id: string): void {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    const project = this.getProjectById(id);
    if (project) {
      // Update workspace project count
      const workspace = this.getWorkspaceById(project.workspaceId);
      if (workspace) {
        this.updateWorkspace(project.workspaceId, { projectCount: Math.max(0, workspace.projectCount - 1) });
      }
    }

    const projects = this.projectsSubject.value.filter(p => p.id !== id);
    this.projectsSubject.next(projects);
    this.saveToStorage(`projects_${userId}`, projects);
  }

  // Data Source Methods
  addDataSource(projectId: string, dataSource: DataSource): void {
    const project = this.getProjectById(projectId);
    if (!project) return;

    const dataSources = [...project.dataSources, dataSource];
    this.updateProject(projectId, { dataSources });
  }

  removeDataSource(projectId: string, dataSourceId: string): void {
    const project = this.getProjectById(projectId);
    if (!project) return;

    const dataSources = project.dataSources.filter(ds => ds.id !== dataSourceId);
    this.updateProject(projectId, { dataSources });
  }

  // Filter Operations Methods
  addFilterOperation(projectId: string, operation: FilterOperation): void {
    const project = this.getProjectById(projectId);
    if (!project) return;

    const filterOperations = [...project.filterOperations, operation];
    this.updateProject(projectId, { filterOperations });
  }

  setFilteredData(projectId: string, data: any[], headers: string[]): void {
    this.updateProject(projectId, { 
      filteredData: data, 
      filteredHeaders: headers,
      status: 'completed'
    });
  }

  // Current Project
  setCurrentProject(project: Project | null): void {
    this.currentProjectSubject.next(project);
  }

  getCurrentProject(): Project | null {
    return this.currentProjectSubject.value;
  }

  // Re-run analysis
  async reRunAnalysis(projectId: string): Promise<{data: any[], headers: string[]}> {
    const project = this.getProjectById(projectId);
    if (!project) throw new Error('Project not found');

    // This would re-run the filter operations on the original data
    // For now, we return the stored filtered data
    if (project.filteredData && project.filteredHeaders) {
      return {
        data: project.filteredData,
        headers: project.filteredHeaders
      };
    }

    throw new Error('No filtered data available');
  }
}
