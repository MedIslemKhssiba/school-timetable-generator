import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Subject } from '../../../core/models';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { ConfirmModalComponent } from '../../../shared/ui/confirm-modal.component';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule, SkeletonComponent, EmptyStateComponent, ConfirmModalComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">Subjects</h2>
        <p class="page-subtitle">Manage curriculum subjects and scheduling parameters</p>
      </div>
      <button cButton color="primary" (click)="openModal()">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-1"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Add Subject
      </button>
    </div>

    @if (loading) {
      <ui-skeleton type="table" [count]="5" />
    } @else {
      <c-card>
        <c-card-body class="pb-0">
          <div class="toolbar">
            <div class="search-box">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#8892A4"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              <input type="text" placeholder="Search subjects..." [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" />
            </div>
            <c-badge color="primary" class="count-badge">{{ filtered.length }} subject{{ filtered.length !== 1 ? 's' : '' }}</c-badge>
          </div>
        </c-card-body>

        @if (filtered.length === 0) {
          <c-card-body>
            <ui-empty-state
              [title]="searchTerm ? 'No subjects found' : 'No subjects yet'"
              [message]="searchTerm ? 'Try adjusting your search.' : 'Add your first subject to get started.'"
              [actionLabel]="searchTerm ? '' : 'Add Subject'"
              (action)="openModal()" />
          </c-card-body>
        } @else {
          <c-card-body class="p-0">
            <table cTable hover>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Hours/Week</th>
                  <th>Session Duration</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (s of paged; track s.id) {
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-3">
                        <span class="color-dot" [style.background]="s.color || '#3f51b5'"></span>
                        <span class="fw-semibold">{{ s.name }}</span>
                      </div>
                    </td>
                    <td><c-badge color="light" textColor="dark">{{ s.hoursPerWeek }}h / week</c-badge></td>
                    <td><c-badge color="info" variant="outline">{{ s.sessionDuration }}h / session</c-badge></td>
                    <td class="text-end">
                      <button cButton color="info" variant="ghost" size="sm" (click)="edit(s)" title="Edit">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                      </button>
                      <button cButton color="danger" variant="ghost" size="sm" (click)="confirmDelete(s)" title="Delete">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </c-card-body>
          @if (totalPages > 1) {
            <c-card-body class="d-flex justify-content-center pt-0">
              <div class="pagination">
                @for (p of pageNumbers; track p) {
                  <button class="page-btn" [class.active]="p === page" (click)="page = p; applyFilter()">{{ p }}</button>
                }
              </div>
            </c-card-body>
          }
        }
      </c-card>
    }

    <!-- Modal -->
    @if (showModal) {
      <div class="modal-backdrop" (click)="closeModal()"></div>
      <div class="modal-container">
        <div class="modal-panel">
          <div class="modal-header">
            <h5 class="modal-title">{{ editing ? 'Edit Subject' : 'Add Subject' }}</h5>
            <button class="modal-close" (click)="closeModal()">&times;</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Name *</label>
                <input class="form-control" formControlName="name" placeholder="e.g. Mathematics" />
              </div>
              <div class="mb-3">
                <label class="form-label">Color</label>
                <div class="color-picker-row">
                  @for (c of colorPresets; track c) {
                    <button type="button" class="color-swatch" [style.background]="c"
                      [class.selected]="form.value.color === c"
                      (click)="form.patchValue({ color: c })"></button>
                  }
                  <input type="color" class="color-input" formControlName="color" />
                </div>
              </div>
              <div class="row g-3">
                <div class="col-6">
                  <label class="form-label">Hours/Week</label>
                  <input class="form-control" formControlName="hoursPerWeek" type="number" min="1" />
                </div>
                <div class="col-6">
                  <label class="form-label">Session Duration (h)</label>
                  <input class="form-control" formControlName="sessionDuration" type="number" min="1" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid">{{ editing ? 'Update' : 'Create' }}</button>
            </div>
          </form>
        </div>
      </div>
    }

    <ui-confirm-modal
      [visible]="showDelete"
      title="Delete Subject"
      [message]="'Delete subject ' + (deleteTarget?.name || '') + '? This cannot be undone.'"
      confirmText="Delete"
      type="danger"
      (confirmed)="doDelete()"
      (cancelled)="showDelete = false" />
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #1A2236; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8892A4; margin: 4px 0 0; }
    .toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding-bottom: 16px; }
    .search-box {
      display: flex; align-items: center; gap: 8px;
      background: #F4F6F9; border-radius: 10px; padding: 8px 14px; flex: 1; min-width: 200px;
      input { border: none; background: none; outline: none; width: 100%; font-size: 0.875rem; }
    }
    .count-badge { font-size: 0.8rem; padding: 6px 12px; }
    .color-dot {
      width: 28px; height: 28px; border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.12); flex-shrink: 0;
    }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 1050; }
    .modal-container { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1051; padding: 20px; }
    .modal-panel { background: white; border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); animation: scaleIn 200ms ease-out; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #E2E8F0; }
    .modal-title { font-size: 1.1rem; font-weight: 700; margin: 0; }
    .modal-close { background: none; border: none; font-size: 1.5rem; color: #8892A4; cursor: pointer; line-height: 1; }
    .modal-body { padding: 24px; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid #E2E8F0; display: flex; justify-content: flex-end; gap: 8px; }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .color-picker-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .color-swatch {
      width: 32px; height: 32px; border-radius: 8px; border: 2px solid transparent;
      cursor: pointer; transition: all 150ms;
      &.selected { border-color: #1A2236; transform: scale(1.15); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    }
    .color-input { width: 32px; height: 32px; border: none; padding: 0; cursor: pointer; border-radius: 8px; }

    .pagination { display: flex; gap: 4px; }
    .page-btn {
      width: 36px; height: 36px; border-radius: 8px; border: 1px solid #E2E8F0;
      background: white; font-size: 0.85rem; font-weight: 600; cursor: pointer;
      &.active { background: #1565C0; color: white; border-color: #1565C0; }
      &:hover:not(.active) { background: #F4F6F9; }
    }
  `]
})
export class SubjectsComponent implements OnInit {
  items: Subject[] = [];
  filtered: Subject[] = [];
  paged: Subject[] = [];
  form: FormGroup;
  editing = false;
  editId: number | null = null;
  loading = true;
  showModal = false;
  showDelete = false;
  deleteTarget: Subject | null = null;
  searchTerm = '';
  page = 1;
  pageSize = 10;
  private schoolId = 1;

  colorPresets = ['#1565C0', '#0277BD', '#2E7D32', '#F57F17', '#D32F2F', '#7B1FA2', '#C2185B', '#00838F', '#3f51b5', '#FF6F00'];

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  constructor(
    private svc: AdminService,
    private fb: FormBuilder,
    private authService: AuthService,
    private notify: NotificationService
  ) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.form = this.fb.group({ name: ['', Validators.required], color: ['#3f51b5'], hoursPerWeek: [2], sessionDuration: [1] });
  }

  ngOnInit() { this.load(); }

  load() {
    this.svc.getSubjects(this.schoolId).subscribe({
      next: d => { this.items = d; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.items.filter(s => !term || s.name.toLowerCase().includes(term));
    const start = (this.page - 1) * this.pageSize;
    this.paged = this.filtered.slice(start, start + this.pageSize);
  }

  openModal(): void {
    this.editing = false;
    this.editId = null;
    this.form.reset({ color: '#3f51b5', hoursPerWeek: 2, sessionDuration: 1 });
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  edit(s: Subject) {
    this.editing = true;
    this.editId = s.id;
    this.form.patchValue(s);
    this.showModal = true;
  }

  onSubmit() {
    if (this.form.invalid) return;
    const data = { ...this.form.value, schoolId: this.schoolId };
    if (this.editing && this.editId) {
      this.svc.updateSubject(this.editId, data).subscribe({
        next: () => { this.load(); this.closeModal(); this.notify.success('Subject updated'); },
        error: () => this.notify.error('Failed to update subject')
      });
    } else {
      this.svc.createSubject(data).subscribe({
        next: () => { this.load(); this.closeModal(); this.notify.success('Subject created'); },
        error: () => this.notify.error('Failed to create subject')
      });
    }
  }

  confirmDelete(s: Subject): void { this.deleteTarget = s; this.showDelete = true; }

  doDelete(): void {
    if (!this.deleteTarget) return;
    this.svc.deleteSubject(this.deleteTarget.id).subscribe({
      next: () => { this.load(); this.showDelete = false; this.notify.success('Subject deleted'); },
      error: () => this.notify.error('Failed to delete subject')
    });
  }
}
