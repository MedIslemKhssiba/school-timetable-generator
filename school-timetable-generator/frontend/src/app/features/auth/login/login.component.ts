import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
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
          <img src="https://i.postimg.cc/9QHRyzcn/Logo-ecocode.png" alt="Logo" class="brand-logo" />
        </div>

        <c-card class="login-card shadow-lg border-0">
          <c-card-body class="p-4 p-md-5">
            <h2 class="mb-1 fw-bold">{{ t('welcome_back') }}</h2>
            <p class="text-body-secondary mb-4">{{ t('sign_in_subtitle') }}</p>

            @if (errorMessage) {
              <c-alert color="danger" class="d-flex align-items-center mb-3" [dismissible]="false">
                {{ errorMessage }}
              </c-alert>
            }

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <div class="mb-3">
                <label cLabel for="email">{{ t('email') }}</label>
                <input cFormControl id="email" formControlName="email" type="email" placeholder="you@school.edu" autocomplete="email" />
                @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                  <div class="text-danger small mt-1">Please enter a valid email</div>
                }
              </div>

              <div class="mb-4">
                <label cLabel for="password">{{ t('password') }}</label>
                <div class="password-wrapper">
                  <input cFormControl id="password" formControlName="password"
                    [type]="hidePassword ? 'password' : 'text'" placeholder="Enter your password" autocomplete="current-password" />
                  <button type="button" class="password-toggle" (click)="hidePassword = !hidePassword">
                    @if (hidePassword) {
                      &#128065;
                    } @else {
                      &#128064;
                    }
                  </button>
                </div>
              </div>

              <button cButton color="primary" class="w-100 py-2 fw-semibold login-btn" type="submit"
                      [disabled]="loginForm.invalid || loading">
                @if (loading) {
                  <c-spinner size="sm" class="me-2"></c-spinner> {{ t('signing_in') }}
                } @else {
                  {{ t('sign_in') }}
                }
              </button>
            </form>

            <div class="d-flex align-items-center gap-2 mt-4 pt-3 border-top text-body-secondary" style="font-size: 0.8rem;">
              <span>{{ t('contact_admin') }}</span>
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
      background: linear-gradient(135deg, #1E40AF 0%, #2563EB 40%, #3B82F6 70%, #60A5FA 100%);
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
    }

    .bg-shape-1 {
      width: 600px;
      height: 600px;
      top: -200px;
      right: -150px;
      background: rgba(255, 255, 255, 0.06);
    }

    .bg-shape-2 {
      width: 450px;
      height: 450px;
      bottom: -150px;
      left: -100px;
      background: rgba(255, 255, 255, 0.04);
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

      .brand-logo {
        width: 130px; height: 130px;
        border-radius: 0;
        margin-bottom: 16px;
        filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.2));
        object-fit: contain;
      }

      p {
        opacity: 0.75;
        margin: 0;
        font-size: 0.95rem;
        font-weight: 400;
      }
    }

    .password-wrapper {
      position: relative;
      .password-toggle {
        position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        background: none; border: none; cursor: pointer; font-size: 1.1rem;
        padding: 2px 4px; line-height: 1; opacity: 0.6;
        &:hover { opacity: 1; }
      }
      input { padding-right: 40px; }
    }

    .login-card {
      border-radius: 20px !important;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
      border: none !important;
    }

    .login-btn {
      font-size: 1rem !important;
      border-radius: 12px !important;
      padding: 0.7rem 1.5rem !important;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #2563EB, #3B82F6) !important;
      border: none !important;
      transition: transform 0.2s, box-shadow 0.2s;
      font-weight: 700 !important;
      letter-spacing: 0.01em;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4) !important;
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }
    }

    .input-group-text {
      background: #F1F5F9;
      border-color: #CBD5E1;
    }

    .cursor-pointer { cursor: pointer; }

    input::-ms-reveal,
    input::-webkit-credentials-auto-fill-button { display: none !important; }

    @media (max-width: 480px) {
      .login-brand h1 { font-size: 1.75rem; }
      .login-card { border-radius: 16px !important; }
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
    private router: Router,
    public ts: TranslationService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  t(key: string): string { return this.ts.t(key); }

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
