import { Routes } from '@angular/router';
import { LayoutComponent } from '../../shared/layout/layout.component';

export const TEACHER_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.TeacherDashboardComponent) },
      { path: 'schedule', loadComponent: () => import('./schedule/schedule.component').then(m => m.ScheduleComponent) },
      { path: 'availability', loadComponent: () => import('./availability/availability.component').then(m => m.AvailabilityComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
