import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'super-admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_SUPER_ADMIN'] },
    loadChildren: () => import('./features/super-admin/super-admin.routes').then(m => m.SUPER_ADMIN_ROUTES)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'] },
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'teacher',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_TEACHER'] },
    loadChildren: () => import('./features/teacher/teacher.routes').then(m => m.TEACHER_ROUTES)
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
