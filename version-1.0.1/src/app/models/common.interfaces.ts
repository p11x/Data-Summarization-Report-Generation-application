/**
 * Common TypeScript Interfaces
 * 
 * Shared type definitions for the application.
 * Use these interfaces to ensure type safety across the app.
 */

// Base interface for all entities
export interface Entity {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Pagination interface
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// User related interfaces
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export type UserRole = 'admin' | 'user' | 'guest';

// File upload related interfaces
export interface FileUpload {
  id: number;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: Date;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Chart related interfaces
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
}

// Report related interfaces
export interface Report {
  id: number;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: User;
  status: ReportStatus;
  format: ReportFormat;
}

export type ReportStatus = 'draft' | 'pending' | 'completed' | 'failed';
export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json';

// Topic related interfaces
export interface Topic {
  id: number;
  name: string;
  description?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

// Error handling
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

// Form validation
export interface ValidationError {
  field: string;
  message: string;
}

// API Request/Response types
export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}
