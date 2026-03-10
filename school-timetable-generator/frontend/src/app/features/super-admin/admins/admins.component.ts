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

@Component({
  selector: 'app-admins',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule, ConfirmModalComponent, SkeletonComponent, EmptyStateComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">Administrators</h2>
        <p class="page-subtitle">Manage admin accounts across schools</p>
      </div>
      <button cButton color="primary" (click)="openModal()">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Add Admin
      </button>
    </div>

    <c-card>
      <c-card-header class="toolbar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#8892A4"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input type="text" [(ngModel)]="search" (ngModelChange)="applyFilter()" placeholder="Search admins..." class="search-input" />
        </div>
        <span class="count-badge">{{ filtered.length }} admin{{ filtered.length !== 1 ? 's' : '' }}</span>
      </c-card-header>
      <c-card-body class="p-0">
        @if (loading) {
          <ui-skeleton type="table" [count]="5" />
        } @else if (filtered.length === 0) {
          <ui-empty-state
            [title]="search ? 'No results found' : 'No admins yet'"
            [message]="search ? 'Try a different search term.' : 'Create your first admin account.'"
            [actionLabel]="search ? '' : 'Add Admin'"
            (action)="openModal()" />
        } @else {
          <div class="table-responsive-wrapper">
            <table cTable hover>
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Email</th>
                  <th>School</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (a of paginatedItems; track a.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar">{{ a.firstName?.charAt(0) }}{{ a.lastName?.charAt(0) }}</div>
                        <span class="cell-primary">{{ a.firstName }} {{ a.lastName }}</span>
                      </div>
                    </td>
                    <td class="text-body-secondary">{{ a.email }}</td>
                    <td>{{ getSchoolName(a.schoolId) }}</td>
                    <td class="text-end">
                      <button cButton color="danger" variant="ghost" size="sm" (click)="confirmDelete(a)" title="Remove">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg>
                      </button>
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
                <button class="pg-btn" (click)="page = page - 1" [disabled]="page === 1">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                </button>
                @for (p of pageNumbers; track p) {
                  <button class="pg-btn" [class.active]="p === page" (click)="page = p">{{ p }}</button>
                }
                <button class="pg-btn" (click)="page = page + 1" [disabled]="page === totalPages">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
                </button>
              </div>
            </div>
          }
        }
      </c-card-body>
    </c-card>

    <!-- Create Modal -->
    @if (modalVisible) {
      <div class="modal-backdrop" (click)="closeModal()"></div>
      <div class="modal-wrapper">
        <div class="modal-box">
          <div class="modal-header-custom">
            <h3>Add New Admin</h3>
            <button class="modal-close" (click)="closeModal()">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
          <form [formGroup]="adminForm" (ngSubmit)="onSubmit()">
            <div class="modal-body-custom">
              <div class="form-row">
                <div class="form-field">
                  <label cLabel>First Name *</label>
                  <input cFormControl formControlName="firstName" placeholder="First name" />
                </div>
                <div class="form-field">
                  <label cLabel>Last Name *</label>
                  <input cFormControl formControlName="lastName" placeholder="Last name" />
                </div>
              </div>
              <div class="form-field">
                <label cLabel>Email *</label>
                <input cFormControl formControlName="email" type="email" placeholder="admin&#64;example.com" />
              </div>
              <div class="form-field">
                <label cLabel>Password *</label>
                <input cFormControl formControlName="password" type="password" placeholder="Minimum 6 characters" />
              </div>
              <div class="form-field">
                <label cLabel>Assign to School</label>
                <select cFormControl formControlName="schoolId">
                  <option [ngValue]="null">No school assigned</option>
                  @for (school of schools; track school.id) {
                    <option [ngValue]="school.id">{{ school.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="modal-footer-custom">
              <button cButton color="secondary" type="button" (click)="closeModal()">Cancel</button>
              <button cButton color="primary" type="submit" [disabled]="adminForm.invalid || saving">
                @if (saving) { Creating... } @else { Create Admin }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <ui-confirm-modal
      [visible]="deleteModalVisible"
      title="Remove Admin"
      [message]="'Are you sure you want to remove ' + (adminToDelete?.firstName ?? '') + ' ' + (adminToDelete?.lastName ?? '') + '?'"
      confirmText="Remove"
      type="danger"
      (confirmed)="onDeleteConfirmed()"
      (cancelled)="deleteModalVisible = false" />
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #1A2236; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8892A4; margin: 4px 0 0; }

    .toolbar {
      display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
      padding: 16px 20px !important; background: white !important;
    }
    .search-box {
      display: flex; align-items: center; gap: 8px; padding: 8px 14px;
      border: 1.5px solid #CBD5E1; border-radius: 10px; background: #F8FAFC;
      transition: border-color 150ms; min-width: 260px;
      &:focus-within { border-color: #42A5F5; background: white; }
    }
    .search-input { border: none; outline: none; background: transparent; font-size: 0.875rem; color: #1A2236; width: 100%; &::placeholder { color: #8892A4; } }
    .count-badge { font-size: 0.8rem; font-weight: 600; color: #636E80; background: #EDF0F5; padding: 4px 12px; border-radius: 20px; }

    .table-responsive-wrapper { overflow-x: auto; }
    .cell-primary { font-weight: 600; color: #1A2236; }
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, #1565C0, #42A5F5);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
    }

    .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid #EDF0F5; }
    .pagination-info { font-size: 0.8rem; color: #636E80; }
    .pagination-btns { display: flex; gap: 4px; }
    .pg-btn {
      width: 32px; height: 32px; border-radius: 8px; border: 1px solid #E2E8F0;
      background: white; color: #4A5468; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 150ms;
      &:hover:not(:disabled) { background: #F0F4F8; }
      &.active { background: #1565C0; color: white; border-color: #1565C0; }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(16,42,67,0.5); z-index: 1050; backdrop-filter: blur(4px); }
    .modal-wrapper { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1051; padding: 24px; }
    .modal-box { background: white; border-radius: 16px; width: 100%; max-width: 520px; box-shadow: 0 25px 50px rgba(16,42,67,0.25); animation: scaleIn 200ms cubic-bezier(0.34,1.56,0.64,1); }
    .modal-header-custom { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #EDF0F5; h3 { margin: 0; font-size: 1.125rem; font-weight: 700; color: #1A2236; } }
    .modal-close { background: none; border: none; cursor: pointer; color: #8892A4; padding: 4px; border-radius: 6px; &:hover { background: #F0F4F8; color: #1A2236; } }
    .modal-body-custom { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .form-field { display: flex; flex-direction: column; flex: 1; }
    .form-row { display: flex; gap: 16px; }
    .modal-footer-custom { padding: 16px 24px; border-top: 1px solid #EDF0F5; display: flex; justify-content: flex-end; gap: 10px; }

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
  deleteModalVisible = false;
  adminToDelete: User | null = null;
  loading = true;
  saving = false;
  search = '';
  page = 1;
  pageSize = 10;
  Math = Math;

  constructor(
    private superAdminService: SuperAdminService,
    private fb: FormBuilder,
    private notif: NotificationService
  ) {
    this.adminForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      schoolId: [null],
      role: ['ROLE_ADMIN']
    });
  }

  ngOnInit(): void {
    this.loadAdmins();
    this.superAdminService.getSchools().subscribe(s => this.schools = s);
  }

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

  getSchoolName(schoolId?: number): string {
    if (!schoolId) return '—';
    return this.schools.find(s => s.id === schoolId)?.name ?? '—';
  }

  openModal(): void {
    this.adminForm.reset({ role: 'ROLE_ADMIN' });
    this.modalVisible = true;
  }

  closeModal(): void { this.modalVisible = false; }

  onSubmit(): void {
    if (this.adminForm.invalid) return;
    this.saving = true;
    this.superAdminService.createAdmin(this.adminForm.value).subscribe({
      next: () => {
        this.loadAdmins();
        this.closeModal();
        this.saving = false;
        this.notif.success('Admin created successfully');
      },
      error: () => { this.saving = false; this.notif.error('Failed to create admin'); }
    });
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
        this.notif.success('Admin removed successfully');
      },
      error: () => { this.deleteModalVisible = false; this.notif.error('Failed to remove admin'); }
    });
  }
}
