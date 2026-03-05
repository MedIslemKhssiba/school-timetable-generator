import { Routes } from '@angular/router';
import { LayoutComponent } from '../../shared/layout/layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'teachers', loadComponent: () => import('./teachers/teachers.component').then(m => m.TeachersComponent) },
      { path: 'classes', loadComponent: () => import('./classes/classes.component').then(m => m.ClassesComponent) },
      { path: 'subjects', loadComponent: () => import('./subjects/subjects.component').then(m => m.SubjectsComponent) },
      { path: 'rooms', loadComponent: () => import('./rooms/rooms.component').then(m => m.RoomsComponent) },
      { path: 'timetable', loadComponent: () => import('./timetable/timetable.component').then(m => m.TimetableComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
