import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';
import { ClassGroup } from '../../../core/models';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { ConfirmModalComponent } from '../../../shared/ui/confirm-modal.component';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule, SkeletonComponent, EmptyStateComponent, ConfirmModalComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">{{ t('classes') }}</h2>
        <p class="page-subtitle">{{ t('manage_classes') }}</p>
      </div>
      <button cButton color="primary" (click)="openModal()">+ {{ t('add_class') }}</button>
    </div>

    @if (loading) {
      <ui-skeleton type="table" [count]="5" />
    } @else {
      <c-card>
        <c-card-body class="pb-0">
          <div class="toolbar">
            <div class="search-box">
              <input type="text" [placeholder]="t('search_classes')" [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" />
            </div>
            <c-badge color="primary" class="count-badge">{{ filtered.length }} class{{ filtered.length !== 1 ? 'es' : '' }}</c-badge>
          </div>
        </c-card-body>

        @if (filtered.length === 0) {
          <c-card-body>
            <ui-empty-state
              [title]="searchTerm ? 'Aucune classe trouvée' : 'Aucune classe pour le moment'"
              [message]="searchTerm ? 'Try adjusting your search.' : 'Add your first class to get started.'"
              [actionLabel]="searchTerm ? '' : 'Add Class'"
              (action)="openModal()" />
          </c-card-body>
        } @else {
          <c-card-body class="p-0">
            <table cTable hover>
              <thead>
                <tr>
                  <th>{{ t('name') }}</th>
                  <th>{{ t('level') }}</th>
                  <th>{{ t('students') }}</th>
                  <th class="text-end">{{ t('actions') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (c of paged; track c.id) {
                  <tr>
                    <td>
                      <span class="fw-semibold">{{ c.name }}</span>
                    </td>
                    <td><c-badge color="info" variant="outline">{{ c.level ? t('level_n') + ' ' + c.level : '-' }}</c-badge></td>
                    <td>{{ c.studentCount }}</td>
                    <td class="text-end">
                      <button cButton color="info" variant="ghost" size="sm" (click)="edit(c)">{{ t('edit') }}</button>
                      <button cButton color="danger" variant="ghost" size="sm" (click)="confirmDelete(c)">{{ t('delete') }}</button>
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
            <h5 class="modal-title">{{ editing ? t('edit') + ' ' + t('classes') : t('add_class') }}</h5>
            <button class="modal-close" (click)="closeModal()">&times;</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">{{ t('name') }} *</label>
                <input class="form-control" formControlName="name" placeholder="e.g. 3A" />
              </div>
              <div class="mb-3">
                <label class="form-label">{{ t('level') }} *</label>
                <select class="form-control" formControlName="level">
                  <option value="">{{ t('select_level') }}</option>
                  <option value="1">{{ t('level_n') }} 1</option>
                  <option value="2">{{ t('level_n') }} 2</option>
                  <option value="3">{{ t('level_n') }} 3</option>
                  <option value="4">{{ t('level_n') }} 4</option>
                  <option value="5">{{ t('level_n') }} 5</option>
                  <option value="6">{{ t('level_n') }} 6</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">{{ t('number_of_students') }}</label>
                <input class="form-control" formControlName="studentCount" type="number" />
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
      [title]="t('delete_class')"
      [message]="t('delete') + ' ' + (deleteTarget?.name || '') + '? ' + t('this_cannot_be_undone')"
      confirmText="Supprimer"
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
    .class-icon {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(37, 99, 235,0.1); color: #2563EB;
    }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(13, 20, 40,0.4); backdrop-filter: blur(4px); z-index: 1050; }
    .modal-container { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1051; padding: 20px; }
    .modal-panel { background: #F8FAFF; border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(13, 27, 62,0.15); animation: scaleIn 200ms ease-out; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #DDE3EE; }
    .modal-title { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 700; margin: 0; color: #1A2332; }
    .modal-close {
      width: 42px; height: 42px;
      display: inline-flex; align-items: center; justify-content: center;
      background: none; border: none; font-size: 2.25rem; color: #8D99A8; cursor: pointer;
      line-height: 1; padding: 0; border-radius: 10px;
      &:hover { background: #EAEEF6; color: #1A2332; }
    }
    .modal-body { padding: 24px; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid #DDE3EE; display: flex; justify-content: flex-end; gap: 8px; }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .pagination { display: flex; gap: 4px; }
    .page-btn {
      width: 36px; height: 36px; border-radius: 8px; border: 1px solid #DDE3EE;
      background: #F8FAFF; font-size: 0.85rem; font-weight: 600; cursor: pointer; font-family: 'Montserrat', sans-serif;
      &.active { background: #2563EB; color: #F8FAFF; border-color: #2563EB; }
      &:hover:not(.active) { background: #EAEEF6; }
    }
  `]
})
export class ClassesComponent implements OnInit {
  items: ClassGroup[] = [];
  filtered: ClassGroup[] = [];
  paged: ClassGroup[] = [];
  form: FormGroup;
  editing = false;
  editId: number | null = null;
  loading = true;
  showModal = false;
  showDelete = false;
  deleteTarget: ClassGroup | null = null;
  searchTerm = '';
  page = 1;
  pageSize = 10;
  private schoolId = 1;

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
    this.form = this.fb.group({ name: ['', Validators.required], level: [''], studentCount: [30] });
  }

  t(key: string): string { return this.ts.t(key); }

  ngOnInit() { this.load(); }

  load() {
    this.svc.getClasses(this.schoolId).subscribe({
      next: d => { this.items = d; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.items.filter(c =>
      !term || `${c.name} ${c.level}`.toLowerCase().includes(term)
    );
    const start = (this.page - 1) * this.pageSize;
    this.paged = this.filtered.slice(start, start + this.pageSize);
  }

  openModal(): void {
    this.editing = false;
    this.editId = null;
    this.form.reset({ studentCount: 30 });
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  edit(c: ClassGroup) {
    this.editing = true;
    this.editId = c.id;
    this.form.patchValue(c);
    this.showModal = true;
  }

  onSubmit() {
    if (this.form.invalid) return;
    const data = { ...this.form.value, schoolId: this.schoolId };
    if (this.editing && this.editId) {
      this.svc.updateClass(this.editId, data).subscribe({
        next: () => { this.load(); this.closeModal(); this.notify.success('Classe mise à jour'); },
        error: () => this.notify.error('Échec de la mise à jour de la classe')
      });
    } else {
      this.svc.createClass(data).subscribe({
        next: () => { this.load(); this.closeModal(); this.notify.success('Classe créée'); },
        error: () => this.notify.error('Échec de la création de la classe')
      });
    }
  }

  confirmDelete(c: ClassGroup): void { this.deleteTarget = c; this.showDelete = true; }

  doDelete(): void {
    if (!this.deleteTarget) return;
    this.svc.deleteClass(this.deleteTarget.id).subscribe({
      next: () => { this.load(); this.showDelete = false; this.notify.success('Classe supprimée'); },
      error: () => this.notify.error('Échec de la suppression de la classe')
    });
  }
}
