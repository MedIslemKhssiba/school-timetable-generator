import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';
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
        <h2 class="page-title">{{ t('subjects') }}</h2>
        <p class="page-subtitle">{{ t('manage_subjects') }}</p>
      </div>
      <button cButton color="primary" (click)="openModal()">+ {{ t('add_subject') }}</button>
    </div>

    @if (loading) {
      <ui-skeleton type="table" [count]="5" />
    } @else {
      <c-card>
        <c-card-body class="pb-0">
          <div class="toolbar">
            <div class="search-box">
              <input type="text" [placeholder]="t('search_subjects')" [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" />
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
                  <th>{{ t('subjects') }}</th>
                  <th>{{ t('level') }}</th>
                  <th>{{ t('hours_week') }}</th>
                  <th>{{ t('session_duration') }}</th>
                  <th class="text-end">{{ t('actions') }}</th>
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
                    <td><c-badge color="secondary" variant="outline">{{ s.level }}</c-badge></td>
                    <td><c-badge color="light" textColor="dark">{{ s.hoursPerWeek }}h / week</c-badge></td>
                    <td><c-badge color="info" variant="outline">{{ s.sessionDuration }} min</c-badge></td>
                    <td class="text-end">
                      <button cButton color="info" variant="ghost" size="sm" (click)="edit(s)">{{ t('edit') }}</button>
                      <button cButton color="danger" variant="ghost" size="sm" (click)="confirmDelete(s)">{{ t('delete') }}</button>
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
            <h5 class="modal-title">{{ editing ? t('edit') + ' ' + t('subjects') : t('add_subject') }}</h5>
            <button class="modal-close" (click)="closeModal()">&times;</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">{{ t('name') }} *</label>
                <input class="form-control" formControlName="name" />
              </div>
              <div class="row g-3">
                <div class="col-6">
                  <label class="form-label">{{ t('level') }}</label>
                  <select class="form-control" formControlName="level">
                    <option value="">{{ t('select_level') }}</option>
                    @for (level of availableLevels; track level) {
                      <option [value]="level">{{ level }}</option>
                    }
                  </select>
                  @if (availableLevels.length === 0) {
                    <div class="text-warning small mt-1">
                      No class levels found. Create classes first to define subject levels.
                    </div>
                  }
                  @if (form.get('level')?.value && !isKnownClassLevel(form.get('level')?.value)) {
                    <div class="text-danger small mt-1">
                      This subject level does not match existing class levels.
                    </div>
                  }
                </div>
                <div class="col-6">
                  <label class="form-label">{{ t('hours_week') }}</label>
                  <input class="form-control" formControlName="hoursPerWeek" type="number" min="1" />
                </div>
                <div class="col-6">
                  <label class="form-label">{{ t('session_duration') }}</label>
                  <input class="form-control" formControlName="sessionDuration" type="number" min="30" step="5" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" (click)="closeModal()">{{ t('cancel') }}</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid">{{ editing ? t('update') : t('create') }}</button>
            </div>
          </form>
        </div>
      </div>
    }

    <ui-confirm-modal
      [visible]="showDelete"
      [title]="t('delete_subject')"
      [message]="t('delete') + ' ' + (deleteTarget?.name || '') + '? ' + t('this_cannot_be_undone')"
      confirmText="Delete"
      type="danger"
      (confirmed)="doDelete()"
      (cancelled)="showDelete = false" />
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8D99A8; margin: 4px 0 0; font-family: 'Montserrat', sans-serif; }
    .toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding-bottom: 16px; }
    .search-box {
      display: flex; align-items: center; gap: 8px;
      background: #EAEEF6; border-radius: 10px; padding: 8px 14px; flex: 1; min-width: 200px;
      input { border: none; background: none; outline: none; width: 100%; font-size: 0.875rem; font-family: 'Montserrat', sans-serif; }
    }
    .count-badge { font-size: 0.8rem; padding: 6px 12px; }
    .color-dot {
      width: 28px; height: 28px; border-radius: 8px;
      box-shadow: 0 2px 6px rgba(13, 27, 62,0.12); flex-shrink: 0;
    }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(13, 20, 40,0.4); backdrop-filter: blur(4px); z-index: 1050; }
    .modal-container { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1051; padding: 20px; }
    .modal-panel { background: #F8FAFF; border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(13, 27, 62,0.15); animation: scaleIn 200ms ease-out; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #DDE3EE; }
    .modal-title { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 700; margin: 0; color: #1A2332; }
    .modal-close { background: none; border: none; font-size: 1.5rem; color: #8D99A8; cursor: pointer; line-height: 1; }
    .modal-body { padding: 24px; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid #DDE3EE; display: flex; justify-content: flex-end; gap: 8px; }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .color-picker-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .color-swatch {
      width: 32px; height: 32px; border-radius: 8px; border: 2px solid transparent;
      cursor: pointer; transition: all 150ms;
      &.selected { border-color: #1A2332; transform: scale(1.15); box-shadow: 0 2px 8px rgba(13, 27, 62,0.2); }
    }
    .color-input { width: 32px; height: 32px; border: none; padding: 0; cursor: pointer; border-radius: 8px; }

    .pagination { display: flex; gap: 4px; }
    .page-btn {
      width: 36px; height: 36px; border-radius: 8px; border: 1px solid #DDE3EE;
      background: #F8FAFF; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif;
      &.active { background: #2563EB; color: #F8FAFF; border-color: #2563EB; }
      &:hover:not(.active) { background: #EAEEF6; }
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
  availableLevels: string[] = [];

  colorPresets = ['#2563EB', '#0EA5E9', '#22C55E', '#F59E0B', '#EF4444', '#7C3AED', '#EC4899', '#06B6D4', '#6366F1', '#F97316'];

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  constructor(
    private svc: AdminService,
    private fb: FormBuilder,
    private authService: AuthService,
    private notify: NotificationService,
    private ts: TranslationService
  ) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.form = this.fb.group({
      name: ['', Validators.required],
      level: ['', Validators.required],
      color: [''],
      hoursPerWeek: [2, [Validators.required, Validators.min(1)]],
      sessionDuration: [60, [Validators.required, Validators.min(30)]]
    });
  }

  t(key: string): string { return this.ts.t(key); }

  ngOnInit() {
    this.load();
    this.loadAvailableLevels();
  }

  load() {
    this.svc.getSubjects(this.schoolId).subscribe({
      next: d => { this.items = d; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  loadAvailableLevels(): void {
    this.svc.getClasses(this.schoolId).subscribe({
      next: classes => {
        const levels = Array.from(new Set(classes
          .map(c => (c.level || '').trim())
          .filter(level => !!level)));
        this.availableLevels = levels;
      }
    });
  }

  isKnownClassLevel(level: string): boolean {
    return this.availableLevels.includes((level || '').trim());
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
    this.form.reset({ level: '', color: '', hoursPerWeek: 2, sessionDuration: 60 });
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
    if (!data.color) {
      data.color = this.getAutoColor();
    }
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

  private getAutoColor(): string {
    const usedColors = this.items.map(s => s.color);
    const available = this.colorPresets.filter(c => !usedColors.includes(c));
    if (available.length > 0) return available[0];
    return this.colorPresets[this.items.length % this.colorPresets.length];
  }

  doDelete(): void {
    if (!this.deleteTarget) return;
    this.svc.deleteSubject(this.deleteTarget.id).subscribe({
      next: () => { this.load(); this.showDelete = false; this.notify.success('Subject deleted'); },
      error: () => this.notify.error('Failed to delete subject')
    });
  }
}
