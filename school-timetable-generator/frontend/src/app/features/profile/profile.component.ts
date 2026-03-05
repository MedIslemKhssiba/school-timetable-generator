import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule, GridModule, ButtonDirective, FormModule, AlertComponent } from '@coreui/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, GridModule, ButtonDirective, FormModule, AlertComponent],
  template: `
    <div class="page-header">
      <h2>My Profile</h2>
    </div>

    @if (msg) {
      <c-alert color="success" [dismissible]="true" (visibleChange)="msg=''">{{ msg }}</c-alert>
    }
    @if (errMsg) {
      <c-alert color="danger" [dismissible]="true" (visibleChange)="errMsg=''">{{ errMsg }}</c-alert>
    }

    <c-row>
      <c-col lg="6" class="mb-4">
        <c-card class="h-100">
          <c-card-header><strong>Profile Information</strong></c-card-header>
          <c-card-body>
            <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
              <div class="mb-3">
                <label cLabel for="firstName">First Name</label>
                <input cFormControl id="firstName" formControlName="firstName" />
              </div>
              <div class="mb-3">
                <label cLabel for="lastName">Last Name</label>
                <input cFormControl id="lastName" formControlName="lastName" />
              </div>
              <div class="mb-3">
                <label cLabel for="email">Email</label>
                <input cFormControl id="email" formControlName="email" type="email" readonly />
              </div>
              <button cButton color="primary" type="submit" [disabled]="profileForm.invalid || profileForm.pristine">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="me-1"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
                Save Changes
              </button>
            </form>
          </c-card-body>
        </c-card>
      </c-col>

      <c-col lg="6" class="mb-4">
        <c-card class="h-100">
          <c-card-header class="bg-warning bg-opacity-10"><strong>Change Password</strong></c-card-header>
          <c-card-body>
            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
              <div class="mb-3">
                <label cLabel for="currentPassword">Current Password</label>
                <input cFormControl id="currentPassword" formControlName="currentPassword" type="password" />
              </div>
              <div class="mb-3">
                <label cLabel for="newPassword">New Password</label>
                <input cFormControl id="newPassword" formControlName="newPassword" type="password" />
              </div>
              <div class="mb-3">
                <label cLabel for="confirmPassword">Confirm New Password</label>
                <input cFormControl id="confirmPassword" formControlName="confirmPassword" type="password" />
              </div>
              @if (passwordForm.hasError('mismatch')) {
                <p class="text-danger small mb-3">Passwords do not match</p>
              }
              <button cButton color="warning" type="submit" [disabled]="passwordForm.invalid">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="me-1"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                Change Password
              </button>
            </form>
          </c-card-body>
        </c-card>
      </c-col>
    </c-row>
  `
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  msg = ''; errMsg = '';

  constructor(private authService: AuthService, private fb: FormBuilder) {
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
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.msg = 'Profile updated successfully';
        this.profileForm.markAsPristine();
      },
      error: () => this.errMsg = 'Failed to update profile'
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.msg = 'Password changed successfully';
        this.passwordForm.reset();
      },
      error: () => this.errMsg = 'Failed to change password'
    });
  }

  private passwordMatchValidator(group: FormGroup): { mismatch: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }
}
