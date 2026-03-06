import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const token = authService.getToken();

  let request = req;
  if (token) {
    request = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.forceLogout();
      }
      return throwError(() => error);
    })
  );
};
