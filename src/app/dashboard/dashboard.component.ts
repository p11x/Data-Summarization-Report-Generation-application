import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { DataAnalysisService, RecentFile } from '../services/data-analysis.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DashboardComponent implements OnInit {
  searchQuery: string = '';
  hasData: boolean = false;
  recentUploadedFiles: RecentFile[] = [];
  recentDownloadedFiles: RecentFile[] = [];
  isProfileMenuOpen: boolean = false;

  featuredOptions = [
    { id: 1, title: 'Add File', description: 'Upload and manage your files', icon: '📁', action: 'add-file' },
    { id: 2, title: 'Select Topic', description: 'Choose topics of interest', icon: '📌', action: 'select-topic' },
    { id: 3, title: 'Website', description: 'Explore curated websites', icon: '🌐', action: 'website' }
  ];

  constructor(
    private authService: AuthService, 
    private router: Router,
    private dataAnalysisService: DataAnalysisService
  ) {}

  ngOnInit() {
    const fileData = this.dataAnalysisService.getFileData();
    this.hasData = !!fileData && fileData.parsedData.length > 0;
    
    // Load recent files
    this.recentUploadedFiles = this.dataAnalysisService.getRecentUploadedFiles();
    this.recentDownloadedFiles = this.dataAnalysisService.getRecentDownloadedFiles();
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
      // Implement search functionality
    }
  }

  onFeatureAction(action: string) {
    console.log('Feature action:', action);
    switch (action) {
      case 'add-file':
        this.router.navigate(['/upload']);
        break;
      case 'select-topic':
        this.router.navigate(['/topics']);
        break;
      case 'website':
        // Navigate to websites page
        break;
    }
  }

  goToDownload() {
    this.router.navigate(['/download']);
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  goToProfile() {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/profile']);
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  logout() {
    this.isProfileMenuOpen = false;
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown')) {
      this.isProfileMenuOpen = false;
    }
  }
}
