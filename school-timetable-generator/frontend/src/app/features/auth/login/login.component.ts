import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import {
  CardModule, FormModule, GridModule, ButtonModule, AlertComponent, SpinnerComponent
} from '@coreui/angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    CardModule, FormModule, GridModule, ButtonModule, AlertComponent, SpinnerComponent
  ],
  template: `
    <div class="login-page">
      <div class="login-bg">
        <div class="bg-shape bg-shape-1"></div>
        <div class="bg-shape bg-shape-2"></div>
      </div>
      <div class="login-wrapper">
        <div class="login-brand">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="white">
            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
          </svg>
          <h1>EduSchedule</h1>
          <p>Smart Timetable Generator</p>
        </div>

        <c-card class="login-card shadow-lg border-0">
          <c-card-body class="p-4 p-md-5">
            <h2 class="mb-1 fw-bold">Welcome Back</h2>
            <p class="text-body-secondary mb-4">Sign in to your account to continue</p>

            @if (errorMessage) {
              <c-alert color="danger" class="d-flex align-items-center mb-3" [dismissible]="false">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-2 flex-shrink-0">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                {{ errorMessage }}
              </c-alert>
            }

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <div class="mb-3">
                <label cLabel for="email">Email Address</label>
                <div class="input-group">
                  <span class="input-group-text">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="#9da5b1">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </span>
                  <input cFormControl id="email" formControlName="email" type="email" placeholder="you@school.edu" autocomplete="email" />
                </div>
                @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                  <div class="text-danger small mt-1">Please enter a valid email</div>
                }
              </div>

              <div class="mb-4">
                <label cLabel for="password">Password</label>
                <div class="input-group">
                  <span class="input-group-text">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="#9da5b1">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                  </span>
                  <input cFormControl id="password" formControlName="password"
                    [type]="hidePassword ? 'password' : 'text'" placeholder="Enter your password" autocomplete="current-password" />
                  <button type="button" class="input-group-text cursor-pointer" (click)="hidePassword = !hidePassword">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="#9da5b1">
                      @if (hidePassword) {
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                      } @else {
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      }
                    </svg>
                  </button>
                </div>
              </div>

              <button cButton color="primary" class="w-100 py-2 fw-semibold login-btn" type="submit"
                      [disabled]="loginForm.invalid || loading">
                @if (loading) {
                  <c-spinner size="sm" class="me-2"></c-spinner> Signing in...
                } @else {
                  Sign In
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="ms-2">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                  </svg>
                }
              </button>
            </form>

            <div class="d-flex align-items-center gap-2 mt-4 pt-3 border-top text-body-secondary" style="font-size: 0.8rem;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              <span>Contact your administrator if you need an account</span>
            </div>
          </c-card-body>
        </c-card>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      position: relative;
      overflow: hidden;
      padding: 24px;
    }

    .login-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .bg-shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
    }

    .bg-shape-1 {
      width: 500px;
      height: 500px;
      top: -150px;
      right: -100px;
    }

    .bg-shape-2 {
      width: 400px;
      height: 400px;
      bottom: -120px;
      left: -80px;
    }

    .login-wrapper {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 440px;
    }

    .login-brand {
      text-align: center;
      margin-bottom: 2rem;
      color: white;

      h1 {
        font-size: 2rem;
        font-weight: 700;
        margin: 12px 0 6px;
        letter-spacing: -0.03em;
      }

      p {
        opacity: 0.8;
        margin: 0;
        font-size: 0.95rem;
      }
    }

    .login-card {
      border-radius: 16px !important;
      overflow: hidden;
    }

    .login-btn {
      font-size: 1rem;
      border-radius: 10px !important;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #4f46e5, #7c3aed) !important;
      border: none !important;
      transition: transform 0.15s, box-shadow 0.15s;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
      }
    }

    .input-group-text {
      background: #f8f9fa;
      border-color: #d8dbe0;
    }

    .cursor-pointer { cursor: pointer; }

    @media (max-width: 480px) {
      .login-brand h1 { font-size: 1.5rem; }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.loading = false;
        this.redirectByRole(res.role);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 401) {
          this.errorMessage = err.error?.message || 'Invalid email or password';
        } else if (err.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please try again later.';
        } else {
          this.errorMessage = 'An unexpected error occurred. Please try again.';
        }
      }
    });
  }

  private redirectByRole(role: string | null): void {
    if (role === 'ROLE_SUPER_ADMIN') this.router.navigate(['/super-admin']);
    else if (role === 'ROLE_ADMIN') this.router.navigate(['/admin']);
    else this.router.navigate(['/teacher']);
  }
}
