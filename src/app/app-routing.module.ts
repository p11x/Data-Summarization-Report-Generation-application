import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthComponent } from './auth/auth.component';
import { UploadComponent } from './upload/upload.component';
import { ReportComponent } from './report/report.component';
import { DownloadComponent } from './download/download.component';
import { ProfileComponent } from './profile/profile.component';
import { SettingsComponent } from './settings/settings.component';
import { TopicsComponent } from './topics/topics.component';
import { TopicDetailComponent } from './topic-detail/topic-detail.component';
import { ApiConnectorComponent } from './api-connector/api-connector.component';
import { WebsiteConnectorComponent } from './website-connector/website-connector.component';

export const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { path: 'home', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', redirectTo: '/home', pathMatch: 'full' },
  { path: 'upload', component: UploadComponent, canActivate: [AuthGuard] },
  { path: 'report', component: ReportComponent, canActivate: [AuthGuard] },
  { path: 'download', component: DownloadComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  { path: 'topics', component: TopicsComponent, canActivate: [AuthGuard] },
  { path: 'topic/:id', component: TopicDetailComponent, canActivate: [AuthGuard] },
  { path: 'api-connector', component: ApiConnectorComponent, canActivate: [AuthGuard] },
  { path: 'website', component: WebsiteConnectorComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/auth' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }