import { Routes } from '@angular/router';
import { LayoutComponent } from '../../shared/layout/layout.component';

export const SUPER_ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.SuperAdminDashboardComponent) },
      { path: 'schools', loadComponent: () => import('./schools/schools.component').then(m => m.SchoolsComponent) },
      { path: 'admins', loadComponent: () => import('./admins/admins.component').then(m => m.AdminsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
