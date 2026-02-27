import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface AppSettings {
  // Appearance
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  
  // Privacy
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showPhone: boolean;
  activityStatus: boolean;
  
  // Security
  twoFactorAuth: boolean;
  sessionTimeout: number;
  
  // Data & Storage
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  dataUsage: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SettingsComponent implements OnInit {
  settings: AppSettings = {
    theme: 'light',
    fontSize: 'medium',
    language: 'en',
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: false,
    marketingEmails: false,
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    activityStatus: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    autoBackup: true,
    backupFrequency: 'weekly',
    dataUsage: '0 MB'
  };

  originalSettings: AppSettings = { ...this.settings };
  hasChanges: boolean = false;
  activeSection: string = 'appearance';

  languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
    { code: 'zh', name: 'Chinese' }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      this.originalSettings = { ...this.settings };
    }
  }

  setActiveSection(section: string) {
    this.activeSection = section;
  }

  onSettingChange() {
    this.hasChanges = JSON.stringify(this.settings) !== JSON.stringify(this.originalSettings);
  }

  saveSettings() {
    localStorage.setItem('appSettings', JSON.stringify(this.settings));
    this.originalSettings = { ...this.settings };
    this.hasChanges = false;
    
    // Apply theme if changed
    this.applyTheme();
    
    console.log('Settings saved successfully');
  }

  applyTheme() {
    if (this.settings.theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  resetToDefaults() {
    this.settings = {
      theme: 'light',
      fontSize: 'medium',
      language: 'en',
      emailNotifications: true,
      pushNotifications: true,
      weeklyDigest: false,
      marketingEmails: false,
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      activityStatus: true,
      twoFactorAuth: false,
      sessionTimeout: 30,
      autoBackup: true,
      backupFrequency: 'weekly',
      dataUsage: '0 MB'
    };
    this.onSettingChange();
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  clearCache() {
    localStorage.removeItem('cachedData');
    console.log('Cache cleared');
  }

  exportData() {
    const data = {
      settings: this.settings,
      profile: JSON.parse(localStorage.getItem('userProfile') || '{}'),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'myapp-data-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }
}