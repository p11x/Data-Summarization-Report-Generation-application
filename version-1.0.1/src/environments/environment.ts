// Development environment configuration
// This file is replaced during build by the production configuration

export const environment = {
  production: false,
  // API Configuration
  apiBaseUrl: 'http://localhost:3000/api',
  // Feature Flags
  enableDebugMode: true,
  enableLogging: true,
  // External API Configuration
  corsProxies: [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest='
  ],
  // App Configuration
  appName: 'App3',
  appVersion: '1.2.0',
  // Cache Configuration
  cacheEnabled: true,
  cacheDuration: 300000, // 5 minutes in ms
  // Pagination defaults
  defaultPageSize: 20,
  maxPageSize: 100,
  // API Request Configuration
  requestTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  // Analytics (if enabled)
  analyticsEnabled: false,
  analyticsId: ''
};
