import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CardModule, GridModule, ButtonDirective, FormModule } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { Subscription, forkJoin, interval, switchMap } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule, CardModule, GridModule, FormModule, ButtonDirective, SkeletonComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">{{ t('dashboard') }}</h2>
        <p class="page-subtitle">{{ t('school_management_overview') }}</p>
      </div>
    </div>

    @if (loading) {
      <ui-skeleton type="cards" [count]="4" />
    } @else {
      <div class="stats-grid mb-4">
        @for (stat of statCards; track stat.key) {
          <a class="stat-card" [routerLink]="stat.route" [ngClass]="'stat-' + stat.color">
            <div [ngClass]="['stat-icon-wrapper', 'stat-icon-' + stat.color]">
              <span class="stat-icon" [innerHTML]="stat.icon"></span>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats[stat.key] }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </a>
        }
      </div>

      <c-row>
        <c-col lg="12">
          <c-card class="welcome-card mb-4">
            <c-card-body>
              <div class="d-flex align-items-start gap-3 flex-wrap">
                <div class="flex-grow-1">
                  <h5 class="fw-bold mb-1">{{ t('welcome_back_name') }}, {{ userName }}!</h5>
                  <p class="text-body-secondary mb-3" style="max-width:520px">
                    {{ t('school_resources_message') }}
                  </p>
                  <div class="d-flex gap-2 flex-wrap">
                    <button cButton color="primary" routerLink="../timetable">
                      {{ t('generate_timetable') }}
                    </button>
                    <button cButton color="info" variant="outline" routerLink="../teachers">{{ t('manage_teachers') }}</button>
                  </div>
                </div>
              </div>
            </c-card-body>
          </c-card>
        </c-col>

        <c-col lg="12">
          <c-card class="import-data-card mb-4">
            <c-card-body>
              <div class="import-data-shell">
                <div>
                  <h5 class="import-data-title">Import des donnees de l'ecole</h5>
                  <p class="import-data-subtitle mb-0">
                    Importez votre fichier CSV (enseignants, classes, matieres, salles et affectations) pour initialiser rapidement l'ecole.
                  </p>
                </div>
                <div class="d-flex gap-2 flex-wrap">
                  <input #dashboardCsvInput type="file" accept=".csv,text/csv" class="d-none" (change)="onDashboardCsvSelected($event)" />
                  <button cButton color="light" (click)="downloadImportCsvTemplate()">
                    Télécharger modèle CSV
                  </button>
                  <button cButton class="btn-timeslot" (click)="openDashboardCsvPicker()" [disabled]="csvImporting">
                    {{ csvImporting ? 'Import...' : t('import_csv') }}
                  </button>
                </div>
              </div>
            </c-card-body>
          </c-card>
        </c-col>

        <c-col lg="12">
          <c-card class="timeslot-config-card mb-4">
            <c-card-body>
              <div class="timeslot-config-shell">
                <div>
                  <h5 class="timeslot-config-title">Configuration des créneaux</h5>
                  <p class="timeslot-config-subtitle mb-0">
                    Définissez les horaires de la semaine (début, fin et pause déjeuner). Les disponibilités enseignants seront synchronisées automatiquement.
                  </p>
                  <div class="d-flex gap-2 flex-wrap timeslot-config-actions mt-2">
                    <button cButton class="btn-timeslot" (click)="openTimeslotModal()">Configurer les créneaux</button>
                  </div>
                  <div class="timeslot-divider"></div>
                  @if (timeslotsLoading) {
                    <p class="timeslot-config-meta mt-2 mb-0">Chargement des créneaux existants...</p>
                  } @else if (existingTimeslots.length === 0) {
                    <p class="timeslot-config-meta mt-2 mb-0">Aucun créneau configuré pour le moment.</p>
                  } @else {
                    <div class="timeslot-preview mt-2">
                      @for (day of days; track day) {
                        <article class="timeslot-day-card" [class.off]="getDayWindow(day) === 'Non configure'">
                          <div class="timeslot-day-head">
                            <span class="timeslot-day-label">{{ t(day) }}</span>
                          </div>
                          <div class="timeslot-day-body">
                            <div class="timeslot-info-row">
                              <span class="timeslot-info-key">Plage</span>
                              <span class="timeslot-info-value">{{ getDayWindow(day) }}</span>
                            </div>
                            <div class="timeslot-info-row">
                              <span class="timeslot-info-key">Pause</span>
                              <span class="timeslot-info-value" [class.no-break]="!getDayBreak(day)">
                                {{ getDayBreak(day) ? getDayBreak(day) : 'Sans pause' }}
                              </span>
                            </div>
                          </div>
                          <div class="timeslot-day-actions">
                            <button cButton class="btn-timeslot-day" (click)="openTimeslotModalForDay(day)">
                              Modifier
                            </button>
                          </div>
                        </article>
                      }
                    </div>
                  }
                </div>
              </div>
            </c-card-body>
          </c-card>
        </c-col>
      </c-row>
    }

    @if (timeslotModalVisible) {
      <div class="modal-backdrop" (click)="closeTimeslotModal()"></div>
      <div class="modal-wrapper">
        <div class="modal-box">
          <div class="modal-header-custom">
            <h3>Configurer les horaires</h3>
            <button class="modal-close" (click)="closeTimeslotModal()">&times;</button>
          </div>
          <form [formGroup]="timeslotForm" (ngSubmit)="submitTimeslotConfig()">
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
              @if (!singleDayEditMode) {
                <div class="copy-all-row">
                  <input id="copyAllDaysDash" type="checkbox" [(ngModel)]="copyToAllDays" [ngModelOptions]="{standalone: true}" />
                  <label for="copyAllDaysDash">Copier ces horaires sur tous les jours</label>
                </div>
              }
              <div class="form-row">
                <div class="form-field">
                  <label cLabel>Heure de début *</label>
                  <input cFormControl formControlName="startTime" type="time" />
                </div>
                <div class="form-field">
                  <label cLabel>Heure de fin *</label>
                  <input cFormControl formControlName="endTime" type="time" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label cLabel>Début pause déjeuner</label>
                  <input cFormControl formControlName="breakStartTime" type="time" />
                </div>
                <div class="form-field">
                  <label cLabel>Fin pause déjeuner</label>
                  <input cFormControl formControlName="breakEndTime" type="time" />
                </div>
              </div>
            </div>
            <div class="modal-footer-custom">
              <button cButton color="secondary" type="button" (click)="closeTimeslotModal()">{{ t('cancel') }}</button>
              <button cButton color="primary" type="submit" [disabled]="timeslotForm.invalid || timeslotSaving">
                @if (timeslotSaving) { {{ t('saving') }} } @else { Générer }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8D99A8; margin: 4px 0 0; font-family: 'Montserrat', sans-serif; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; }
    .stat-card {
      background: linear-gradient(165deg, #ffffff 0%, #f4f8ff 100%); border-radius: 18px; padding: 22px 24px;
      display: flex; align-items: center; gap: 0;
      border: 1px solid rgba(183, 200, 226, 0.5); border-left: 4px solid transparent; box-shadow: 0 10px 24px rgba(15, 23, 42,0.08);
      cursor: pointer; transition: all 250ms; text-decoration: none; color: inherit;
      position: relative; overflow: hidden;
    }
    .stat-card::after {
      content: '';
      position: absolute;
      inset: auto -30% -60% auto;
      width: 130px;
      height: 130px;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.14) 0%, rgba(37, 99, 235, 0) 70%);
      pointer-events: none;
    }
    .stat-card:hover { transform: translateY(-4px); box-shadow: 0 16px 30px rgba(15, 23, 42,0.12); }
    .stat-primary { border-left-color: #2563EB; background: linear-gradient(165deg, #ffffff 0%, #edf4ff 100%); }
    .stat-info { border-left-color: #0EA5E9; background: linear-gradient(165deg, #ffffff 0%, #ecfeff 100%); }
    .stat-success { border-left-color: #10B981; background: linear-gradient(165deg, #ffffff 0%, #ecfdf5 100%); }
    .stat-warning { border-left-color: #F59E0B; background: linear-gradient(165deg, #ffffff 0%, #fffbeb 100%); }
    .stat-dark { border-left-color: #334155; background: linear-gradient(165deg, #ffffff 0%, #f1f5f9 100%); }
    .stat-icon-wrapper {
      width: 56px; height: 56px; border-radius: 14px;
      display: none; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .stat-icon { display: inline-flex; color: #2563EB; }
    .stat-icon :deep(svg) { width: 22px; height: 22px; fill: currentColor; stroke: none; }
    .stat-icon-primary { background: transparent; color: #2563EB; }
    .stat-icon-info    { background: transparent; color: #0284C7; }
    .stat-icon-warning { background: transparent; color: #D97706; }
    .stat-icon-success { background: transparent; color: #059669; }
    .stat-icon-dark { background: transparent; color: #334155; }
    .stat-content { flex: 1; }
    .stat-value { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; line-height: 1; }
    .stat-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #8D99A8; margin-top: 4px; font-family: 'Montserrat', sans-serif; }

    .welcome-card {
      border: 1px solid rgba(37, 99, 235, 0.2) !important;
      background: linear-gradient(140deg, rgba(255,255,255,0.95), rgba(239,246,255,0.92)) !important;
      box-shadow: 0 18px 30px rgba(37, 99, 235, 0.1) !important;
    }

    .timeslot-config-card {
      border: 1px solid rgba(14, 165, 233, 0.22) !important;
      background: linear-gradient(140deg, rgba(255,255,255,0.97), rgba(236,254,255,0.9)) !important;
      box-shadow: 0 14px 26px rgba(14, 165, 233, 0.12) !important;
    }
    .import-data-card {
      border: 1px solid rgba(59, 130, 246, 0.2) !important;
      background: linear-gradient(140deg, rgba(255,255,255,0.98), rgba(239,246,255,0.92)) !important;
      box-shadow: 0 12px 24px rgba(59, 130, 246, 0.1) !important;
    }
    .import-data-shell {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .import-data-title {
      margin: 0 0 4px;
      font-family: 'Montserrat', sans-serif;
      font-size: 1.03rem;
      font-weight: 700;
      color: #1A2332;
    }
    .import-data-subtitle {
      color: #4A5D79;
      font-size: 0.8rem;
      max-width: 760px;
      font-family: 'Montserrat', sans-serif;
    }
    .timeslot-config-shell {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 14px;
    }
    .timeslot-config-title {
      margin: 0 0 4px;
      font-family: 'Montserrat', sans-serif;
      font-size: 1.06rem;
      font-weight: 700;
      color: #1A2332;
    }
    .timeslot-config-subtitle {
      max-width: 700px;
      color: #4A5D79;
      font-size: 0.82rem;
      font-family: 'Montserrat', sans-serif;
    }
    .timeslot-config-meta {
      color: #6B7D94;
      font-size: 0.78rem;
      font-family: 'Montserrat', sans-serif;
    }
    .timeslot-preview {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      max-height: none;
      overflow: visible;
      padding-right: 0;
    }
    @media (max-width: 1100px) {
      .timeslot-preview { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 760px) {
      .timeslot-preview { grid-template-columns: 1fr; }
    }
    .timeslot-day-card {
      border: 1px solid rgba(179, 203, 238, 0.75);
      background: linear-gradient(165deg, #FFFFFF 0%, #F4F8FF 100%);
      border-radius: 14px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: 0 10px 20px rgba(30, 64, 175, 0.09);
      transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
    }
    .timeslot-day-card:hover {
      transform: translateY(-2px);
      border-color: rgba(96, 151, 240, 0.9);
      box-shadow: 0 16px 26px rgba(30, 64, 175, 0.16);
    }
    .timeslot-day-card.off {
      border-color: #E1E8F3;
      background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
      box-shadow: none;
    }
    .timeslot-day-head {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
    }
    .timeslot-day-label {
      font-size: 0.78rem;
      color: #1E2A3B;
      font-weight: 700;
      font-family: 'Montserrat', sans-serif;
      letter-spacing: 0.01em;
    }
    .timeslot-day-body {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .timeslot-info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      border: 1px solid rgba(203, 220, 245, 0.9);
      border-radius: 10px;
      background: #F8FBFF;
      padding: 6px 8px;
    }
    .timeslot-info-key {
      color: #5A6C84;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-family: 'Montserrat', sans-serif;
    }
    .timeslot-info-value {
      color: #1E3A8A;
      font-size: 0.72rem;
      font-weight: 700;
      font-family: 'Montserrat', sans-serif;
      text-align: right;
    }
    .timeslot-info-value.no-break {
      color: #64748B;
    }
    .timeslot-day-actions {
      margin-top: 2px;
      display: flex;
      justify-content: flex-end;
    }
    .btn-timeslot-day {
      border: 1px solid #BCD5FF !important;
      background: #EFF5FF !important;
      color: #1D4ED8 !important;
      font-weight: 700 !important;
      font-size: 0.68rem !important;
      border-radius: 8px !important;
      padding: 3px 10px !important;
      line-height: 1.25 !important;
    }
    .btn-timeslot-day:hover {
      background: #E1ECFF !important;
      color: #1E40AF !important;
      border-color: #9FC2FF !important;
    }
    .timeslot-chip {
      border: 1px solid #CDE0FF;
      background: #EEF4FF;
      color: #1E3A8A;
      border-radius: 8px;
      padding: 3px 8px;
      font-size: 0.7rem;
      font-weight: 600;
      font-family: 'Montserrat', sans-serif;
      line-height: 1.3;
    }
    .timeslot-chip.break {
      border-color: #FCD9A6;
      background: #FFF7E8;
      color: #92400E;
    }
    .timeslot-chip.primary {
      border-color: #B9D3FF;
      background: #EAF3FF;
      color: #1E40AF;
    }

    .btn-timeslot {
      border: 1px solid rgba(37, 99, 235, 0.24) !important;
      background: linear-gradient(135deg, #EEF4FF 0%, #DDF0FF 100%) !important;
      color: #1D4ED8 !important;
      font-weight: 700 !important;
      box-shadow: 0 10px 20px rgba(37, 99, 235, 0.16) !important;
    }
    .btn-timeslot:hover {
      background: linear-gradient(135deg, #E0ECFF 0%, #CFE9FF 100%) !important;
      color: #1E40AF !important;
      border-color: rgba(37, 99, 235, 0.34) !important;
      box-shadow: 0 14px 24px rgba(37, 99, 235, 0.22) !important;
    }
    .timeslot-config-actions {
      justify-content: flex-start;
      margin-bottom: 10px;
    }
    .timeslot-divider {
      height: 1px;
      width: 100%;
      background: linear-gradient(90deg, rgba(151, 181, 230, 0.2) 0%, rgba(118, 158, 221, 0.72) 45%, rgba(151, 181, 230, 0.2) 100%);
      margin: 2px 0 12px;
    }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(13, 20, 40,0.4); z-index: 1050; backdrop-filter: blur(4px); }
    .modal-wrapper { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 1051; padding: 24px; }
    .modal-box { background: #F8FAFF; border-radius: 16px; width: 100%; max-width: 520px; box-shadow: 0 25px 50px rgba(13, 27, 62,0.2); }
    .modal-header-custom {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid #DDE3EE;
      h3 { margin: 0; font-family: 'Montserrat', sans-serif; font-size: 1.125rem; font-weight: 700; color: #1A2332; }
    }
    .modal-close {
      width: 42px; height: 42px;
      display: inline-flex; align-items: center; justify-content: center;
      background: none; border: none; cursor: pointer; color: #8D99A8;
      padding: 0; border-radius: 10px; font-size: 2.25rem; line-height: 1;
      &:hover { background: #EAEEF6; color: #1A2332; }
    }
    .modal-body-custom { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
    .copy-all-row {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.84rem; color: #4A5D79; font-family: 'Montserrat', sans-serif;
    }
    .copy-all-row input { width: 16px; height: 16px; cursor: pointer; }
    .copy-all-row label { cursor: pointer; }
    .form-field { display: flex; flex-direction: column; flex: 1; }
    .form-row { display: flex; gap: 16px; }
    .modal-footer-custom { padding: 16px 24px; border-top: 1px solid #DDE3EE; display: flex; justify-content: flex-end; gap: 10px; }

  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats: Record<string, number> = {
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalRooms: 0,
    totalLessons: 0,
    lessonsPerTeacher: 0,
    classesPerTeacher: 0
  };
  userName = '';
  loading = true;
  timeslotModalVisible = false;
  timeslotSaving = false;
  copyToAllDays = false;
  singleDayEditMode = false;
  csvImporting = false;
  timeslotsLoading = false;
  existingTimeslots: Array<{ id: number; dayOfWeek: string; startTime: string; endTime: string; breakStartTime?: string; breakEndTime?: string; orderInDay?: number }> = [];
  timeslotForm: FormGroup;
  private schoolId = 1;
  private pollSub?: Subscription;
  days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  @ViewChild('dashboardCsvInput') dashboardCsvInput?: ElementRef<HTMLInputElement>;

  private icon(d: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">${d}</svg>`
    );
  }

  icons = {
    teachers: this.icon('<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0v1H2v-1Zm13 1v-1a5 5 0 0 1 7 0v1h-7Z"/>'),
    classes: this.icon('<path d="M6 4a3 3 0 0 0-3 3v11a2 2 0 0 0 2 2h14v-2H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h13V4H6Z"/><path d="M19 8H8a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11V8Z"/>'),
    subjects: this.icon('<path d="M9 2a2 2 0 0 0-2 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1a2 2 0 0 0-2-2H9Zm1 7h6v2h-6V9Zm0 4h6v2h-6v-2Z"/>'),
    rooms: this.icon('<path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6v-4h-4v4H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 3v2h2V6H7Zm0 4v2h2v-2H7Zm0 4v2h2v-2H7Zm8-8v2h2V6h-2Zm0 4v2h2v-2h-2Z"/>'),
    lessons: this.icon('<path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm12 8H5v10h14V10Z"/>'),
    ratio: this.icon('<path d="M4 20h16v2H2V4h2v16Zm2-1v-6h3v6H6Zm5 0V8h3v11h-3Zm5 0V4h3v15h-3Z"/>')
  };

  statCards = [
    { key: 'totalTeachers', label: this.t('teachers'), color: 'primary', route: '../teachers', icon: this.icons.teachers },
    { key: 'totalClasses', label: this.t('classes'), color: 'info', route: '../classes', icon: this.icons.classes },
    { key: 'totalSubjects', label: this.t('subjects'), color: 'warning', route: '../subjects', icon: this.icons.subjects },
    { key: 'totalRooms', label: this.t('rooms'), color: 'success', route: '../rooms', icon: this.icons.rooms },
    { key: 'totalLessons', label: this.t('weekly_lessons'), color: 'dark', route: '../timetable', icon: this.icons.lessons },
    { key: 'lessonsPerTeacher', label: this.t('lessons') + ' / ' + this.t('teacher'), color: 'primary', route: '../teachers', icon: this.icons.ratio }
  ];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private ts: TranslationService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder,
    private notif: NotificationService,
    private route: ActivatedRoute
  ) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.timeslotForm = this.fb.group({
      dayOfWeek: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      breakStartTime: [''],
      breakEndTime: ['']
    });
    this.authService.currentUser$.subscribe(u => {
      if (u) this.userName = u.firstName;
    });
  }

  t(key: string): string { return this.ts.t(key); }

  private mapDashboardStats(raw: any): Record<string, number> {
    const totalTeachers = Number(raw['totalTeachers'] ?? 0);
    const totalClasses = Number(raw['totalClasses'] ?? 0);
    const totalSubjects = Number(raw['totalSubjects'] ?? 0);
    const totalRooms = Number(raw['totalRooms'] ?? 0);
    const totalLessons = Number(raw['totalLessons'] ?? 0);

    return {
      totalTeachers,
      totalClasses,
      totalSubjects,
      totalRooms,
      totalLessons,
      lessonsPerTeacher: totalTeachers > 0 ? Number((totalLessons / totalTeachers).toFixed(1)) : 0,
      classesPerTeacher: totalTeachers > 0 ? Number((totalClasses / totalTeachers).toFixed(1)) : 0
    };
  }

  ngOnInit(): void {
    this.loading = true;
    this.timeslotsLoading = true;
    forkJoin({
      dashboard: this.adminService.getDashboard(this.schoolId),
      timeslots: this.adminService.getTimeslots()
    }).subscribe({
      next: ({ dashboard, timeslots }) => {
        this.stats = this.mapDashboardStats(dashboard);
        this.existingTimeslots = timeslots;
        this.loading = false;
        this.timeslotsLoading = false;
      },
      error: () => {
        this.loading = false;
        this.timeslotsLoading = false;
      }
    });

    if (this.route.snapshot.queryParamMap.get('openTimeslot') === '1') {
      this.openTimeslotModal();
    }

    this.pollSub = interval(30000).pipe(
      switchMap(() => this.adminService.getDashboard(this.schoolId))
    ).subscribe(s => this.stats = this.mapDashboardStats(s));
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  openTimeslotModal(): void {
    this.singleDayEditMode = false;
    this.copyToAllDays = false;
    this.timeslotForm.reset();
    this.timeslotModalVisible = true;
  }

  openTimeslotModalForDay(day: string): void {
    this.singleDayEditMode = true;
    this.copyToAllDays = false;
    this.timeslotForm.reset({
      dayOfWeek: day,
      startTime: '',
      endTime: '',
      breakStartTime: '',
      breakEndTime: ''
    });
    this.timeslotModalVisible = true;
  }

  closeTimeslotModal(): void {
    this.timeslotModalVisible = false;
    this.copyToAllDays = false;
    this.singleDayEditMode = false;
  }

  submitTimeslotConfig(): void {
    if (this.timeslotForm.invalid) return;

    const { dayOfWeek, startTime, endTime, breakStartTime, breakEndTime } = this.timeslotForm.value;
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

    this.timeslotSaving = true;
    const payload = {
      startTime,
      endTime,
      breakStartTime: breakStartTime || null,
      breakEndTime: breakEndTime || null,
      schoolId: this.schoolId
    };

    if (!this.singleDayEditMode && this.copyToAllDays) {
      const requests = this.days.map(d => this.adminService.generateDayTimeslots({ ...payload, dayOfWeek: d }));
      forkJoin(requests).subscribe({
        next: generatedByDay => {
          const total = generatedByDay.reduce((sum, x) => sum + x.length, 0);
          this.timeslotSaving = false;
          this.closeTimeslotModal();
          this.syncTeachersForTimeslots(`${total} créneaux générés sur toute la semaine`);
        },
        error: () => {
          this.timeslotSaving = false;
          this.notif.error('Échec de génération automatique des créneaux');
        }
      });
      return;
    }

    this.adminService.generateDayTimeslots({
      dayOfWeek,
      ...payload
    }).subscribe({
      next: generated => {
        this.timeslotSaving = false;
        this.closeTimeslotModal();
        this.syncTeachersForTimeslots(`${generated.length} créneaux générés automatiquement`);
      },
      error: () => {
        this.timeslotSaving = false;
        this.notif.error('Échec de génération automatique des créneaux');
      }
    });
  }

  private syncTeachersForTimeslots(successMessage: string): void {
    this.adminService.syncTeachersWithTimeslots(this.schoolId).subscribe({
      next: ({ created }) => {
        this.notif.success(`${successMessage}. Synchronisation enseignants: ${created} disponibilité(s) ajoutée(s).`);
        this.loadExistingTimeslots();
      },
      error: () => {
        this.notif.success(successMessage);
        this.notif.error('Créneaux générés, mais la synchronisation enseignants a échoué');
        this.loadExistingTimeslots();
      }
    });
  }

  getTimeslotsByDay(day: string): Array<{ id: number; dayOfWeek: string; startTime: string; endTime: string; breakStartTime?: string; breakEndTime?: string; orderInDay?: number }> {
    return this.existingTimeslots
      .filter(ts => ts.dayOfWeek === day)
      .sort((a, b) => {
        const orderA = a.orderInDay ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.orderInDay ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
  }

  getDaySummary(day: string): string {
    const slots = this.getTimeslotsByDay(day);
    if (slots.length === 0) {
      return 'Non configuré';
    }

    const dayStart = slots[0].startTime;
    const dayEnd = slots.reduce((max, s) => (s.endTime > max ? s.endTime : max), slots[0].endTime);
    const breakStarts = slots.map(s => s.breakStartTime).filter((v): v is string => !!v);
    const breakEnds = slots.map(s => s.breakEndTime).filter((v): v is string => !!v);

    if (breakStarts.length > 0 && breakEnds.length > 0) {
      const breakStart = breakStarts.reduce((min, v) => (v < min ? v : min), breakStarts[0]);
      const breakEnd = breakEnds.reduce((max, v) => (v > max ? v : max), breakEnds[0]);
      return `de ${dayStart} a ${dayEnd}, pause dejeuner de ${breakStart} a ${breakEnd}`;
    }

    return `de ${dayStart} a ${dayEnd}`;
  }

  getDayWindow(day: string): string {
    const slots = this.getTimeslotsByDay(day);
    if (slots.length === 0) {
      return 'Non configure';
    }
    const dayStart = slots[0].startTime;
    const dayEnd = slots.reduce((max, s) => (s.endTime > max ? s.endTime : max), slots[0].endTime);
    return `${dayStart} - ${dayEnd}`;
  }

  getDayBreak(day: string): string {
    const slots = this.getTimeslotsByDay(day);
    const breakStarts = slots.map(s => s.breakStartTime).filter((v): v is string => !!v);
    const breakEnds = slots.map(s => s.breakEndTime).filter((v): v is string => !!v);
    if (breakStarts.length === 0 || breakEnds.length === 0) {
      return '';
    }
    const breakStart = breakStarts.reduce((min, v) => (v < min ? v : min), breakStarts[0]);
    const breakEnd = breakEnds.reduce((max, v) => (v > max ? v : max), breakEnds[0]);
    return `${breakStart} - ${breakEnd}`;
  }

  private loadExistingTimeslots(): void {
    this.timeslotsLoading = true;
    this.adminService.getTimeslots().subscribe({
      next: timeslots => {
        this.existingTimeslots = timeslots;
        this.timeslotsLoading = false;
      },
      error: () => {
        this.timeslotsLoading = false;
      }
    });
  }

  downloadImportCsvTemplate(): void {
    const rows = [
      'Day,Start Time,End Time,Subject,Teacher,Class,Room',
      'MONDAY,08:00,09:00,Math,John Doe,Class A,Room 101',
      'MONDAY,09:00,10:00,Physics,Jane Smith,Class A,Lab 1',
      'TUESDAY,08:00,09:00,English,John Doe,Class B,Room 102'
    ];
    const csv = '\uFEFF' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modele_import_timetable.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    this.notif.success('Modèle CSV téléchargé');
  }

  openDashboardCsvPicker(): void {
    if (this.csvImporting) {
      return;
    }
    this.dashboardCsvInput?.nativeElement.click();
  }

  onDashboardCsvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
      return;
    }

    this.csvImporting = true;
    this.adminService.importData(this.schoolId, file).subscribe({
      next: warnings => {
        this.csvImporting = false;
        input.value = '';
        if (warnings && warnings.length > 0) {
          this.notif.info(`Import terminé avec ${warnings.length} avertissement(s)`);
        } else {
          this.notif.success('Import CSV terminé');
        }
      },
      error: () => {
        this.csvImporting = false;
        input.value = '';
        this.notif.error('Échec de l\'import CSV');
      }
    });
  }
}
