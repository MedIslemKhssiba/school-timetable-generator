import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  const role = authService.getRole();
  if (role === 'ROLE_SUPER_ADMIN') return router.createUrlTree(['/super-admin']);
  if (role === 'ROLE_ADMIN') return router.createUrlTree(['/admin']);
  return router.createUrlTree(['/teacher']);
};
