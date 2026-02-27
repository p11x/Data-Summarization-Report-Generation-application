import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

// Lazy-loaded components using dynamic imports
export const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { 
    path: 'auth', 
    loadComponent: () => import('./auth/auth.component').then(m => m.AuthComponent) 
  },
  { 
    path: 'home', 
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent), 
    canActivate: [AuthGuard] 
  },
  { path: 'dashboard', redirectTo: '/home', pathMatch: 'full' },
  { 
    path: 'upload', 
    loadComponent: () => import('./upload/upload.component').then(m => m.UploadComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'report', 
    loadComponent: () => import('./report/report.component').then(m => m.ReportComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'download', 
    loadComponent: () => import('./download/download.component').then(m => m.DownloadComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'settings', 
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'topics', 
    loadComponent: () => import('./topics/topics.component').then(m => m.TopicsComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'topic/:id', 
    loadComponent: () => import('./topic-detail/topic-detail.component').then(m => m.TopicDetailComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'api-connector', 
    loadComponent: () => import('./api-connector/api-connector.component').then(m => m.ApiConnectorComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'website', 
    loadComponent: () => import('./website-connector/website-connector.component').then(m => m.WebsiteConnectorComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'data-processing', 
    loadComponent: () => import('./data-processing/data-processing.component').then(m => m.DataProcessingComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'data-filter', 
    loadComponent: () => import('./data-filter/data-filter.component').then(m => m.DataFilterComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'filtered-data', 
    loadComponent: () => import('./filtered-data/filtered-data.component').then(m => m.FilteredDataComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'projects', 
    loadComponent: () => import('./projects/projects.component').then(m => m.ProjectsComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'versions', 
    loadComponent: () => import('./version-history/version-history.component').then(m => m.VersionHistoryComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'pipeline', 
    loadComponent: () => import('./pipeline/pipeline-builder.component').then(m => m.PipelineBuilderComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'compressor', 
    loadComponent: () => import('./compressor/compressor.component').then(m => m.CompressorComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'converter', 
    loadComponent: () => import('./converter/converter.component').then(m => m.ConverterComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'anomaly-detection', 
    loadComponent: () => import('./anomaly-detection/anomaly-detection.component').then(m => m.AnomalyDetectionComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'what-if', 
    loadComponent: () => import('./what-if-analysis/what-if-analysis.component').then(m => m.WhatIfAnalysisComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'semantic-search', 
    loadComponent: () => import('./semantic-search/semantic-search.component').then(m => m.SemanticSearchComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'forecasting', 
    loadComponent: () => import('./forecasting/forecasting.component').then(m => m.ForecastingComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'lineage', 
    loadComponent: () => import('./data-lineage/data-lineage.component').then(m => m.DataLineageComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'data-sources', 
    loadComponent: () => import('./data-sources/data-sources.component').then(m => m.DataSourcesComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'pipelines', 
    loadComponent: () => import('./pipelines/pipelines.component').then(m => m.PipelinesComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'recent-reports', 
    loadComponent: () => import('./recent-reports/recent-reports.component').then(m => m.RecentReportsComponent), 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'ai-insights', 
    loadComponent: () => import('./ai-insights/ai-insights.component').then(m => m.AiInsightsComponent), 
    canActivate: [AuthGuard] 
  },
  { path: '**', redirectTo: '/auth' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
