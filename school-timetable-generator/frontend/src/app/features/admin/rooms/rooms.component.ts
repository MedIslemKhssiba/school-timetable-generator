import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Room } from '../../../core/models';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { ConfirmModalComponent } from '../../../shared/ui/confirm-modal.component';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule, SkeletonComponent, EmptyStateComponent, ConfirmModalComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">Rooms</h2>
        <p class="page-subtitle">Manage classrooms and their capacities</p>
      </div>
      <button cButton color="primary" (click)="openModal()">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-1"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Add Room
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
              <input type="text" placeholder="Search rooms..." [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" />
            </div>
            <c-badge color="primary" class="count-badge">{{ filtered.length }} room{{ filtered.length !== 1 ? 's' : '' }}</c-badge>
          </div>
        </c-card-body>

        @if (filtered.length === 0) {
          <c-card-body>
            <ui-empty-state
              [title]="searchTerm ? 'No rooms found' : 'No rooms yet'"
              [message]="searchTerm ? 'Try adjusting your search.' : 'Add your first room to get started.'"
              [actionLabel]="searchTerm ? '' : 'Add Room'"
              (action)="openModal()" />
          </c-card-body>
        } @else {
          <c-card-body class="p-0">
            <table cTable hover>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Capacity</th>
                  <th>Type</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (r of paged; track r.id) {
                  <tr>
                    <td>
                      <div class="d-flex align-items-center gap-3">
                        <div class="room-icon">
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 19V4h-4V3H5v16H3v2h12V6h2v15h4v-2h-2zm-6 0H7V5h6v14z"/></svg>
                        </div>
                        <span class="fw-semibold">{{ r.name }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="#8892A4"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                        <span>{{ r.capacity }} seats</span>
                      </div>
                    </td>
                    <td><c-badge color="info" variant="outline">{{ r.type || 'General' }}</c-badge></td>
                    <td class="text-end">
                      <button cButton color="info" variant="ghost" size="sm" (click)="edit(r)" title="Edit">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                      </button>
                      <button cButton color="danger" variant="ghost" size="sm" (click)="confirmDelete(r)" title="Delete">
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
            <h5 class="modal-title">{{ editing ? 'Edit Room' : 'Add Room' }}</h5>
            <button class="modal-close" (click)="closeModal()">&times;</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Name *</label>
                <input class="form-control" formControlName="name" placeholder="e.g. Room 101" />
              </div>
              <div class="mb-3">
                <label class="form-label">Capacity</label>
                <input class="form-control" formControlName="capacity" type="number" />
              </div>
              <div class="mb-3">
                <label class="form-label">Type</label>
                <select class="form-select" formControlName="type">
                  <option value="">General</option>
                  <option value="Lecture Hall">Lecture Hall</option>
                  <option value="Lab">Lab</option>
                  <option value="Computer Lab">Computer Lab</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Gymnasium">Gymnasium</option>
                  <option value="Library">Library</option>
                </select>
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
      title="Delete Room"
      [message]="'Delete room ' + (deleteTarget?.name || '') + '? This cannot be undone.'"
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
    .room-icon {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: #E8F5E9; color: #2E7D32;
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

    .pagination { display: flex; gap: 4px; }
    .page-btn {
      width: 36px; height: 36px; border-radius: 8px; border: 1px solid #E2E8F0;
      background: white; font-size: 0.85rem; font-weight: 600; cursor: pointer;
      &.active { background: #1565C0; color: white; border-color: #1565C0; }
      &:hover:not(.active) { background: #F4F6F9; }
    }
  `]
})
export class RoomsComponent implements OnInit {
  items: Room[] = [];
  filtered: Room[] = [];
  paged: Room[] = [];
  form: FormGroup;
  editing = false;
  editId: number | null = null;
  loading = true;
  showModal = false;
  showDelete = false;
  deleteTarget: Room | null = null;
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
    private notify: NotificationService
  ) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.form = this.fb.group({ name: ['', Validators.required], capacity: [30], type: [''] });
  }

  ngOnInit() { this.load(); }

  load() {
    this.svc.getRooms(this.schoolId).subscribe({
      next: d => { this.items = d; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.items.filter(r =>
      !term || `${r.name} ${r.type}`.toLowerCase().includes(term)
    );
    const start = (this.page - 1) * this.pageSize;
    this.paged = this.filtered.slice(start, start + this.pageSize);
  }

  openModal(): void {
    this.editing = false;
    this.editId = null;
    this.form.reset({ capacity: 30 });
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  edit(r: Room) {
    this.editing = true;
    this.editId = r.id;
    this.form.patchValue(r);
    this.showModal = true;
  }

  onSubmit() {
    if (this.form.invalid) return;
    const data = { ...this.form.value, schoolId: this.schoolId };
    if (this.editing && this.editId) {
      this.svc.updateRoom(this.editId, data).subscribe({
        next: () => { this.load(); this.closeModal(); this.notify.success('Room updated'); },
        error: () => this.notify.error('Failed to update room')
      });
    } else {
      this.svc.createRoom(data).subscribe({
        next: () => { this.load(); this.closeModal(); this.notify.success('Room created'); },
        error: () => this.notify.error('Failed to create room')
      });
    }
  }

  confirmDelete(r: Room): void { this.deleteTarget = r; this.showDelete = true; }

  doDelete(): void {
    if (!this.deleteTarget) return;
    this.svc.deleteRoom(this.deleteTarget.id).subscribe({
      next: () => { this.load(); this.showDelete = false; this.notify.success('Room deleted'); },
      error: () => this.notify.error('Failed to delete room')
    });
  }
}
