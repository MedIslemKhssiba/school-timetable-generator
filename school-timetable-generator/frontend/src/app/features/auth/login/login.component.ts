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
      <div class="login-left">
        <div class="left-content">
          <img src="https://i.postimg.cc/9QHRyzcn/Logo-ecocode.png" alt="Logo" class="hero-logo" />
        </div>
      </div>

      <div class="login-right">
        <div class="login-form-wrapper">
          <h2 class="form-title">{{ t('welcome_back') }}</h2>
          <p class="form-subtitle">{{ t('sign_in_subtitle') }}</p>

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
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
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

          <div class="login-footer">
            <span>{{ t('contact_admin') }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      background: #F0F4FA;
    }

    /* ── LEFT PANEL ── */
    .login-left {
      flex: 0 0 45%;
      background: linear-gradient(160deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      padding: 3rem;
    }

    .left-content {
      position: relative;
      z-index: 2;
      text-align: center;
    }

    .hero-logo {
      width: 240px; height: 240px;
      object-fit: contain;
      filter: drop-shadow(0 12px 40px rgba(0,0,0,0.35));
    }

    /* ── RIGHT PANEL ── */
    .login-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .login-form-wrapper {
      width: 100%;
      max-width: 420px;
    }

    .form-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 2rem;
      color: #1A2332;
      margin-bottom: 0.3rem;
      font-weight: 700;
    }

    .form-subtitle {
      color: #8D99A8;
      font-size: 0.9rem;
      margin-bottom: 2rem;
      font-family: 'Montserrat', sans-serif;
    }

    .password-wrapper {
      position: relative;
      .password-toggle {
        position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        background: none; border: none; cursor: pointer; font-size: 1.1rem;
        padding: 2px 4px; line-height: 1; opacity: 0.5;
        &:hover { opacity: 1; }
      }
      input { padding-right: 40px; }
    }

    .login-btn {
      font-size: 1rem !important;
      border-radius: 12px !important;
      padding: 0.75rem 1.5rem !important;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #2563EB !important;
      border: none !important;
      color: #F0F4FA !important;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      font-weight: 600 !important;
      font-family: 'Montserrat', sans-serif !important;
      letter-spacing: 0.02em;

      &:hover:not(:disabled) {
        background: #1D4ED8 !important;
        transform: translateY(-2px);
        box-shadow: 0 8px 28px rgba(37, 99, 235, 0.3) !important;
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }
    }

    .login-footer {
      margin-top: 2rem;
      padding-top: 1.25rem;
      border-top: 1px solid #DDE3EE;
      font-size: 0.8rem;
      color: #8D99A8;
      font-family: 'Montserrat', sans-serif;
    }

    input::-ms-reveal,
    input::-webkit-credentials-auto-fill-button { display: none !important; }

    @media (max-width: 768px) {
      .login-page { flex-direction: column; }
      .login-left {
        flex: 0 0 auto;
        min-height: 200px;
        padding: 2rem;
      }
      .hero-logo { width: 120px; height: 120px; }
      .login-right { padding: 1.5rem; }
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
