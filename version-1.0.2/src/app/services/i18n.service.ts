import { Injectable, signal } from '@angular/core';

/**
 * i18n Service
 * 
 * Provides simple internationalization support for the application.
 * For full i18n with @angular/localize, you need to set up
 * translation files and configure angular.json.
 * 
 * This service provides a simple key-value translation system
 * that can be extended to use @angular/localize or ngx-translate.
 */
export interface Translations {
  [key: string]: string;
}

export interface LocaleConfig {
  code: string;
  name: string;
  dir: 'ltr' | 'rtl';
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  // Current locale
  readonly currentLocale = signal<string>('en');
  
  // Available locales
  readonly locales: LocaleConfig[] = [
    { code: 'en', name: 'English', dir: 'ltr' },
    { code: 'es', name: 'Español', dir: 'ltr' },
    { code: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'de', name: 'Deutsch', dir: 'ltr' },
    { code: 'zh', name: '中文', dir: 'ltr' },
    { code: 'ja', name: '日本語', dir: 'ltr' },
    { code: 'ar', name: 'العربية', dir: 'rtl' }
  ];

  // Translations
  private translations: { [locale: string]: Translations } = {
    en: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.upload': 'Upload',
      'nav.download': 'Download',
      'nav.report': 'Report',
      'nav.topics': 'Topics',
      'nav.settings': 'Settings',
      'nav.profile': 'Profile',
      
      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.search': 'Search',
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      
      // Dashboard
      'dashboard.title': 'Data Analytics Dashboard',
      'dashboard.welcome': 'Welcome to Data Analytics',
      'dashboard.recentFiles': 'Recent Files',
      'dashboard.quickActions': 'Quick Actions',
      
      // Upload
      'upload.title': 'Upload Data',
      'upload.dragDrop': 'Drag & drop files here',
      'upload.browse': 'or click to browse',
      'upload.supported': 'Supported formats: CSV, JSON, Excel',
      
      // Report
      'report.title': 'Generate Report',
      'report.type': 'Report Type',
      'report.format': 'Format',
      'report.generate': 'Generate Report',
      
      // Topics
      'topics.title': 'Data Topics',
      'topics.search': 'Search topics...',
      'topics.categories': 'Categories',
      
      // Settings
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'settings.theme': 'Theme',
      'settings.notifications': 'Notifications'
    },
    es: {
      // Navigation
      'nav.dashboard': 'Panel',
      'nav.upload': 'Subir',
      'nav.download': 'Descargar',
      'nav.report': 'Informe',
      'nav.topics': 'Temas',
      'nav.settings': 'Configuración',
      'nav.profile': 'Perfil',
      
      // Common
      'common.save': 'Guardar',
      'common.cancel': 'Cancelar',
      'common.delete': 'Eliminar',
      'common.edit': 'Editar',
      'common.search': 'Buscar',
      'common.loading': 'Cargando...',
      'common.error': 'Error',
      'common.success': 'Éxito',
      
      // Dashboard
      'dashboard.title': 'Panel de Análisis de Datos',
      'dashboard.welcome': 'Bienvenido al Análisis de Datos',
      'dashboard.recentFiles': 'Archivos Recientes',
      'dashboard.quickActions': 'Acciones Rápidas',
      
      // Upload
      'upload.title': 'Subir Datos',
      'upload.dragDrop': 'Arrastra y suelta archivos aquí',
      'upload.browse': 'o haz clic para explorar',
      'upload.supported': 'Formatos soportados: CSV, JSON, Excel',
      
      // Report
      'report.title': 'Generar Informe',
      'report.type': 'Tipo de Informe',
      'report.format': 'Formato',
      'report.generate': 'Generar Informe',
      
      // Topics
      'topics.title': 'Temas de Datos',
      'topics.search': 'Buscar temas...',
      'topics.categories': 'Categorías',
      
      // Settings
      'settings.title': 'Configuración',
      'settings.language': 'Idioma',
      'settings.theme': 'Tema',
      'settings.notifications': 'Notificaciones'
    },
    fr: {
      // Navigation
      'nav.dashboard': 'Tableau de bord',
      'nav.upload': 'Télécharger',
      'nav.download': 'Télécharger',
      'nav.report': 'Rapport',
      'nav.topics': 'Sujets',
      'nav.settings': 'Paramètres',
      'nav.profile': 'Profil',
      
      // Common
      'common.save': 'Enregistrer',
      'common.cancel': 'Annuler',
      'common.delete': 'Supprimer',
      'common.edit': 'Modifier',
      'common.search': 'Rechercher',
      'common.loading': 'Chargement...',
      'common.error': 'Erreur',
      'common.success': 'Succès',
      
      // Dashboard
      'dashboard.title': 'Tableau de Bord Analytics',
      'dashboard.welcome': 'Bienvenue dans Analytics',
      'dashboard.recentFiles': 'Fichiers Récents',
      'dashboard.quickActions': 'Actions Rapides',
      
      // Upload
      'upload.title': 'Télécharger des Données',
      'upload.dragDrop': 'Glissez et déposez des fichiers ici',
      'upload.browse': 'ou cliquez pour parcourir',
      'upload.supported': 'Formats pris en charge: CSV, JSON, Excel',
      
      // Report
      'report.title': 'Générer un Rapport',
      'report.type': 'Type de Rapport',
      'report.format': 'Format',
      'report.generate': 'Générer le Rapport',
      
      // Topics
      'topics.title': 'Sujets de Données',
      'topics.search': 'Rechercher des sujets...',
      'topics.categories': 'Catégories',
      
      // Settings
      'settings.title': 'Paramètres',
      'settings.language': 'Langue',
      'settings.theme': 'Thème',
      'settings.notifications': 'Notifications'
    }
  };

  constructor() {
    // Load saved locale from localStorage
    this.loadSavedLocale();
  }

  /**
   * Get translation for a key
   */
  t(key: string, params?: { [key: string]: string }): string {
    const locale = this.currentLocale();
    const translations = this.translations[locale] || this.translations['en'];
    let value = translations[key] || key;

    // Replace parameters
    if (params) {
      Object.keys(params).forEach(param => {
        value = value.replace(`{{${param}}}`, params[param]);
      });
    }

    return value;
  }

  /**
   * Set the current locale
   */
  setLocale(localeCode: string): void {
    if (this.locales.some(l => l.code === localeCode)) {
      this.currentLocale.set(localeCode);
      this.saveLocale(localeCode);
      this.updateDocumentDirection(localeCode);
    }
  }

  /**
   * Get current locale direction
   */
  getDirection(): 'ltr' | 'rtl' {
    const locale = this.locales.find(l => l.code === this.currentLocale());
    return locale?.dir || 'ltr';
  }

  /**
   * Load saved locale from localStorage
   */
  private loadSavedLocale(): void {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('app_locale');
      if (saved && this.locales.some(l => l.code === saved)) {
        this.currentLocale.set(saved);
      }
    }
  }

  /**
   * Save locale to localStorage
   */
  private saveLocale(localeCode: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('app_locale', localeCode);
    }
  }

  /**
   * Update document direction for RTL languages
   */
  private updateDocumentDirection(localeCode: string): void {
    if (typeof document !== 'undefined') {
      const dir = this.getDirection();
      document.documentElement.dir = dir;
      document.documentElement.lang = localeCode;
    }
  }
}
