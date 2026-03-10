import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule } from '@coreui/angular';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { School } from '../../../core/models';
import { ConfirmModalComponent } from '../../../shared/ui/confirm-modal.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-schools',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule, ConfirmModalComponent, SkeletonComponent, EmptyStateComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">Schools</h2>
        <p class="page-subtitle">Manage all schools on the platform</p>
      </div>
      <button cButton color="primary" (click)="openModal()">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Add School
      </button>
    </div>

    <c-card>
      <c-card-header class="toolbar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#8892A4"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input type="text" [(ngModel)]="search" (ngModelChange)="applyFilter()" placeholder="Search schools..." class="search-input" />
        </div>
        <div class="toolbar-info">
          <span class="count-badge">{{ filtered.length }} school{{ filtered.length !== 1 ? 's' : '' }}</span>
          <select class="filter-select" [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </c-card-header>
      <c-card-body class="p-0">
        @if (loading) {
          <ui-skeleton type="table" [count]="5" />
        } @else if (filtered.length === 0) {
          <ui-empty-state
            [title]="search || statusFilter !== 'all' ? 'No results found' : 'No schools yet'"
            [message]="search || statusFilter !== 'all' ? 'Try a different search or filter.' : 'Get started by creating your first school.'"
            [actionLabel]="search || statusFilter !== 'all' ? '' : 'Add School'"
            (action)="openModal()" />
        } @else {
          <div class="table-responsive-wrapper">
            <table cTable hover>
              <thead>
                <tr>
                  <th>School</th>
                  <th>Address</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (s of paginatedItems; track s.id) {
                  <tr>
                    <td>
                      <div class="cell-primary">{{ s.name }}</div>
                    </td>
                    <td class="text-body-secondary">{{ s.address || '—' }}</td>
                    <td class="text-body-secondary">{{ s.phone || '—' }}</td>
                    <td>
                      <span class="status-badge" [class]="s.active ? 'status-active' : 'status-inactive'">
                        <span class="status-dot"></span>
                        {{ s.active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td class="text-end">
                      <div class="action-btns">
                        <button cButton color="info" variant="ghost" size="sm" (click)="edit(s)" title="Edit">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                        <button cButton [color]="s.active ? 'warning' : 'success'" variant="ghost" size="sm" (click)="toggleActive(s)" [title]="s.active ? 'Deactivate' : 'Activate'">
                          @if (s.active) {
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9A7.902 7.902 0 0 1 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1A7.902 7.902 0 0 1 20 12c0 4.42-3.58 8-8 8z"/></svg>
                          } @else {
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                          }
                        </button>
                        <button cButton color="danger" variant="ghost" size="sm" (click)="confirmDelete(s)" title="Delete">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg>
                        </button>
                      </div>
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

    <!-- Modal -->
    @if (modalVisible) {
      <div class="modal-backdrop" (click)="closeModal()"></div>
      <div class="modal-wrapper">
        <div class="modal-box">
          <div class="modal-header-custom">
            <h3>{{ editing ? 'Edit School' : 'Add New School' }}</h3>
            <button class="modal-close" (click)="closeModal()">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
          <form [formGroup]="schoolForm" (ngSubmit)="onSubmit()">
            <div class="modal-body-custom">
              <div class="form-field">
                <label cLabel>School Name *</label>
                <input cFormControl formControlName="name" placeholder="Enter school name" />
              </div>
              <div class="form-field">
                <label cLabel>Address</label>
                <input cFormControl formControlName="address" placeholder="Enter address" />
              </div>
              <div class="form-field">
                <label cLabel>Phone</label>
                <input cFormControl formControlName="phone" placeholder="Enter phone number" />
              </div>
            </div>
            <div class="modal-footer-custom">
              <button cButton color="secondary" type="button" (click)="closeModal()">Cancel</button>
              <button cButton color="primary" type="submit" [disabled]="schoolForm.invalid || saving">
                @if (saving) { Saving... } @else { {{ editing ? 'Update' : 'Create' }} }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <ui-confirm-modal
      [visible]="deleteModalVisible"
      title="Delete School"
      [message]="'Are you sure you want to delete ' + (schoolToDelete?.name ?? '') + '? This action cannot be undone.'"
      confirmText="Delete"
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
    .search-input {
      border: none; outline: none; background: transparent; font-size: 0.875rem; color: #1A2236; width: 100%;
      &::placeholder { color: #8892A4; }
    }
    .toolbar-info { display: flex; align-items: center; gap: 12px; }
    .count-badge {
      font-size: 0.8rem; font-weight: 600; color: #636E80;
      background: #EDF0F5; padding: 4px 12px; border-radius: 20px;
    }
    .filter-select {
      padding: 6px 12px; border-radius: 8px; border: 1.5px solid #CBD5E1;
      font-size: 0.8125rem; color: #4A5468; background: white; cursor: pointer;
      &:focus { border-color: #42A5F5; outline: none; }
    }

    .table-responsive-wrapper { overflow-x: auto; }
    .cell-primary { font-weight: 600; color: #1A2236; }

    .status-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
    }
    .status-active { background: #E8F5E9; color: #2E7D32; }
    .status-inactive { background: #FFEBEE; color: #C62828; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

    .action-btns { display: flex; gap: 2px; justify-content: flex-end; }

    /* Pagination */
    .pagination-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px; border-top: 1px solid #EDF0F5;
    }
    .pagination-info { font-size: 0.8rem; color: #636E80; }
    .pagination-btns { display: flex; gap: 4px; }
    .pg-btn {
      width: 32px; height: 32px; border-radius: 8px; border: 1px solid #E2E8F0;
      background: white; color: #4A5468; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 150ms;
      &:hover:not(:disabled) { background: #F0F4F8; }
      &.active { background: #1565C0; color: white; border-color: #1565C0; }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(16,42,67,0.5); z-index: 1050; backdrop-filter: blur(4px); }
    .modal-wrapper {
      position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1051; padding: 24px;
    }
    .modal-box {
      background: white; border-radius: 16px; width: 100%; max-width: 500px;
      box-shadow: 0 25px 50px rgba(16,42,67,0.25);
      animation: scaleIn 200ms cubic-bezier(0.34,1.56,0.64,1);
    }
    .modal-header-custom {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid #EDF0F5;
      h3 { margin: 0; font-size: 1.125rem; font-weight: 700; color: #1A2236; }
    }
    .modal-close {
      background: none; border: none; cursor: pointer; color: #8892A4; padding: 4px; border-radius: 6px;
      &:hover { background: #F0F4F8; color: #1A2236; }
    }
    .modal-body-custom { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .form-field { display: flex; flex-direction: column; }
    .modal-footer-custom {
      padding: 16px 24px; border-top: 1px solid #EDF0F5;
      display: flex; justify-content: flex-end; gap: 10px;
    }

    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class SchoolsComponent implements OnInit {
  schools: School[] = [];
  filtered: School[] = [];
  schoolForm: FormGroup;
  editing = false;
  editId: number | null = null;
  modalVisible = false;
  deleteModalVisible = false;
  schoolToDelete: School | null = null;
  loading = true;
  saving = false;
  search = '';
  statusFilter = 'all';
  page = 1;
  pageSize = 10;
  Math = Math;

  constructor(
    private superAdminService: SuperAdminService,
    private fb: FormBuilder,
    private notif: NotificationService
  ) {
    this.schoolForm = this.fb.group({
      name: ['', Validators.required],
      address: [''],
      phone: ['']
    });
  }

  ngOnInit(): void {
    this.loadSchools();
  }

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get paginatedItems(): School[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  loadSchools(): void {
    this.superAdminService.getSchools().subscribe({
      next: s => { this.schools = s; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    let list = this.schools;
    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.address?.toLowerCase().includes(q) || s.phone?.toLowerCase().includes(q));
    }
    if (this.statusFilter === 'active') list = list.filter(s => s.active);
    else if (this.statusFilter === 'inactive') list = list.filter(s => !s.active);
    this.filtered = list;
    this.page = 1;
  }

  openModal(school?: School): void {
    if (school) {
      this.editing = true;
      this.editId = school.id;
      this.schoolForm.patchValue(school);
    } else {
      this.editing = false;
      this.editId = null;
      this.schoolForm.reset();
    }
    this.modalVisible = true;
  }

  closeModal(): void {
    this.modalVisible = false;
    this.editing = false;
    this.editId = null;
    this.schoolForm.reset();
  }

  edit(school: School): void {
    this.openModal(school);
  }

  onSubmit(): void {
    if (this.schoolForm.invalid) return;
    this.saving = true;
    const data = this.schoolForm.value;

    if (this.editing && this.editId) {
      this.superAdminService.updateSchool(this.editId, data).subscribe({
        next: () => {
          this.loadSchools();
          this.closeModal();
          this.saving = false;
          this.notif.success('School updated successfully');
        },
        error: () => { this.saving = false; this.notif.error('Failed to update school'); }
      });
    } else {
      this.superAdminService.createSchool(data).subscribe({
        next: () => {
          this.loadSchools();
          this.closeModal();
          this.saving = false;
          this.notif.success('School created successfully');
        },
        error: () => { this.saving = false; this.notif.error('Failed to create school'); }
      });
    }
  }

  confirmDelete(school: School): void {
    this.schoolToDelete = school;
    this.deleteModalVisible = true;
  }

  onDeleteConfirmed(): void {
    if (!this.schoolToDelete) return;
    this.superAdminService.deleteSchool(this.schoolToDelete.id).subscribe({
      next: () => {
        this.loadSchools();
        this.deleteModalVisible = false;
        this.schoolToDelete = null;
        this.notif.success('School deleted successfully');
      },
      error: () => { this.deleteModalVisible = false; this.notif.error('Failed to delete school'); }
    });
  }

  toggleActive(school: School): void {
    this.superAdminService.toggleSchoolActive(school.id).subscribe({
      next: updated => {
        const idx = this.schools.findIndex(s => s.id === school.id);
        if (idx >= 0) this.schools[idx] = updated;
        this.applyFilter();
        this.notif.success(`School ${updated.active ? 'activated' : 'deactivated'}`);
      },
      error: () => this.notif.error('Failed to toggle school status')
    });
  }
}
