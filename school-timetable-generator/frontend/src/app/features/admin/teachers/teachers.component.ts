import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';
import { Teacher, Subject } from '../../../core/models';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { ConfirmModalComponent } from '../../../shared/ui/confirm-modal.component';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule, SkeletonComponent, EmptyStateComponent, ConfirmModalComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">{{ t('teachers') }}</h2>
        <p class="page-subtitle">{{ t('manage_teachers') }}</p>
      </div>
      <button cButton color="primary" (click)="openModal()">+ {{ t('add_teacher') }}</button>
    </div>

    @if (loading) {
      <ui-skeleton type="table" [count]="5" />
    } @else {
      <c-card>
        <c-card-body class="pb-0">
          <div class="toolbar">
            <div class="search-box">
              <input type="text" placeholder="Search teachers..." [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" />
            </div>
            <c-badge color="primary" class="count-badge">{{ filtered.length }} teacher{{ filtered.length !== 1 ? 's' : '' }}</c-badge>
          </div>
        </c-card-body>

        @if (filtered.length === 0) {
          <c-card-body>
            <ui-empty-state
              [title]="searchTerm ? 'No teachers found' : 'No teachers yet'"
              [message]="searchTerm ? 'Try adjusting your search.' : 'Add your first teacher to get started.'"
              [actionLabel]="searchTerm ? '' : 'Add Teacher'"
              (action)="openModal()" />
          </c-card-body>
        } @else {
          <c-card-body class="p-0">
            <table cTable hover>
              <thead>
                <tr>
                  <th>{{ t('teacher') }}</th>
                  <th>{{ t('email') }}</th>
                  <th>{{ t('max_hours') }}</th>
                  <th>{{ t('subjects') }}</th>
                  <th class="text-end">{{ t('actions') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (teacher of paged; track teacher.id) {
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-3">
                        <div class="avatar">{{ teacher.firstName?.charAt(0) }}{{ teacher.lastName?.charAt(0) }}</div>
                        <div><div class="fw-semibold">{{ teacher.firstName }} {{ teacher.lastName }}</div></div>
                      </div>
                    </td>
                    <td class="text-body-secondary">{{ teacher.email }}</td>
                    <td><c-badge color="light" textColor="dark">{{ teacher.maxHoursPerWeek }}h</c-badge></td>
                    <td>
                      <div class="subject-tags">
                        @for (s of teacher.subjects || []; track s.id) {
                          <span class="subject-tag" [style.border-color]="s.color || '#2563EB'" [style.color]="s.color || '#2563EB'">{{ s.name }}</span>
                        }
                        @if (!teacher.subjects?.length) { <span class="text-body-secondary">-</span> }
                      </div>
                    </td>
                    <td class="text-end">
                      <button cButton color="info" variant="ghost" size="sm" (click)="edit(teacher)">{{ t('edit') }}</button>
                      <button cButton color="danger" variant="ghost" size="sm" (click)="confirmDelete(teacher)">{{ t('delete') }}</button>
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
            <h5 class="modal-title">{{ editing ? 'Edit Teacher' : 'Add Teacher' }}</h5>
            <button class="modal-close" (click)="closeModal()">&times;</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                <label class="form-label">{{ t('first_name') }} *</label>
                  <input class="form-control" formControlName="firstName" />
                </div>
                <div class="col-md-6">
                <label class="form-label">{{ t('last_name') }} *</label>
                  <input class="form-control" formControlName="lastName" />
                </div>
                <div class="col-md-6">
                <label class="form-label">{{ t('email') }} *</label>
                  <input class="form-control" formControlName="email" type="email" />
                </div>
                @if (!editing) {
                  <div class="col-md-6">
                    <label class="form-label">{{ t('password') }} *</label>
                    <input class="form-control" formControlName="password" type="password" placeholder="Min 6 characters" />
                  </div>
                }
                <div class="col-md-6">
                  <label class="form-label">{{ t('max_hours') }}</label>
                  <input class="form-control" formControlName="maxHoursPerWeek" type="number" />
                </div>
                <div class="col-12">
                  <label class="form-label">{{ t('subjects') }}</label>
                  <div class="subject-select-grid">
                    @for (s of subjects; track s.id) {
                      <label class="subject-check" [class.checked]="isSubjectSelected(s.id)">
                        <input type="checkbox" [checked]="isSubjectSelected(s.id)" (change)="toggleSubject(s.id)" />
                        <span class="subject-dot" [style.background]="s.color || '#2563EB'"></span>
                        {{ s.name }}
                      </label>
                    }
                  </div>
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
      title="Delete Teacher"
      [message]="'Delete ' + (deleteTarget?.firstName || '') + ' ' + (deleteTarget?.lastName || '') + '? This cannot be undone.'"
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
    .avatar {
      width: 38px; height: 38px; border-radius: 10px; font-weight: 700; font-size: 0.8rem;
      display: flex; align-items: center; justify-content: center;
      background: #2563EB; color: #F8FAFF; font-family: 'Montserrat', sans-serif;
    }
    .subject-tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .subject-tag {
      font-size: 0.7rem; font-weight: 600; padding: 2px 8px; border-radius: 6px;
      border: 1.5px solid; background: #F8FAFF; font-family: 'Montserrat', sans-serif;
    }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(13, 20, 40,0.4); backdrop-filter: blur(4px); z-index: 1050; }
    .modal-container { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1051; padding: 20px; }
    .modal-panel { background: #F8FAFF; border-radius: 16px; width: 100%; max-width: 600px; box-shadow: 0 20px 60px rgba(13, 27, 62,0.15); animation: scaleIn 200ms ease-out; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #DDE3EE; }
    .modal-title { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 700; margin: 0; color: #1A2332; }
    .modal-close { background: none; border: none; font-size: 2rem; color: #8D99A8; cursor: pointer; line-height: 1; padding: 2px 6px; border-radius: 6px; }
    .modal-body { padding: 24px; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid #DDE3EE; display: flex; justify-content: flex-end; gap: 8px; }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .subject-select-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
    .subject-check {
      display: flex; align-items: center; gap: 8px; padding: 8px 12px;
      border: 1.5px solid #DDE3EE; border-radius: 8px; cursor: pointer; transition: all 150ms;
      font-size: 0.85rem; font-weight: 500; font-family: 'Montserrat', sans-serif;
      input { display: none; }
      &.checked { border-color: #2563EB; background: rgba(37, 99, 235,0.08); }
    }
    .subject-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

    .pagination { display: flex; gap: 4px; }
    .page-btn {
      width: 36px; height: 36px; border-radius: 8px; border: 1px solid #DDE3EE;
      background: #F8FAFF; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif;
      &.active { background: #2563EB; color: #F8FAFF; border-color: #2563EB; }
      &:hover:not(.active) { background: #EAEEF6; }
    }
  `]
})
export class TeachersComponent implements OnInit {
  teachers: Teacher[] = [];
  filtered: Teacher[] = [];
  paged: Teacher[] = [];
  subjects: Subject[] = [];
  form: FormGroup;
  editing = false;
  editId: number | null = null;
  loading = true;
  showModal = false;
  showDelete = false;
  deleteTarget: Teacher | null = null;
  searchTerm = '';
  page = 1;
  pageSize = 10;
  private schoolId = 1;

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private authService: AuthService,
    private notify: NotificationService,
    private ts: TranslationService
  ) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      maxHoursPerWeek: [20],
      subjectIds: [[] as number[]],
      schoolId: [this.schoolId]
    });
  }

  ngOnInit(): void {
    this.load();
    this.adminService.getSubjects(this.schoolId).subscribe(s => this.subjects = s);
  }

  t(key: string): string { return this.ts.t(key); }

  load(): void {
    this.adminService.getTeachers(this.schoolId).subscribe({
      next: t => { this.teachers = t; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.teachers.filter(t =>
      !term || `${t.firstName} ${t.lastName} ${t.email}`.toLowerCase().includes(term)
    );
    const start = (this.page - 1) * this.pageSize;
    this.paged = this.filtered.slice(start, start + this.pageSize);
  }

  openModal(): void {
    this.editing = false;
    this.editId = null;
    this.form.reset({ schoolId: this.schoolId, maxHoursPerWeek: 20, subjectIds: [] });
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  edit(t: Teacher): void {
    this.editing = true;
    this.editId = t.id;
    const ids = t.subjectIds?.length ? t.subjectIds : (t.subjects?.map(s => s.id) || []);
    this.form.patchValue({ ...t, subjectIds: ids });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  isSubjectSelected(id: number): boolean {
    return (this.form.value.subjectIds || []).includes(id);
  }

  toggleSubject(id: number): void {
    const ids: number[] = [...(this.form.value.subjectIds || [])];
    const idx = ids.indexOf(id);
    if (idx > -1) ids.splice(idx, 1); else ids.push(id);
    this.form.patchValue({ subjectIds: ids });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    if (this.editing && this.editId) {
      this.adminService.updateTeacher(this.editId, this.form.value).subscribe({
        next: () => { this.load(); this.closeModal(); this.notify.success('Teacher updated'); },
        error: () => this.notify.error('Failed to update teacher')
      });
    } else {
      this.adminService.createTeacher(this.form.value).subscribe({
        next: () => { this.load(); this.closeModal(); this.notify.success('Teacher created'); },
        error: () => this.notify.error('Failed to create teacher')
      });
    }
  }

  confirmDelete(t: Teacher): void { this.deleteTarget = t; this.showDelete = true; }

  doDelete(): void {
    if (!this.deleteTarget) return;
    this.adminService.deleteTeacher(this.deleteTarget.id).subscribe({
      next: () => { this.load(); this.showDelete = false; this.notify.success('Teacher deleted'); },
      error: () => this.notify.error('Failed to delete teacher')
    });
  }
}
