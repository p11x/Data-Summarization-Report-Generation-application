import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { DataAnalysisService, RecentFile } from '../services/data-analysis.service';

interface FeatureOption {
  id: number;
  title: string;
  description: string;
  icon: string;
  action: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
  icon: string;
}

interface ChartData {
  value: number;
}

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
  isMobileMenuOpen: boolean = false;
  isMenuDropdownOpen: boolean = false;
  isScrolled: boolean = false;
  isDarkMode: boolean = false;
  searchPlaceholder: string = 'Search files...';
  placeholderIndex: number = 0;
  placeholders: string[] = [
    'Search files...',
    'Search topics...',
    'Search websites...'
  ];

  // Animated counters
  animatedFiles: number = 0;
  animatedReports: number = 0;
  animatedPipelines: number = 0;

  // Chart data
  chartData: ChartData[] = [
    { value: 40 },
    { value: 70 },
    { value: 55 },
    { value: 85 },
    { value: 60 },
    { value: 90 },
    { value: 75 }
  ];

  // Toast notifications
  toasts: Toast[] = [];

  // Feature options organized by category
  dataInputOptions: FeatureOption[] = [
    { id: 1, title: 'Add File', description: 'Upload and manage your files', icon: '📁', action: 'add-file' },
    { id: 2, title: 'Select Topic', description: 'Choose topics of interest', icon: '📌', action: 'select-topic' }
  ];

  processingOptions: FeatureOption[] = [
    { id: 3, title: 'API Connector', description: 'Connect to REST APIs & datasets', icon: '🔗', action: 'api-connector' },
    { id: 4, title: 'Website', description: 'Explore curated websites', icon: '🌐', action: 'website' },
    { id: 5, title: 'Data Filter', description: 'Filter & transform data with ETL operations', icon: '🔍', action: 'data-filter' },
    { id: 6, title: 'Data Processing', description: 'Clean, normalize & filter your data', icon: '⚙️', action: 'data-processing' }
  ];

  analysisOptions: FeatureOption[] = [
    { id: 7, title: 'Pipeline Builder', description: 'Visual drag-drop data pipeline', icon: '🔗', action: 'pipeline-builder' },
    { id: 8, title: 'Dataset Compressor', description: 'Compress & clean datasets', icon: '🗜️', action: 'compressor' },
    { id: 9, title: 'Data Converter', description: 'Convert data between formats', icon: '🔄', action: 'converter' }
  ];

  reportOptions: FeatureOption[] = [
    { id: 10, title: 'Projects', description: 'Manage workspaces & save projects', icon: '📁', action: 'projects' },
    { id: 11, title: 'Version History', description: 'View and compare report versions', icon: '📜', action: 'version-history' }
  ];

  constructor(
    private authService: AuthService, 
    private router: Router,
    private dataAnalysisService: DataAnalysisService,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    const fileData = this.dataAnalysisService.getFileData();
    this.hasData = !!fileData && fileData.parsedData.length > 0;
    
    // Load recent files
    this.recentUploadedFiles = this.dataAnalysisService.getRecentUploadedFiles();
    this.recentDownloadedFiles = this.dataAnalysisService.getRecentDownloadedFiles();

    // Start placeholder rotation
    this.startPlaceholderRotation();

    // Start counter animation
    this.animateCounters();
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  startPlaceholderRotation() {
    setInterval(() => {
      this.placeholderIndex = (this.placeholderIndex + 1) % this.placeholders.length;
      this.searchPlaceholder = this.placeholders[this.placeholderIndex];
    }, 3000);
  }

  animateCounters() {
    const targetFiles = this.recentUploadedFiles.length || 12;
    const targetReports = this.recentDownloadedFiles.length || 8;
    const targetPipelines = 5;

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      this.animatedFiles = Math.round(targetFiles * easeOut);
      this.animatedReports = Math.round(targetReports * easeOut);
      this.animatedPipelines = Math.round(targetPipelines * easeOut);

      if (step >= steps) {
        clearInterval(timer);
      }
    }, interval);
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.showToast(`Searching for: ${this.searchQuery}`, 'info', '🔍');
      console.log('Searching for:', this.searchQuery);
    }
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    this.isMobileMenuOpen = false;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.isProfileMenuOpen = false;
  }

  toggleMenuDropdown() {
    this.isMenuDropdownOpen = !this.isMenuDropdownOpen;
    this.isProfileMenuOpen = false;
    this.isMobileMenuOpen = false;
  }

  navigateTo(route: string) {
    this.isMenuDropdownOpen = false;
    this.isMobileMenuOpen = false;
    this.isProfileMenuOpen = false;
    
    switch(route) {
      case 'upload':
        this.router.navigate(['/upload']);
        break;
      case 'report':
        this.router.navigate(['/report']);
        break;
      case 'download':
        this.router.navigate(['/download']);
        break;
      case 'topics':
        this.router.navigate(['/topics']);
        break;
      case 'version-history':
        this.router.navigate(['/versions']);
        break;
      case 'projects':
        this.router.navigate(['/projects']);
        break;
      case 'settings':
        this.router.navigate(['/settings']);
        break;
      case 'data-sources':
        this.router.navigate(['/data-sources']);
        break;
      case 'pipelines':
        this.router.navigate(['/pipelines']);
        break;
      case 'recent-reports':
        this.router.navigate(['/recent-reports']);
        break;
      case 'ai-insights':
        this.router.navigate(['/ai-insights']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
    this.showToast(
      this.isDarkMode ? 'Dark mode enabled' : 'Light mode enabled',
      'success',
      this.isDarkMode ? '🌙' : '☀️'
    );
  }

  onFeatureAction(action: string) {
    console.log('Feature action:', action);
    this.showToast(`Opening ${action}...`, 'info', '⏳');
    
    switch (action) {
      case 'add-file':
        this.router.navigate(['/upload']);
        break;
      case 'select-topic':
        this.router.navigate(['/topics']);
        break;
      case 'api-connector':
        this.router.navigate(['/api-connector']);
        break;
      case 'website':
        this.router.navigate(['/website']);
        break;
      case 'data-filter':
        this.router.navigate(['/data-filter']);
        break;
      case 'projects':
        this.router.navigate(['/projects']);
        break;
      case 'data-processing':
        this.router.navigate(['/data-processing']);
        break;
      case 'version-history':
        this.router.navigate(['/versions']);
        break;
      case 'pipeline-builder':
        this.router.navigate(['/pipeline']);
        break;
      case 'compressor':
        this.router.navigate(['/compressor']);
        break;
      case 'converter':
        this.router.navigate(['/converter']);
        break;
    }
  }

  goToUpload() {
    this.router.navigate(['/upload']);
  }

  goToReport() {
    this.router.navigate(['/report']);
  }

  goToProfile() {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/profile']);
  }

  goToProjects() {
    this.isProfileMenuOpen = false;
    this.router.navigate(['/projects']);
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  logout() {
    this.isProfileMenuOpen = false;
    this.authService.logout();
  }

  getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'csv': return '📊';
      case 'xlsx':
      case 'xls': return '📗';
      case 'json': return '📋';
      case 'pdf': return '📕';
      case 'txt': return '📄';
      default: return '📁';
    }
  }

  // Card hover effects
  onCardHover(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    card.classList.add('hovered');
  }

  onCardLeave(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    card.classList.remove('hovered');
  }

  // Toast notifications
  showToast(message: string, type: 'success' | 'error' | 'info', icon: string) {
    const toast: Toast = { message, type, show: true, icon };
    this.toasts.push(toast);

    setTimeout(() => {
      toast.show = false;
      setTimeout(() => this.removeToast(toast), 300);
    }, 3000);
  }

  removeToast(toast: Toast) {
    const index = this.toasts.indexOf(toast);
    if (index > -1) {
      this.toasts.splice(index, 1);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown')) {
      this.isProfileMenuOpen = false;
    }
  }
}
