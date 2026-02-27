// Production environment configuration
// This file is used when building for production
// 
// NOTE: Sensitive values should be injected via environment variables at build time
// Example: apiBaseUrl can be set via environment files or build arguments

export const environment = {
  production: true,
  // API Configuration - Update this to your production API URL
  // Can also be set via build: --configuration production -- --api-url=https://api.example.com
  apiBaseUrl: '/api',
  // Feature Flags
  enableDebugMode: false,
  enableLogging: false,
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
  cacheDuration: 600000, // 10 minutes in ms for production
  // Pagination defaults
  defaultPageSize: 20,
  maxPageSize: 100,
  // API Request Configuration
  requestTimeout: 30000, // 30 seconds
  retryAttempts: 3,
  // Analytics (if enabled)
  analyticsEnabled: false,
  analyticsId: '',
  // Sentry DSN - In production, use environment variable or secret management
  // Example: process.env.SENTRY_DSN or load from secure config
  // For now, this is a placeholder - configure before deploying to production
  sentryDsn: '' // TODO: Set via environment variable or secure config in production
};
