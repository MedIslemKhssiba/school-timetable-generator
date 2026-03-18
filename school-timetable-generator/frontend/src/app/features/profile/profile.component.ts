import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule, ButtonDirective, FormModule } from '@coreui/angular';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, ButtonDirective, FormModule],
  template: `
    <div class="profile-container">
      <div class="profile-avatar-section">
        <div class="sidebar-avatar">{{ userInitials }}</div>
        <h4 class="sidebar-name">{{ userName }}</h4>
        <p class="sidebar-email">{{ userEmail }}</p>
      </div>

      <div class="profile-content">
        <c-card class="info-card mb-4">
          <c-card-header>
            <div class="card-header-content">
              <strong>{{ t('profile_information') }}</strong>
            </div>
          </c-card-header>
          <c-card-body>
            <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
              <div class="form-row-grid">
                <div class="mb-3">
                  <label cLabel for="firstName" class="form-label-custom">{{ t('first_name') }}</label>
                  <input cFormControl id="firstName" formControlName="firstName" />
                </div>
                <div class="mb-3">
                  <label cLabel for="lastName" class="form-label-custom">{{ t('last_name') }}</label>
                  <input cFormControl id="lastName" formControlName="lastName" />
                </div>
              </div>
              <div class="mb-3">
                <label cLabel for="email" class="form-label-custom">{{ t('email') }}</label>
                <input cFormControl id="email" formControlName="email" type="email" readonly class="readonly-field" />
              </div>
              <button cButton color="primary" type="submit" class="save-btn" [disabled]="profileForm.invalid || profileForm.pristine || savingProfile">
                {{ savingProfile ? t('saving') : t('save_changes') }}
              </button>
            </form>
          </c-card-body>
        </c-card>

        <c-card class="info-card">
          <c-card-header>
            <div class="card-header-content">
              <strong>{{ t('change_password') }}</strong>
            </div>
          </c-card-header>
          <c-card-body>
            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
              <div class="form-row-grid">
                <div class="mb-3">
                  <label cLabel for="currentPassword" class="form-label-custom">{{ t('current_password') }}</label>
                  <input cFormControl id="currentPassword" formControlName="currentPassword" type="password" autocomplete="current-password" />
                </div>
                <div class="mb-3">
                  <label cLabel for="newPassword" class="form-label-custom">{{ t('new_password') }}</label>
                  <input cFormControl id="newPassword" formControlName="newPassword" type="password" autocomplete="new-password" />
                </div>
              </div>
              <div class="mb-3">
                <label cLabel for="confirmPassword" class="form-label-custom">{{ t('confirm_new_password') }}</label>
                <input cFormControl id="confirmPassword" formControlName="confirmPassword" type="password" autocomplete="new-password" />
              </div>
              @if (passwordForm.hasError('mismatch')) {
                <p class="text-danger small mb-3">{{ t('passwords_no_match') }}</p>
              }
              <button cButton color="warning" type="submit" class="save-btn" [disabled]="passwordForm.invalid || savingPassword">
                {{ savingPassword ? t('changing') : t('change_password') }}
              </button>
            </form>
          </c-card-body>
        </c-card>
      </div>
    </div>
  `,
  styles: [`
    .profile-container { padding: 24px; }

    .profile-avatar-section {
      text-align: center; padding: 20px 0 24px;
      border-bottom: 1px solid #DDE3EE; margin-bottom: 24px;
    }
    .sidebar-avatar {
      width: 72px; height: 72px; border-radius: 16px;
      background: #2563EB;
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; font-weight: 700; font-family: 'Montserrat', sans-serif; margin: 0 auto 12px;
      border: 3px solid rgba(37, 99, 235,0.2);
    }
    .sidebar-name { font-weight: 700; font-size: 1rem; color: #1A2332; margin: 0 0 4px; font-family: 'Montserrat', sans-serif; }
    .sidebar-email { color: #8D99A8; font-size: 0.8rem; margin: 0; }

    .profile-content { flex: 1; min-width: 0; }

    .info-card {
      border: 1px solid #DDE3EE !important; border-radius: 14px !important;
      box-shadow: 0 2px 8px rgba(13, 27, 62,0.06) !important; background: #F8FAFF !important;
    }
    .card-header-content { display: flex; align-items: center; gap: 8px; }
    .form-label-custom { font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; color: #8D99A8; }
    .form-row-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .readonly-field { background: #F0F4FA !important; cursor: not-allowed; }
    .save-btn {
      display: flex; align-items: center; border-radius: 10px !important;
      font-weight: 600 !important; padding: 0.5rem 1.25rem !important;
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  savingProfile = false;
  savingPassword = false;
  userName = '';
  userInitials = '';
  userEmail = '';

  constructor(private authService: AuthService, private fb: FormBuilder, private notify: NotificationService, private ts: TranslationService) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  t(key: string): string { return this.ts.t(key); }

  ngOnInit(): void {
    this.authService.getProfile().subscribe(user => {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
      this.userName = `${user.firstName} ${user.lastName}`;
      this.userInitials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
      this.userEmail = user.email;
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile = true;
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.notify.success('Profile updated successfully');
        this.profileForm.markAsPristine();
        this.savingProfile = false;
      },
      error: () => { this.notify.error('Failed to update profile'); this.savingProfile = false; }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.savingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.notify.success('Password changed successfully');
        this.passwordForm.reset();
        this.savingPassword = false;
      },
      error: () => { this.notify.error('Failed to change password'); this.savingPassword = false; }
    });
  }

  private passwordMatchValidator(group: FormGroup): { mismatch: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }
}
