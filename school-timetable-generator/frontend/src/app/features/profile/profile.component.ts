import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule, GridModule, ButtonDirective, FormModule } from '@coreui/angular';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, GridModule, ButtonDirective, FormModule],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">My Profile</h2>
        <p class="page-subtitle">Manage your account information</p>
      </div>
    </div>

    <c-row>
      <c-col lg="6" class="mb-4">
        <c-card class="h-100 profile-card">
          <c-card-header class="d-flex align-items-center gap-2">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#1565C0"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            <strong>Profile Information</strong>
          </c-card-header>
          <c-card-body>
            <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
              <div class="mb-3">
                <label cLabel for="firstName" class="form-label-custom">First Name</label>
                <input cFormControl id="firstName" formControlName="firstName" />
              </div>
              <div class="mb-3">
                <label cLabel for="lastName" class="form-label-custom">Last Name</label>
                <input cFormControl id="lastName" formControlName="lastName" />
              </div>
              <div class="mb-3">
                <label cLabel for="email" class="form-label-custom">Email</label>
                <input cFormControl id="email" formControlName="email" type="email" readonly class="readonly-field" />
              </div>
              <button cButton color="primary" type="submit" [disabled]="profileForm.invalid || profileForm.pristine || savingProfile">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-1"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
                {{ savingProfile ? 'Saving...' : 'Save Changes' }}
              </button>
            </form>
          </c-card-body>
        </c-card>
      </c-col>

      <c-col lg="6" class="mb-4">
        <c-card class="h-100 password-card">
          <c-card-header class="d-flex align-items-center gap-2">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#F57F17"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
            <strong>Change Password</strong>
          </c-card-header>
          <c-card-body>
            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
              <div class="mb-3">
                <label cLabel for="currentPassword" class="form-label-custom">Current Password</label>
                <input cFormControl id="currentPassword" formControlName="currentPassword" type="password" />
              </div>
              <div class="mb-3">
                <label cLabel for="newPassword" class="form-label-custom">New Password</label>
                <input cFormControl id="newPassword" formControlName="newPassword" type="password" />
              </div>
              <div class="mb-3">
                <label cLabel for="confirmPassword" class="form-label-custom">Confirm New Password</label>
                <input cFormControl id="confirmPassword" formControlName="confirmPassword" type="password" />
              </div>
              @if (passwordForm.hasError('mismatch')) {
                <p class="text-danger small mb-3">Passwords do not match</p>
              }
              <button cButton color="warning" type="submit" [disabled]="passwordForm.invalid || savingPassword">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-1"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                {{ savingPassword ? 'Changing...' : 'Change Password' }}
              </button>
            </form>
          </c-card-body>
        </c-card>
      </c-col>
    </c-row>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #1A2236; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8892A4; margin: 4px 0 0; }

    .profile-card { border-left: 4px solid #1565C0 !important; }
    .password-card { border-left: 4px solid #F57F17 !important; }
    .form-label-custom { font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; color: #8892A4; }
    .readonly-field { background: #F8FAFC !important; cursor: not-allowed; }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  savingProfile = false;
  savingPassword = false;

  constructor(private authService: AuthService, private fb: FormBuilder, private notify: NotificationService) {
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

  ngOnInit(): void {
    this.authService.getProfile().subscribe(user => {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
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
