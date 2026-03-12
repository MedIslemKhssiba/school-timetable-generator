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
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-schools',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule, ConfirmModalComponent, SkeletonComponent, EmptyStateComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">{{ t('schools') }}</h2>
        <p class="page-subtitle">{{ t('manage_all_schools') }}</p>
      </div>
      <button cButton color="primary" (click)="openModal()">+ {{ t('add_school') }}</button>
    </div>

    <c-card>
      <c-card-header class="toolbar">
        <div class="search-box">
          <input type="text" [(ngModel)]="search" (ngModelChange)="applyFilter()" placeholder="Search schools..." class="search-input" />
        </div>
        <div class="toolbar-info">
          <span class="count-badge">{{ filtered.length }} school{{ filtered.length !== 1 ? 's' : '' }}</span>
          <select class="filter-select" [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()">
            <option value="all">{{ t('all_status') }}</option>
            <option value="active">{{ t('active') }}</option>
            <option value="inactive">{{ t('inactive') }}</option>
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
                  <th>{{ t('school') }}</th>
                  <th>{{ t('address') }}</th>
                  <th>{{ t('phone') }}</th>
                  <th>{{ t('status') }}</th>
                  <th class="text-end">{{ t('actions') }}</th>
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
                        {{ s.active ? t('active') : t('inactive') }}
                      </span>
                    </td>
                    <td class="text-end">
                      <div class="action-btns">
                        <button cButton color="primary" variant="ghost" size="sm" (click)="viewStats(s)">Stats</button>
                        <button cButton color="info" variant="ghost" size="sm" (click)="edit(s)">{{ t('edit') }}</button>
                        <button cButton [color]="s.active ? 'warning' : 'success'" variant="ghost" size="sm" (click)="toggleActive(s)">
                          {{ s.active ? t('deactivate') : t('activate') }}
                        </button>
                        <button cButton color="danger" variant="ghost" size="sm" (click)="confirmDelete(s)">{{ t('delete') }}</button>
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

    <!-- Modal -->
    @if (modalVisible) {
      <div class="modal-backdrop" (click)="closeModal()"></div>
      <div class="modal-wrapper">
        <div class="modal-box">
          <div class="modal-header-custom">
            <h3>{{ editing ? 'Edit School' : 'Add New School' }}</h3>
            <button class="modal-close" (click)="closeModal()">&times;</button>
          </div>
          <form [formGroup]="schoolForm" (ngSubmit)="onSubmit()">
            <div class="modal-body-custom">
              <div class="form-field">
                <label cLabel>{{ t('school_name') }} *</label>
                <input cFormControl formControlName="name" placeholder="Enter school name" />
              </div>
              <div class="form-field">
                <label cLabel>{{ t('address') }}</label>
                <input cFormControl formControlName="address" placeholder="Enter address" />
              </div>
              <div class="form-field">
                <label cLabel>{{ t('phone') }}</label>
                <input cFormControl formControlName="phone" placeholder="Enter phone number" />
              </div>
            </div>
            <div class="modal-footer-custom">
              <button cButton color="secondary" type="button" (click)="closeModal()">{{ t('cancel') }}</button>
              <button cButton color="primary" type="submit" [disabled]="schoolForm.invalid || saving">
                @if (saving) { {{ t('saving') }} } @else { {{ editing ? t('update') : t('create') }} }
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

    <!-- Stats Modal -->
    @if (statsModalVisible) {
      <div class="modal-backdrop" (click)="statsModalVisible = false"></div>
      <div class="modal-wrapper">
        <div class="modal-box" style="max-width: 560px">
          <div class="modal-header-custom">
            <h3>{{ t('statistics') }} — {{ statsSchoolName }}</h3>
            <button class="modal-close" (click)="statsModalVisible = false">&times;</button>
          </div>
          <div class="modal-body-custom">
            @if (statsLoading) {
              <div class="text-center py-4">Loading statistics...</div>
            } @else {
              <div class="stats-mini-grid">
                @for (item of statsItems; track item.key) {
                  <div class="stats-mini-card">
                    <div class="smc-icon" [style.background]="item.bg" [style.color]="item.color">
                    </div>
                    <div class="smc-value">{{ schoolStats[item.key] ?? 0 }}</div>
                    <div class="smc-label">{{ item.label }}</div>
                  </div>
                }
              </div>
            }
          </div>
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
    .search-input {
      border: none; outline: none; background: transparent; font-size: 0.875rem; color: #1A2332; width: 100%;
      font-family: 'Montserrat', sans-serif;
      &::placeholder { color: #8D99A8; }
    }
    .toolbar-info { display: flex; align-items: center; gap: 12px; }
    .count-badge {
      font-size: 0.8rem; font-weight: 600; color: #5C6A7A;
      background: #DDE3EE; padding: 4px 12px; border-radius: 20px; font-family: 'Montserrat', sans-serif;
    }
    .filter-select {
      padding: 6px 12px; border-radius: 8px; border: 1.5px solid #DDE3EE;
      font-size: 0.8125rem; color: #1A2332; background: #F8FAFF; cursor: pointer;
      font-family: 'Montserrat', sans-serif;
      &:focus { border-color: #2563EB; outline: none; }
    }

    .table-responsive-wrapper { overflow-x: auto; }
    .cell-primary { font-weight: 600; color: #1A2332; font-family: 'Montserrat', sans-serif; }

    .status-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;
      font-family: 'Montserrat', sans-serif;
    }
    .status-active { background: rgba(107,144,128,0.1); color: #6B9080; }
    .status-inactive { background: rgba(196,69,54,0.08); color: #C44536; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

    .action-btns { display: flex; gap: 2px; justify-content: flex-end; }

    /* Pagination */
    .pagination-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px; border-top: 1px solid #DDE3EE;
    }
    .pagination-info { font-size: 0.8rem; color: #5C6A7A; font-family: 'Montserrat', sans-serif; }
    .pagination-btns { display: flex; gap: 4px; }
    .pg-btn {
      width: 32px; height: 32px; border-radius: 8px; border: 1px solid #DDE3EE;
      background: #F8FAFF; color: #1A2332; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 150ms; font-family: 'Montserrat', sans-serif;
      &:hover:not(:disabled) { background: #EAEEF6; }
      &.active { background: #2563EB; color: #F8FAFF; border-color: #2563EB; }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(13, 20, 40,0.4); z-index: 1050; backdrop-filter: blur(4px); }
    .modal-wrapper {
      position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1051; padding: 24px;
    }
    .modal-box {
      background: #F8FAFF; border-radius: 16px; width: 100%; max-width: 500px;
      box-shadow: 0 25px 50px rgba(13, 27, 62,0.2);
      animation: scaleIn 200ms cubic-bezier(0.34,1.56,0.64,1);
    }
    .modal-header-custom {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid #DDE3EE;
      h3 { margin: 0; font-family: 'Montserrat', sans-serif; font-size: 1.125rem; font-weight: 700; color: #1A2332; }
    }
    .modal-close {
      background: none; border: none; cursor: pointer; color: #8D99A8; padding: 4px; border-radius: 6px;
      &:hover { background: #EAEEF6; color: #1A2332; }
    }
    .modal-body-custom { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .form-field { display: flex; flex-direction: column; }
    .modal-footer-custom {
      padding: 16px 24px; border-top: 1px solid #DDE3EE;
      display: flex; justify-content: flex-end; gap: 10px;
    }

    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

    .stats-mini-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .stats-mini-card {
      background: #F0F4FA; border-radius: 12px; padding: 20px; text-align: center;
      border: 1px solid #DDE3EE;
    }
    .smc-icon {
      width: 44px; height: 44px; border-radius: 12px; margin: 0 auto 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .smc-value { font-family: 'Montserrat', sans-serif; font-size: 1.5rem; font-weight: 700; color: #1A2332; }
    .smc-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #8D99A8; margin-top: 4px; font-family: 'Montserrat', sans-serif; }
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

  // Stats modal
  statsModalVisible = false;
  statsLoading = false;
  statsSchoolName = '';
  schoolStats: Record<string, number> = {};
  statsItems = [
    { key: 'teachers', label: 'Teachers', bg: 'rgba(37, 99, 235,0.1)', color: '#2563EB' },
    { key: 'classes', label: 'Classes', bg: 'rgba(107,144,128,0.1)', color: '#6B9080' },
    { key: 'subjects', label: 'Subjects', bg: 'rgba(212,160,60,0.1)', color: '#D4A03C' },
    { key: 'rooms', label: 'Rooms', bg: 'rgba(74,124,138,0.1)', color: '#4A7C8A' }
  ];

  constructor(
    private superAdminService: SuperAdminService,
    private fb: FormBuilder,
    private notif: NotificationService,
    private ts: TranslationService
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

  t(key: string): string { return this.ts.t(key); }

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

  viewStats(school: School): void {
    this.statsSchoolName = school.name;
    this.statsModalVisible = true;
    this.statsLoading = true;
    this.superAdminService.getSchoolStatistics(school.id).subscribe({
      next: stats => { this.schoolStats = stats; this.statsLoading = false; },
      error: () => { this.schoolStats = {}; this.statsLoading = false; }
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
