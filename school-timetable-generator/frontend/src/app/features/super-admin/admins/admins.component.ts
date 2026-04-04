import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule } from '@coreui/angular';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { User, School } from '../../../core/models';
import { ConfirmModalComponent } from '../../../shared/ui/confirm-modal.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-admins',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule, ConfirmModalComponent, SkeletonComponent, EmptyStateComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">{{ t('administrators') }}</h2>
        <p class="page-subtitle">{{ t('manage_admin_accounts') }}</p>
      </div>
      <button cButton color="primary" (click)="openModal()">
        + {{ t('add_admin') }}
      </button>
    </div>

    <c-card>
      <c-card-header class="toolbar">
        <div class="search-box">
          <input type="text" [(ngModel)]="search" (ngModelChange)="applyFilter()" placeholder="Search admins..." class="search-input" />
        </div>
        <span class="count-badge">{{ filtered.length }} admin{{ filtered.length !== 1 ? 's' : '' }}</span>
      </c-card-header>
      <c-card-body class="p-0">
        @if (loading) {
          <ui-skeleton type="table" [count]="5" />
        } @else if (filtered.length === 0) {
          <ui-empty-state
            [title]="search ? 'Aucun résultat trouvé' : 'Aucun administrateur pour le moment'"
            [message]="search ? 'Try a different search term.' : 'Create your first admin account.'"
            [actionLabel]="search ? '' : 'Add Admin'"
            (action)="openModal()" />
        } @else {
          <div class="table-responsive-wrapper">
            <table cTable hover>
              <thead>
                <tr>
                  <th>{{ t('admin') }}</th>
                  <th>{{ t('email') }}</th>
                  <th>{{ t('school') }}</th>
                  <th class="text-end">{{ t('actions') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (a of paginatedItems; track a.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar">{{ a.firstName.charAt(0) }}{{ a.lastName.charAt(0) }}</div>
                        <span class="cell-primary">{{ a.firstName }} {{ a.lastName }}</span>
                      </div>
                    </td>
                    <td class="text-body-secondary">{{ a.email }}</td>
                    <td>
                      <c-badge [color]="(a.schoolId || a.school?.id) ? 'primary' : 'light'" [textColor]="(a.schoolId || a.school?.id) ? '' : 'secondary'" class="school-badge">
                        {{ getSchoolName(a) }}
                      </c-badge>
                    </td>
                    <td class="text-end">
                      <button cButton color="primary" variant="ghost" size="sm" (click)="openEditModal(a)">{{ t('edit') }}</button>
                      <button cButton color="warning" variant="ghost" size="sm" (click)="openPasswordModal(a)">{{ t('change_password') }}</button>
                      <button cButton color="danger" variant="ghost" size="sm" (click)="confirmDelete(a)">{{ t('delete') }}</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (totalPages > 1) {
            <div class="pagination-bar">
              <span class="pagination-info">Showing {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, filtered.length) }} of {{ filtered.length }}</span>
              <div class="pagination-btns">
                <button class="pg-btn" (click)="page = page - 1" [disabled]="page === 1">&lt;</button>
                @for (p of pageNumbers; track p) {
                  <button class="pg-btn" [class.active]="p === page" (click)="page = p">{{ p }}</button>
                }
                <button class="pg-btn" (click)="page = page + 1" [disabled]="page === totalPages">&gt;</button>
              </div>
            </div>
          }
        }
      </c-card-body>
    </c-card>

    <!-- Create / Edit Modal -->
    @if (modalVisible) {
      <div class="modal-backdrop" (click)="closeModal()"></div>
      <div class="modal-wrapper">
        <div class="modal-box">
          <div class="modal-header-custom">
            <h3>{{ editingAdmin ? t('edit_admin') : t('add_new_admin') }}</h3>
            <button class="modal-close" (click)="closeModal()">&times;</button>
          </div>
          <form [formGroup]="adminForm" (ngSubmit)="onSubmit()">
            <div class="modal-body-custom">
              <div class="form-row">
                <div class="form-field">
                  <label cLabel>{{ t('first_name') }} *</label>
                  <input cFormControl formControlName="firstName" placeholder="First name" />
                </div>
                <div class="form-field">
                  <label cLabel>{{ t('last_name') }} *</label>
                  <input cFormControl formControlName="lastName" placeholder="Last name" />
                </div>
              </div>
              <div class="form-field">
                <label cLabel>{{ t('email') }} *</label>
                <input cFormControl formControlName="email" type="email" placeholder="admin&#64;example.com" />
              </div>
              @if (!editingAdmin) {
                <div class="form-field">
                  <label cLabel>{{ t('password') }} *</label>
                  <input cFormControl formControlName="password" type="password" placeholder="Minimum 6 caractères" />
                </div>
              }
              <div class="form-field">
                <label cLabel>{{ t('assign_to_school') }} *</label>
                <select cFormControl formControlName="schoolId">
                  @for (school of schools; track school.id) {
                    <option [ngValue]="school.id">{{ school.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="modal-footer-custom">
              <button cButton color="secondary" type="button" (click)="closeModal()">{{ t('cancel') }}</button>
              <button cButton color="primary" type="submit" [disabled]="adminForm.invalid || saving">
                @if (saving) { {{ editingAdmin ? t('saving') : t('creating') }} } @else { {{ editingAdmin ? t('save_changes') : t('create_admin') }} }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <ui-confirm-modal
      [visible]="deleteModalVisible"
      title="Supprimer l'administrateur"
      [message]="'Voulez-vous vraiment supprimer ' + (adminToDelete?.firstName ?? '') + ' ' + (adminToDelete?.lastName ?? '') + ' ?'"
      confirmText="Supprimer"
      type="danger"
      (confirmed)="onDeleteConfirmed()"
      (cancelled)="deleteModalVisible = false" />

    <!-- Change Password Modal -->
    @if (passwordModalVisible) {
      <div class="modal-backdrop" (click)="passwordModalVisible = false"></div>
      <div class="modal-wrapper">
        <div class="modal-box">
          <div class="modal-header-custom">
            <h3>{{ t('change_password') }} — {{ passwordTargetName }}</h3>
            <button class="modal-close" (click)="passwordModalVisible = false">&times;</button>
          </div>
          <form [formGroup]="passwordChangeForm" (ngSubmit)="onPasswordSubmit()">
            <div class="modal-body-custom">
              <div class="form-field">
                <label cLabel>{{ t('new_password') }} *</label>
                <input cFormControl formControlName="newPassword" type="password" placeholder="Minimum 6 caractères" />
              </div>
              <div class="form-field">
                <label cLabel>{{ t('confirm_password') }} *</label>
                <input cFormControl formControlName="confirmPassword" type="password" placeholder="Ressaisir le mot de passe" />
              </div>
              @if (passwordChangeForm.hasError('mismatch')) {
                <p class="text-danger small">{{ t('passwords_no_match') }}</p>
              }
            </div>
            <div class="modal-footer-custom">
              <button cButton color="secondary" type="button" (click)="passwordModalVisible = false">{{ t('cancel') }}</button>
              <button cButton color="warning" type="submit" [disabled]="passwordChangeForm.invalid || savingPassword">
                @if (savingPassword) { {{ t('changing') }} } @else { {{ t('change_password') }} }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8D99A8; margin: 4px 0 0; font-family: 'Montserrat', sans-serif; }

    .toolbar {
      display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
      padding: 16px 20px !important; background: #F8FAFF !important;
    }
    .search-box {
      display: flex; align-items: center; gap: 8px; padding: 8px 14px;
      border: 1.5px solid #DDE3EE; border-radius: 10px; background: #EAEEF6;
      transition: border-color 150ms; min-width: 260px;
      &:focus-within { border-color: #2563EB; background: #F8FAFF; }
    }
    .search-input { border: none; outline: none; background: transparent; font-size: 0.875rem; color: #1A2332; width: 100%; font-family: 'Montserrat', sans-serif; &::placeholder { color: #8D99A8; } }
    .count-badge { font-size: 0.8rem; font-weight: 600; color: #5C6A7A; background: #DDE3EE; padding: 4px 12px; border-radius: 20px; font-family: 'Montserrat', sans-serif; }

    .table-responsive-wrapper { overflow-x: auto; }
    .cell-primary { font-weight: 600; color: #1A2332; font-family: 'Montserrat', sans-serif; }
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 10px;
      background: #2563EB;
      color: #F8FAFF; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; flex-shrink: 0; font-family: 'Montserrat', sans-serif;
    }
    .school-badge { font-size: 0.8rem; padding: 5px 10px; display: inline-flex; align-items: center; }

    .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid #DDE3EE; }
    .pagination-info { font-size: 0.8rem; color: #5C6A7A; font-family: 'Montserrat', sans-serif; }
    .pagination-btns { display: flex; gap: 4px; }
    .pg-btn {
      width: 32px; height: 32px; border-radius: 8px; border: 1px solid #DDE3EE;
      background: #F8FAFF; color: #1A2332; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 150ms;
      font-family: 'Montserrat', sans-serif;
      &:hover:not(:disabled) { background: #EAEEF6; }
      &.active { background: #2563EB; color: #F8FAFF; border-color: #2563EB; }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(13, 20, 40,0.4); z-index: 1050; backdrop-filter: blur(4px); }
    .modal-wrapper { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1051; padding: 24px; }
    .modal-box { background: #F8FAFF; border-radius: 16px; width: 100%; max-width: 520px; box-shadow: 0 25px 50px rgba(13, 27, 62,0.2); animation: scaleIn 200ms cubic-bezier(0.34,1.56,0.64,1); }
    .modal-header-custom { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #DDE3EE; h3 { margin: 0; font-family: 'Montserrat', sans-serif; font-size: 1.125rem; font-weight: 700; color: #1A2332; } }
    .modal-close {
      width: 42px; height: 42px;
      display: inline-flex; align-items: center; justify-content: center;
      background: none; border: none; cursor: pointer; color: #8D99A8;
      padding: 0; border-radius: 10px; font-size: 2.25rem; line-height: 1;
      &:hover { background: #EAEEF6; color: #1A2332; }
    }
    .modal-body-custom { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .form-field { display: flex; flex-direction: column; flex: 1; }
    .form-row { display: flex; gap: 16px; }
    .modal-footer-custom { padding: 16px 24px; border-top: 1px solid #DDE3EE; display: flex; justify-content: flex-end; gap: 10px; }

    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

    @media (max-width: 576px) { .form-row { flex-direction: column; } }
  `]
})
export class AdminsComponent implements OnInit {
  admins: User[] = [];
  filtered: User[] = [];
  schools: School[] = [];
  adminForm: FormGroup;
  modalVisible = false;
  editingAdmin: User | null = null;
  deleteModalVisible = false;
  adminToDelete: User | null = null;
  loading = true;
  saving = false;
  search = '';
  page = 1;
  pageSize = 10;
  Math = Math;

  // Password change
  passwordModalVisible = false;
  savingPassword = false;
  passwordTargetId: number | null = null;
  passwordTargetName = '';
  passwordChangeForm: FormGroup;

  constructor(
    private superAdminService: SuperAdminService,
    private fb: FormBuilder,
    private notif: NotificationService,
    private ts: TranslationService
  ) {
    this.adminForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      schoolId: [null],
      role: ['ROLE_ADMIN']
    });
    this.passwordChangeForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadAdmins();
    this.superAdminService.getSchools().subscribe(s => this.schools = s);
  }

  t(key: string): string { return this.ts.t(key); }

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get paginatedItems(): User[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  loadAdmins(): void {
    this.superAdminService.getAdmins().subscribe({
      next: a => { this.admins = a; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    let list = this.admins;
    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter(a => a.firstName?.toLowerCase().includes(q) || a.lastName?.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
    }
    this.filtered = list;
    this.page = 1;
  }

  getSchoolName(admin: User): string {
    const schoolId = admin.schoolId ?? admin.school?.id;
    if (admin.schoolName) return admin.schoolName;
    if (!schoolId) return '—';
    return this.schools.find(s => s.id === schoolId)?.name ?? '—';
  }

  openModal(): void {
    this.editingAdmin = null;
    this.adminForm.reset({ role: 'ROLE_ADMIN' });
    this.adminForm.get('schoolId')?.setValidators(Validators.required);
    this.adminForm.get('schoolId')?.updateValueAndValidity();
    this.adminForm.get('password')?.setValidators(Validators.required);
    this.adminForm.get('password')?.updateValueAndValidity();
    this.modalVisible = true;
  }

  openEditModal(admin: User): void {
    this.editingAdmin = admin;
    this.adminForm.patchValue({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      schoolId: admin.schoolId ?? admin.school?.id ?? null,
      role: 'ROLE_ADMIN'
    });
    this.adminForm.get('password')?.clearValidators();
    this.adminForm.get('password')?.updateValueAndValidity();
    this.adminForm.get('schoolId')?.setValidators(Validators.required);
    this.adminForm.get('schoolId')?.updateValueAndValidity();
    this.modalVisible = true;
  }

  closeModal(): void {
    this.modalVisible = false;
    this.editingAdmin = null;
  }

  onSubmit(): void {
    if (this.adminForm.invalid) return;
    this.saving = true;

    if (this.editingAdmin) {
      const { firstName, lastName, email, schoolId } = this.adminForm.value;
      this.superAdminService.updateAdmin(this.editingAdmin.id, { firstName, lastName, email, schoolId }).subscribe({
        next: () => {
          this.loadAdmins();
          this.closeModal();
          this.saving = false;
          this.notif.success('Administrateur mis à jour avec succès');
        },
        error: () => { this.saving = false; this.notif.error('Échec de la mise à jour de l administrateur'); }
      });
    } else {
      this.superAdminService.createAdmin(this.adminForm.value).subscribe({
        next: () => {
          this.loadAdmins();
          this.closeModal();
          this.saving = false;
          this.notif.success('Administrateur créé avec succès');
        },
        error: () => { this.saving = false; this.notif.error('Échec de la création de l administrateur'); }
      });
    }
  }

  confirmDelete(admin: User): void {
    this.adminToDelete = admin;
    this.deleteModalVisible = true;
  }

  onDeleteConfirmed(): void {
    if (!this.adminToDelete) return;
    this.superAdminService.deleteAdmin(this.adminToDelete.id).subscribe({
      next: () => {
        this.loadAdmins();
        this.deleteModalVisible = false;
        this.adminToDelete = null;
        this.notif.success('Administrateur supprimé avec succès');
      },
      error: () => { this.deleteModalVisible = false; this.notif.error('Échec de la suppression de l administrateur'); }
    });
  }

  openPasswordModal(admin: User): void {
    this.passwordTargetId = admin.id;
    this.passwordTargetName = `${admin.firstName} ${admin.lastName}`;
    this.passwordChangeForm.reset();
    this.passwordModalVisible = true;
  }

  onPasswordSubmit(): void {
    if (this.passwordChangeForm.invalid || !this.passwordTargetId) return;
    this.savingPassword = true;
    const { newPassword } = this.passwordChangeForm.value;
    this.superAdminService.changeUserPassword(this.passwordTargetId, newPassword).subscribe({
      next: () => {
        this.passwordModalVisible = false;
        this.savingPassword = false;
        this.notif.success('Mot de passe modifié avec succès');
      },
      error: () => { this.savingPassword = false; this.notif.error('Échec du changement de mot de passe'); }
    });
  }

  private passwordMatchValidator(group: FormGroup): { mismatch: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }
}
