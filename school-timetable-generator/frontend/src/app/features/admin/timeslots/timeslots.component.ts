import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Timeslot } from '../../../core/models';
import { ConfirmModalComponent } from '../../../shared/ui/confirm-modal.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-timeslots',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule, ConfirmModalComponent, SkeletonComponent, EmptyStateComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">{{ t('timeslots') }}</h2>
        <p class="page-subtitle">{{ t('manage_timeslots_desc') }}</p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <button cButton color="info" variant="outline" (click)="copyMondayToWeek()" [disabled]="saving">
          Copier lundi vers tous les jours
        </button>
        <button cButton color="primary" (click)="openModal()">
          + Générer les créneaux du jour
        </button>
      </div>
    </div>

    <c-card>
      <c-card-header class="toolbar">
        <div class="filter-group">
          <select class="day-filter" [(ngModel)]="filterDay" (ngModelChange)="applyFilter()">
            <option value="">{{ t('all_days') }}</option>
            @for (d of days; track d) {
              <option [value]="d">{{ t(d) }}</option>
            }
          </select>
        </div>
        <span class="count-badge">{{ filtered.length }} {{ t('timeslot') }}{{ filtered.length !== 1 ? 's' : '' }}</span>
      </c-card-header>
      <c-card-body class="p-0">
        @if (loading) {
          <ui-skeleton type="table" [count]="5" />
        } @else if (filtered.length === 0) {
          <ui-empty-state
            [title]="filterDay ? t('no_results') : t('no_timeslots_yet')"
            [message]="filterDay ? t('try_different_filter') : t('create_first_timeslot')"
            [actionLabel]="filterDay ? '' : t('add_timeslot')"
            (action)="openModal()" />
        } @else {
          <div class="table-responsive-wrapper">
            <table cTable hover>
              <thead>
                <tr>
                  <th>{{ t('day') }}</th>
                  <th>{{ t('start_time') }}</th>
                  <th>{{ t('end_time') }}</th>
                  <th>{{ t('break') || 'Pause' }}</th>
                  <th>{{ t('order') }}</th>
                  <th class="text-end">{{ t('actions') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (ts of paginatedItems; track ts.id) {
                  <tr>
                    <td>
                      <c-badge [color]="getDayColor(ts.dayOfWeek)" class="day-badge">
                        {{ t(ts.dayOfWeek) }}
                      </c-badge>
                    </td>
                    <td class="cell-primary">{{ ts.startTime }}</td>
                    <td class="cell-primary">{{ ts.endTime }}</td>
                    <td class="text-body-secondary">{{ ts.breakStartTime && ts.breakEndTime ? (ts.breakStartTime + ' - ' + ts.breakEndTime) : '—' }}</td>
                    <td class="text-body-secondary">{{ ts.orderInDay }}</td>
                    <td class="text-end">
                      <button cButton color="primary" variant="ghost" size="sm" (click)="openEditModal(ts)">{{ t('edit') }}</button>
                      <button cButton color="danger" variant="ghost" size="sm" (click)="confirmDelete(ts)">{{ t('delete') }}</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (totalPages > 1) {
            <div class="pagination-bar">
              <span class="pagination-info">{{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, filtered.length) }} / {{ filtered.length }}</span>
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
            <h3>{{ editingTimeslot ? t('edit_timeslot') : t('add_new_timeslot') }}</h3>
            <button class="modal-close" (click)="closeModal()">&times;</button>
          </div>
          <form [formGroup]="timeslotForm" (ngSubmit)="onSubmit()">
            <div class="modal-body-custom">
              <div class="form-field">
                <label cLabel>{{ t('day') }} *</label>
                <select cFormControl formControlName="dayOfWeek">
                  <option value="" disabled>{{ t('select_day') }}</option>
                  @for (d of days; track d) {
                    <option [value]="d">{{ t(d) }}</option>
                  }
                </select>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label cLabel>{{ editingTimeslot ? t('start_time') : 'Heure de début du jour' }} *</label>
                  <input cFormControl formControlName="startTime" type="time" />
                </div>
                <div class="form-field">
                  <label cLabel>{{ editingTimeslot ? t('end_time') : 'Heure de fin du jour' }} *</label>
                  <input cFormControl formControlName="endTime" type="time" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label cLabel>{{ t('break') || 'Pause' }} {{ t('start_time') }}</label>
                  <input cFormControl formControlName="breakStartTime" type="time" />
                </div>
                <div class="form-field">
                  <label cLabel>{{ t('break') || 'Pause' }} {{ t('end_time') }}</label>
                  <input cFormControl formControlName="breakEndTime" type="time" />
                </div>
              </div>
              @if (editingTimeslot) {
                <div class="form-field">
                  <label cLabel>{{ t('order_in_day') }}</label>
                  <input cFormControl formControlName="orderInDay" type="number" min="1" placeholder="1" />
                </div>
              }
            </div>
            <div class="modal-footer-custom">
              <button cButton color="secondary" type="button" (click)="closeModal()">{{ t('cancel') }}</button>
              <button cButton color="primary" type="submit" [disabled]="timeslotForm.invalid || saving">
                @if (saving) {
                  {{ editingTimeslot ? t('saving') : 'Génération...' }}
                } @else {
                  {{ editingTimeslot ? t('save_changes') : 'Générer tous les créneaux' }}
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <ui-confirm-modal
      [visible]="deleteModalVisible"
      [title]="t('remove_timeslot')"
      [message]="'Remove ' + (timeslotToDelete ? t(timeslotToDelete.dayOfWeek) + ' ' + timeslotToDelete.startTime + '-' + timeslotToDelete.endTime : '') + '?'"
      [confirmText]="t('remove')"
      type="danger"
      (confirmed)="onDeleteConfirmed()"
      (cancelled)="deleteModalVisible = false" />
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8D99A8; margin: 4px 0 0; font-family: 'Montserrat', sans-serif; }

    .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 16px 20px !important; background: #F8FAFF !important; }
    .day-filter {
      padding: 8px 14px; border: 1.5px solid #DDE3EE; border-radius: 10px; background: #EAEEF6;
      font-size: 0.875rem; color: #1A2332; font-family: 'Montserrat', sans-serif; outline: none;
      cursor: pointer; min-width: 180px;
      &:focus { border-color: #2563EB; background: #F8FAFF; }
    }
    .count-badge { font-size: 0.8rem; font-weight: 600; color: #5C6A7A; background: #DDE3EE; padding: 4px 12px; border-radius: 20px; font-family: 'Montserrat', sans-serif; }

    .table-responsive-wrapper { overflow-x: auto; }
    .cell-primary { font-weight: 600; color: #1A2332; font-family: 'Montserrat', sans-serif; }
    .day-badge { font-size: 0.8rem; padding: 5px 12px; display: inline-flex; align-items: center; }

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
    .modal-box { background: #F8FAFF; border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 25px 50px rgba(13, 27, 62,0.2); animation: scaleIn 200ms cubic-bezier(0.34,1.56,0.64,1); }
    .modal-header-custom { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid #DDE3EE; h3 { margin: 0; font-family: 'Montserrat', sans-serif; font-size: 1.125rem; font-weight: 700; color: #1A2332; } }
    .modal-close { background: none; border: none; cursor: pointer; color: #8D99A8; padding: 4px; border-radius: 6px; &:hover { background: #EAEEF6; color: #1A2332; } }
    .modal-body-custom { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .form-field { display: flex; flex-direction: column; flex: 1; }
    .form-row { display: flex; gap: 16px; }
    .modal-footer-custom { padding: 16px 24px; border-top: 1px solid #DDE3EE; display: flex; justify-content: flex-end; gap: 10px; }

    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    @media (max-width: 576px) { .form-row { flex-direction: column; } }
  `]
})
export class TimeslotsComponent implements OnInit {
  timeslots: Timeslot[] = [];
  filtered: Timeslot[] = [];
  timeslotForm: FormGroup;
  modalVisible = false;
  editingTimeslot: Timeslot | null = null;
  deleteModalVisible = false;
  timeslotToDelete: Timeslot | null = null;
  loading = true;
  saving = false;
  filterDay = '';
  page = 1;
  pageSize = 15;
  Math = Math;
  private schoolId = 1;

  days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private fb: FormBuilder,
    private notif: NotificationService,
    private ts: TranslationService
  ) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.timeslotForm = this.fb.group({
      dayOfWeek: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      breakStartTime: [''],
      breakEndTime: [''],
      orderInDay: [null]
    });
  }

  ngOnInit(): void {
    this.loadTimeslots();
  }

  t(key: string): string { return this.ts.t(key); }

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get pageNumbers(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get paginatedItems(): Timeslot[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  loadTimeslots(): void {
    this.adminService.getTimeslots().subscribe({
      next: ts => { this.timeslots = ts; this.applyFilter(); this.loading = false; },
      error: () => this.loading = false
    });
  }

  applyFilter(): void {
    let list = this.timeslots;
    if (this.filterDay) {
      list = list.filter(t => t.dayOfWeek === this.filterDay);
    }
    this.filtered = list;
    this.page = 1;
  }

  getDayColor(day: string): string {
    const colors: Record<string, string> = {
      MONDAY: 'primary', TUESDAY: 'info', WEDNESDAY: 'success',
      THURSDAY: 'warning', FRIDAY: 'danger', SATURDAY: 'dark'
    };
    return colors[day] ?? 'secondary';
  }

  openModal(): void {
    this.editingTimeslot = null;
    this.timeslotForm.reset({ orderInDay: null });
    this.modalVisible = true;
  }

  openEditModal(timeslot: Timeslot): void {
    this.editingTimeslot = timeslot;
    this.timeslotForm.patchValue({
      dayOfWeek: timeslot.dayOfWeek,
      startTime: this.toInputTime(timeslot.startTime),
      endTime: this.toInputTime(timeslot.endTime),
      breakStartTime: this.toInputTime(timeslot.breakStartTime),
      breakEndTime: this.toInputTime(timeslot.breakEndTime),
      orderInDay: timeslot.orderInDay
    });
    this.modalVisible = true;
  }

  closeModal(): void {
    this.modalVisible = false;
    this.editingTimeslot = null;
  }

  onSubmit(): void {
    if (this.timeslotForm.invalid) return;

    const { startTime, endTime, breakStartTime, breakEndTime } = this.timeslotForm.value;
    if (startTime >= endTime) {
      this.notif.error('L\'heure de début doit être avant l\'heure de fin');
      return;
    }
    if ((!!breakStartTime && !breakEndTime) || (!breakStartTime && !!breakEndTime)) {
      this.notif.error('Veuillez renseigner début et fin de pause ensemble');
      return;
    }
    if (breakStartTime && breakEndTime) {
      if (breakStartTime >= breakEndTime) {
        this.notif.error('Le début de la pause doit être avant la fin de la pause');
        return;
      }
      if (breakStartTime < startTime || breakEndTime > endTime) {
        this.notif.error('La pause doit être comprise dans la journée');
        return;
      }
    }

    this.saving = true;
    const data = {
      ...this.timeslotForm.value,
      startTime: this.toApiTime(this.timeslotForm.value.startTime),
      endTime: this.toApiTime(this.timeslotForm.value.endTime),
      breakStartTime: this.toApiTime(this.timeslotForm.value.breakStartTime) || null,
      breakEndTime: this.toApiTime(this.timeslotForm.value.breakEndTime) || null
    };

    if (this.editingTimeslot) {
      this.adminService.updateTimeslot(this.editingTimeslot.id, data).subscribe({
        next: () => { this.loadTimeslots(); this.closeModal(); this.saving = false; this.notif.success('Timeslot updated'); },
        error: () => { this.saving = false; this.notif.error('Failed to update timeslot'); }
      });
    } else {
      this.adminService.generateDayTimeslots({
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        breakStartTime: data.breakStartTime,
        breakEndTime: data.breakEndTime,
        schoolId: this.schoolId
      }).subscribe({
        next: generated => {
          this.loadTimeslots();
          this.closeModal();
          this.saving = false;
          this.notif.success(`${generated.length} créneaux générés automatiquement`);
        },
        error: () => { this.saving = false; this.notif.error('Échec de génération automatique des créneaux'); }
      });
    }
  }

  confirmDelete(timeslot: Timeslot): void {
    this.timeslotToDelete = timeslot;
    this.deleteModalVisible = true;
  }

  onDeleteConfirmed(): void {
    if (!this.timeslotToDelete) return;
    this.adminService.deleteTimeslot(this.timeslotToDelete.id).subscribe({
      next: () => { this.loadTimeslots(); this.deleteModalVisible = false; this.timeslotToDelete = null; this.notif.success('Timeslot removed'); },
      error: () => { this.deleteModalVisible = false; this.notif.error('Failed to remove timeslot'); }
    });
  }

  copyMondayToWeek(): void {
    this.saving = true;
    this.adminService.copyMondayTimeslotsToWeek().subscribe({
      next: () => {
        this.loadTimeslots();
        this.saving = false;
        this.notif.success('Créneaux du lundi copiés vers les autres jours');
      },
      error: () => {
        this.saving = false;
        this.notif.error('Échec de copie des créneaux');
      }
    });
  }

  private toInputTime(value?: string | null): string {
    if (!value) return '';
    return value.length >= 5 ? value.slice(0, 5) : value;
  }

  private toApiTime(value?: string | null): string | null {
    if (!value) return null;
    return value.length === 5 ? `${value}:00` : value;
  }
}
