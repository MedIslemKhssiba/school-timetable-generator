import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule, GridModule, ButtonDirective, BadgeModule, ProgressModule, FormModule } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';
import { Lesson, Timeslot, ClassGroup, Subject, Teacher, Room, TimetableHistoryItem } from '../../../core/models';
import { HttpErrorResponse } from '@angular/common/http';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { forkJoin } from 'rxjs';
import { Subscription } from 'rxjs';
import { TimetableSolveStateService } from '../../../core/services/timetable-solve-state.service';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CardModule, GridModule, FormModule, ButtonDirective, BadgeModule, ProgressModule, SkeletonComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">{{ t('timetable') }}</h2>
        <p class="page-subtitle">{{ t('generate_manage_schedules') }}</p>
      </div>
      <input #csvInput type="file" accept=".csv,text/csv" class="d-none" (change)="onCsvSelected($event)" />
      <div class="d-flex gap-2 flex-wrap">
        <button cButton color="primary" (click)="solve()" [disabled]="solving">
          {{ solving ? t('solving') : t('generate') }}
        </button>
        <button cButton color="danger" variant="outline" (click)="stop()" [disabled]="!solving">
          {{ t('stop') }}
        </button>
        <button cButton color="secondary" variant="outline" (click)="save()" [disabled]="solving || lessons.length === 0">
          {{ t('save') }}
        </button>
        <button cButton color="light" (click)="refresh()">
          {{ t('refresh') }}
        </button>
        <button cButton color="danger" class="pdf-export-btn" (click)="exportExcel()" [disabled]="lessons.length === 0">
          {{ t('export') }}
        </button>
      </div>
    </div>

    @if (solving) {
      <c-card class="mb-4 solving-card">
        <c-card-body class="d-flex align-items-center gap-3">
          <div class="ai-orb"><div class="ai-orb-core"></div></div>
          <div class="flex-grow-1">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <div class="fw-semibold">{{ t('ai_solver_working') }}</div>
              <div class="solver-progress-text">{{ solveProgress }}%</div>
            </div>
            <div class="solver-bar"><div class="solver-bar-fill" [style.width.%]="solveProgress"></div></div>
            <div class="solver-dots mt-1"><span></span><span></span><span></span></div>
            <div class="solver-stage mt-2">{{ getSolveStageDescription() }}</div>
            @if (totalAssignments > 0) {
              <div class="solver-assignment mt-1">Cours places: {{ assignedAssignments }} / {{ totalAssignments }}</div>
            }
            <div class="solver-assignment mt-1">Qualite actuelle: {{ qualityPercent }}% | Score: {{ scoreLabel || 'N/A' }}</div>
            @if (solverCompleted) {
              <div class="solver-assignment mt-1 fw-semibold">Solveur termine. Faisabilite: {{ solverFeasible ? 'OK' : 'NON' }} | Optimal: {{ solverOptimal ? 'OUI' : 'EN COURS' }}</div>
            }
          </div>
        </c-card-body>
      </c-card>
    }

    @if (hasSolverSnapshot()) {
      <c-card class="mb-4">
        <c-card-body class="py-2">
          <div class="filter-bar">
            <c-badge [color]="solverCompleted ? 'success' : (solving ? 'warning' : 'secondary')">
              {{ solverCompleted ? 'Termine' : (solving ? 'En cours' : 'En attente') }}
            </c-badge>
            <span class="filter-label">Progression: <strong>{{ solveProgress }}%</strong></span>
            <span class="filter-label">Completion: <strong>{{ completionPercent }}%</strong></span>
            <span class="filter-label">Qualite emploi: <strong>{{ qualityPercent }}%</strong></span>
            <span class="filter-label">Hard: <strong>{{ hardScore }}</strong></span>
            <span class="filter-label">Soft: <strong>{{ softScore }}</strong></span>
            <span class="filter-label">Temps solveur: <strong>{{ formatSolvingTime(solvingTimeMs) }}</strong></span>
            <span class="filter-label">Conflits: <strong>{{ conflictsSummary['total'] || 0 }}</strong></span>
          </div>
        </c-card-body>
      </c-card>
    }

    @if (hasSolverSnapshot() && hasConflictDetails()) {
      <c-card class="mb-4">
        <c-card-body class="py-2">
          <div class="filter-bar">
            <span class="filter-label">Teacher: <strong>{{ conflictsSummary['teacher'] || 0 }}</strong></span>
            <span class="filter-label">Room: <strong>{{ conflictsSummary['room'] || 0 }}</strong></span>
            <span class="filter-label">Class: <strong>{{ conflictsSummary['class'] || 0 }}</strong></span>
            <span class="filter-label">Duplicates: <strong>{{ conflictsSummary['duplicates'] || 0 }}</strong></span>
            <span class="filter-label">Invalid: <strong>{{ conflictsSummary['invalidAssignments'] || 0 }}</strong></span>
          </div>
        </c-card-body>
      </c-card>
    }

    @if (hasSolverSnapshot() && (teacherLoadTop.length > 0 || roomUsageTop.length > 0 || classLoadTop.length > 0)) {
      <c-card class="mb-4">
        <c-card-body>
          <h6 class="mb-2">Charges et usage (Top 5)</h6>
          <div class="filter-bar mb-2">
            <span class="filter-label">Teachers: {{ teacherLoadTop.join(' | ') }}</span>
          </div>
          <div class="filter-bar mb-2">
            <span class="filter-label">Rooms: {{ roomUsageTop.join(' | ') }}</span>
          </div>
          <div class="filter-bar">
            <span class="filter-label">Classes: {{ classLoadTop.join(' | ') }}</span>
          </div>
        </c-card-body>
      </c-card>
    }

    @if (dataReadinessIssues.length > 0 || dataReadinessSuggestions.length > 0) {
      <c-card class="mb-4">
        <c-card-body>
          <h6 class="mb-2">Validation des donnees pour la generation</h6>
          @if (dataReadinessIssues.length > 0) {
            <div class="mb-2 fw-semibold text-danger">Points bloquants</div>
            <ul class="mb-3 ps-3">
              @for (issue of dataReadinessIssues; track issue) {
                <li>{{ issue }}</li>
              }
            </ul>
          }
          @if (dataReadinessSuggestions.length > 0) {
            <div class="mb-2 fw-semibold">Actions recommandees</div>
            <ul class="mb-0 ps-3">
              @for (tip of dataReadinessSuggestions; track tip) {
                <li>{{ tip }}</li>
              }
            </ul>
          }
        </c-card-body>
      </c-card>
    }

    @if (!historyLoading && generationHistory.length > 0) {
      <c-card class="mb-4">
        <c-card-body>
          <h6 class="mb-2">Historique des emplois du temps generes</h6>
          <div class="history-list">
            @for (item of generationHistory; track item.id) {
              <div class="history-item">
                <div class="history-head">
                  <span class="history-id">Generation #{{ item.id }}</span>
                  <span class="history-date">{{ formatHistoryDate(item.generatedAt) }}</span>
                </div>
                <div class="history-meta">
                  <span>Cours: <strong>{{ item.totalLessons }}</strong></span>
                  <span>Hard: <strong>{{ item.hardScore ?? 'N/A' }}</strong></span>
                  <span>Soft: <strong>{{ item.softScore ?? 'N/A' }}</strong></span>
                  <span>Dispatch enseignants: <strong>{{ item.teacherDispatchCount }}</strong></span>
                </div>
              </div>
            }
          </div>
        </c-card-body>
      </c-card>
    }

    @if (loading) {
      <ui-skeleton type="table" [count]="6" />
    } @else if (lessons.length > 0) {
      @if (integrityIssues.length > 0) {
        <c-card class="mb-4">
          <c-card-body>
            <h6 class="mb-2">Incoherences detectees dans l'emploi du temps</h6>
            <ul class="mb-0 ps-3">
              @for (issue of integrityIssues; track issue) {
                <li>{{ issue }}</li>
              }
            </ul>
          </c-card-body>
        </c-card>
      }

      <!-- Filter bar -->
      <c-card class="mb-4">
        <c-card-body class="py-2">
          <div class="filter-bar">
            <div class="filter-group">
              <label class="filter-label">{{ t('view_by') }}</label>
              <select class="filter-select" [(ngModel)]="viewMode">
                <option value="grid">{{ t('grid_view') }}</option>
                <option value="cards">{{ t('card_view') }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">{{ t('filter_class') }}</label>
              <select class="filter-select" [(ngModel)]="filterClass" (ngModelChange)="applyFilter()">
                <option value="">{{ t('all_classes') }}</option>
                @for (c of classNames; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">{{ t('filter_teacher') }}</label>
              <select class="filter-select" [(ngModel)]="filterTeacher" (ngModelChange)="applyFilter()">
                <option value="">{{ t('all_teachers') }}</option>
                @for (t of teacherNames; track t) {
                  <option [value]="t">{{ t }}</option>
                }
              </select>
            </div>
            @if (lunchBreakLabels.length > 0) {
              <div class="lunch-break-chip">Pause dejeuner: {{ lunchBreakLabels.join(' | ') }}</div>
            }
            <c-badge color="primary" class="ms-auto">{{ filteredLessons.length }} {{ t('lessons') }}</c-badge>
          </div>
        </c-card-body>
      </c-card>

      @if (viewMode === 'grid') {
        <!-- Grid View -->
        <c-card>
          <c-card-body class="p-0">
            <div class="timetable-grid-wrapper">
              <table class="timetable-grid">
                <thead>
                  <tr>
                    <th class="day-col">{{ t('day') }}</th>
                    @for (slot of timeSlots; track slot) {
                      <th class="time-col">{{ getTimeSlotLabel(slot) }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (day of days; track day) {
                    <tr>
                      <td class="day-cell">{{ formatDay(day) }}</td>
                      @for (slot of timeSlots; track slot) {
                        <td class="grid-cell">
                          @for (lesson of getLessonAt(day, slot); track lesson.id) {
                            <div class="grid-lesson" [style.border-left-color]="getSubjectColor(lesson.subjectName)">
                              <div class="grid-subject">{{ lesson.subjectName }}</div>
                              <div class="lesson-duration-chip">{{ formatLessonDuration(lesson) }}</div>
                              <div class="grid-meta">{{ lesson.classGroupName }}</div>
                              <div class="grid-meta">{{ lesson.teacherName }} &bull; {{ lesson.roomName }}</div>
                            </div>
                          }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </c-card-body>
        </c-card>
      } @else {
        <!-- Card View -->
        <c-row>
          @for (day of days; track day) {
            <c-col lg="4" md="6" class="mb-4">
              <c-card class="h-100">
                <c-card-header class="day-header">
                  <span>{{ formatDay(day) }}</span>
                  <c-badge color="light" textColor="dark" class="ms-auto">{{ getFilteredLessonsForDay(day).length }}</c-badge>
                </c-card-header>
                <c-card-body class="p-2">
                  @for (lesson of getFilteredLessonsForDay(day); track lesson.id) {
                    <div class="lesson-slot" [style.border-left-color]="getSubjectColor(lesson.subjectName)">
                      <div class="lesson-time">
                        {{ lesson.startTime }} - {{ lesson.endTime }}
                      </div>
                      <div class="lesson-subject">{{ lesson.subjectName }}</div>
                      <div class="lesson-duration-chip mb-1">{{ formatLessonDuration(lesson) }}</div>
                      <div class="lesson-details">
                        <span>{{ lesson.teacherName }}</span>
                        <span>{{ lesson.roomName }}</span>
                        <span>{{ lesson.classGroupName }}</span>
                      </div>
                    </div>
                  } @empty {
                    <div class="text-center text-muted py-4"><small>{{ t('no_lessons') }}</small></div>
                  }
                </c-card-body>
              </c-card>
            </c-col>
          }
        </c-row>
      }
    } @else if (!solving) {
      <c-card>
        <c-card-body class="text-center py-5">
          <h3 class="fw-bold mb-2">{{ t('no_timetable_yet') }}</h3>
          <p class="text-muted mb-0">{{ t('click_generate_msg') }}</p>
        </c-card-body>
      </c-card>
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
                  @for (d of scheduleDays; track d) {
                    <option [value]="d">{{ t(d) }}</option>
                  }
                </select>
              </div>
              <div class="copy-all-row">
                <input id="copyAllDaysFromTimetable" type="checkbox" [(ngModel)]="copyToAllDays" [ngModelOptions]="{standalone: true}" />
                <label for="copyAllDaysFromTimetable">Copier ces horaires sur tous les jours</label>
              </div>
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
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8D99A8; margin: 4px 0 0; font-family: 'Montserrat', sans-serif; }

    .solving-card { border-left: 4px solid #2563EB !important; }
    .solver-progress-text { font-size: 0.8rem; font-weight: 700; color: #2563EB; }
    .solver-stage { font-size: 0.78rem; color: #344861; font-weight: 600; font-family: 'Montserrat', sans-serif; }
    .solver-assignment { font-size: 0.73rem; color: #64748B; font-family: 'Montserrat', sans-serif; }
    .ai-orb {
      width: 32px; height: 32px; border-radius: 50%; position: relative; flex-shrink: 0;
      background: radial-gradient(circle at 30% 30%, rgba(37,99,235,0.35), rgba(37,99,235,0.08));
      box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.35);
      animation: pulse 1.4s ease-in-out infinite;
    }
    .ai-orb-core {
      position: absolute; inset: 9px; border-radius: 50%;
      background: #2563EB;
      animation: spin 1.2s linear infinite;
    }
    .solver-bar {
      height: 6px; width: 100%; border-radius: 999px; overflow: hidden;
      background: rgba(37, 99, 235, 0.12);
    }
    .solver-bar-fill {
      height: 100%;
      background: #2563EB;
      transition: width 300ms ease;
    }
    .solver-dots {
      display: inline-flex; gap: 5px;
    }
    .solver-dots span {
      width: 5px; height: 5px; border-radius: 50%; background: #2563EB;
      animation: blink 1s infinite ease-in-out;
    }
    .solver-dots span:nth-child(2) { animation-delay: 0.15s; }
    .solver-dots span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.35); transform: scale(1); }
      50% { box-shadow: 0 0 0 10px rgba(37,99,235,0); transform: scale(1.05); }
    }
    @keyframes blink {
      0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
      40% { opacity: 1; transform: translateY(-1px); }
    }

    .filter-bar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .pdf-export-btn {
      background-color: var(--cui-danger) !important;
      border-color: var(--cui-danger) !important;
      color: var(--cui-white) !important;
      font-weight: 700;
    }
    .pdf-export-btn:hover:not(:disabled) {
      filter: brightness(0.92);
    }
    .pdf-export-btn:disabled {
      opacity: 0.65;
    }
    .btn-import-csv {
      border: 1px solid rgba(37, 99, 235, 0.24) !important;
      background: linear-gradient(135deg, #EEF4FF 0%, #DDF0FF 100%) !important;
      color: #1D4ED8 !important;
      font-weight: 700 !important;
      box-shadow: 0 10px 20px rgba(37, 99, 235, 0.16) !important;
    }
    .btn-import-csv:hover {
      background: linear-gradient(135deg, #E0ECFF 0%, #CFE9FF 100%) !important;
      color: #1E40AF !important;
      border-color: rgba(37, 99, 235, 0.34) !important;
      box-shadow: 0 14px 24px rgba(37, 99, 235, 0.22) !important;
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
    .filter-group { display: flex; align-items: center; gap: 6px; }
    .lunch-break-chip {
      font-size: 0.76rem;
      font-weight: 700;
      color: #7C2D12;
      background: #FFF7ED;
      border: 1px solid #FED7AA;
      border-radius: 999px;
      padding: 4px 10px;
      white-space: nowrap;
      font-family: 'Montserrat', sans-serif;
    }
    .filter-label { font-size: 0.8rem; font-weight: 600; color: #8D99A8; white-space: nowrap; font-family: 'Montserrat', sans-serif; }
    .filter-select {
      font-size: 0.85rem; padding: 4px 10px; border: 1px solid #DDE3EE;
      border-radius: 8px; background: #F8FAFF; outline: none; font-family: 'Montserrat', sans-serif;
      &:focus { border-color: #2563EB; }
    }

    .timetable-grid-wrapper { overflow-x: auto; }
    .timetable-grid {
      width: 100%; border-collapse: collapse; min-width: 800px;
      th, td { padding: 8px 10px; border: 1px solid #DDE3EE; vertical-align: top; }
      thead th {
        background: #F0F4FA; font-size: 0.8rem; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.04em; color: #1A2332; text-align: center;
        font-family: 'Montserrat', sans-serif;
      }
      .time-col { min-width: 90px; }
      .day-col { min-width: 120px; }
      .day-cell { font-size: 0.75rem; font-weight: 700; color: #1E3A8A; white-space: nowrap; text-align: left; background: #F8FAFF; font-family: 'Montserrat', sans-serif; }
      .grid-cell { min-height: 60px; }
    }
    .grid-lesson {
      padding: 6px 8px; margin-bottom: 4px; border-radius: 6px;
      border-left: 3px solid #2563EB; background: #F0F4FA;
      font-size: 0.75rem; transition: transform 150ms;
      &:hover { transform: scale(1.02); }
      &:last-child { margin-bottom: 0; }
    }
    .grid-subject { font-weight: 700; color: #1A2332; margin-bottom: 2px; font-family: 'Montserrat', sans-serif; }
    .grid-meta { color: #8D99A8; font-family: 'Montserrat', sans-serif; }
    .lesson-duration-chip {
      display: inline-flex;
      align-items: center;
      font-size: 0.7rem;
      font-weight: 700;
      color: #1E3A8A;
      background: #DBEAFE;
      border: 1px solid #93C5FD;
      border-radius: 999px;
      padding: 2px 8px;
      margin-bottom: 4px;
      font-family: 'Montserrat', sans-serif;
    }

    .day-header {
      display: flex; align-items: center;
      background: #2563EB;
      color: #F8FAFF; font-weight: 600; font-family: 'Montserrat', sans-serif;
    }
    .lesson-slot {
      padding: 12px; margin: 6px; background: #F0F4FA;
      border-radius: 8px; border-left: 3px solid #2563EB;
      transition: transform 0.15s, box-shadow 0.15s;
      &:hover { transform: translateX(4px); box-shadow: 0 2px 8px rgba(37, 99, 235,0.1); }
    }
    .lesson-time {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; font-weight: 600; color: #2563EB; margin-bottom: 4px;
      font-family: 'Montserrat', sans-serif;
    }
    .lesson-subject { font-weight: 700; font-size: 0.95rem; margin-bottom: 6px; color: #1A2332; font-family: 'Montserrat', sans-serif; }
    .lesson-details { display: flex; flex-direction: column; gap: 2px; }
    .lesson-details span { font-size: 0.78rem; color: #8D99A8; font-family: 'Montserrat', sans-serif; }
    .history-list { display: grid; gap: 10px; }
    .history-item {
      border: 1px solid #DDE3EE;
      border-radius: 10px;
      padding: 10px 12px;
      background: #F8FAFF;
    }
    .history-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .history-id { font-weight: 700; color: #1E3A8A; font-family: 'Montserrat', sans-serif; font-size: 0.82rem; }
    .history-date { color: #64748B; font-size: 0.75rem; font-family: 'Montserrat', sans-serif; }
    .history-meta { display: flex; gap: 14px; flex-wrap: wrap; color: #334155; font-size: 0.77rem; font-family: 'Montserrat', sans-serif; }
  `]
})
export class TimetableComponent implements OnInit, OnDestroy {
  lessons: Lesson[] = [];
  timeslots: Timeslot[] = [];
  filteredLessons: Lesson[] = [];
  solving = false;
  solveProgress = 0;
  solveStatus = 'NOT_SOLVING';
  totalAssignments = 0;
  assignedAssignments = 0;
  loading = true;
  viewMode: 'grid' | 'cards' = 'grid';
  filterClass = '';
  filterTeacher = '';
  days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  timeSlots: string[] = [];
  timeSlotEndByStart: Record<string, string> = {};
  lunchBreakLabels: string[] = [];
  classNames: string[] = [];
  teacherNames: string[] = [];
  classes: ClassGroup[] = [];
  subjects: Subject[] = [];
  teachers: Teacher[] = [];
  rooms: Room[] = [];
  integrityIssues: string[] = [];
  dataReadinessIssues: string[] = [];
  dataReadinessSuggestions: string[] = [];
  completionPercent = 0;
  qualityPercent = 0;
  solverCompleted = false;
  solverFeasible = false;
  solverOptimal = false;
  hardScore = 0;
  softScore = 0;
  scoreLabel = '';
  solvingTimeMs = 0;
  conflictsSummary: Record<string, number> = {};
  scoreHistory: Array<{ timestampMs: number; hardScore: number; softScore: number; score: string }> = [];
  roomUsageTop: string[] = [];
  teacherLoadTop: string[] = [];
  classLoadTop: string[] = [];
  classLoadStats: Record<string, number> = {};
  expectedClassHoursStats: Record<string, number> = {};
  generationHistory: TimetableHistoryItem[] = [];
  historyLoading = false;
  private schoolId = 1;
  timeslotModalVisible = false;
  timeslotSaving = false;
  copyToAllDays = false;
  timeslotForm: FormGroup;
  scheduleDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  csvImporting = false;
  @ViewChild('csvInput') csvInput?: ElementRef<HTMLInputElement>;
  private subjectColors: Record<string, string> = {};
  private colorPalette = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#7C3AED', '#0EA5E9', '#EC4899', '#06B6D4', '#F97316', '#6366F1'];
  private stateSubscription?: Subscription;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private notify: NotificationService,
    private ts: TranslationService,
    private solveState: TimetableSolveStateService,
    private fb: FormBuilder,
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
  }

  t(key: string): string { return this.ts.t(key); }

  ngOnInit(): void {
    this.refresh();
    this.solveState.init(this.schoolId);
    this.stateSubscription = this.solveState.state$.subscribe(state => {
      this.solving = state.solving;
      this.solveProgress = state.progressPercent;
      this.completionPercent = state.completionPercent;
      this.qualityPercent = state.qualityPercent;
      this.solveStatus = state.status;
      this.totalAssignments = state.totalAssignments;
      this.assignedAssignments = state.assignedAssignments;
      this.solverCompleted = state.solverCompleted;
      this.solverFeasible = state.solverFeasible;
      this.solverOptimal = state.solverOptimal;
      this.hardScore = state.hardScore;
      this.softScore = state.softScore;
      this.scoreLabel = state.scoreLabel;
      this.solvingTimeMs = state.solvingTimeMs;
      this.conflictsSummary = state.conflicts;
      this.scoreHistory = state.scoreHistory;
      this.roomUsageTop = this.toTopList(state.roomUsage);
      this.teacherLoadTop = this.toTopList(state.teacherLoad);
      this.classLoadTop = this.toTopList(state.classLoad);
      this.classLoadStats = state.classLoad || {};
      this.expectedClassHoursStats = state.expectedClassHours || {};

      if (state.lessons.length > 0) {
        this.lessons = state.lessons;
        this.buildMeta();
        this.applyFilter();
        this.runIntegrityChecks();
      }
    });

    if (this.route.snapshot.queryParamMap.get('openImportCsv') === '1') {
      setTimeout(() => this.openCsvPicker(), 0);
    }
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  solve(): void {
    this.runDataReadinessChecks();
    if (this.dataReadinessIssues.length > 0) {
      this.notify.error('Generation bloquee: corrigez les donnees signalees dans la validation');
      return;
    }

    this.adminService.getSolveDiagnostics(this.schoolId).subscribe({
      next: (diagnostics) => {
        this.dataReadinessIssues = diagnostics.blockingIssues || [];
        const warningTips = diagnostics.warnings || [];
        const serverTips = diagnostics.suggestions || [];
        this.dataReadinessSuggestions = [...new Set([...(this.dataReadinessSuggestions || []), ...warningTips, ...serverTips])];

        if (!diagnostics.ready) {
          this.notify.error('Generation bloquee: le diagnostic backend a detecte des blocages');
          return;
        }

        this.adminService.syncTeachersWithTimeslots(this.schoolId).subscribe({
          next: () => {
            this.solveState.startSolve(this.schoolId).subscribe({
              next: () => {
                this.notify.info('Solving started! This may take a few minutes.');
              },
              error: (err) => {
                const msg = this.extractApiErrorMessage(err, 'Failed to start solving');
                this.notify.error(msg);
              }
            });
          },
          error: () => {
            this.notify.error('Impossible de synchroniser les disponibilites enseignants avant generation');
          }
        });
      },
      error: () => {
        this.notify.error('Diagnostic pre-solve indisponible. Reessayez.');
      }
    });
  }

  stop(): void {
    this.solveState.stopSolve().subscribe({
      next: () => {
        this.notify.info('Solving stopped');
      },
      error: () => this.notify.error('Failed to stop solving')
    });
  }

  save(): void {
    this.adminService.saveTimetable(this.schoolId).subscribe({
      next: () => {
        this.notify.success('Timetable saved and teachers synchronized!');
        this.solveState.refreshFromServer();
        this.refresh();
      },
      error: (err) => {
        const msg = this.extractApiErrorMessage(err, 'Failed to save timetable');
        this.notify.error(msg);
      }
    });
  }

  refresh(): void {
    this.loading = true;
    this.historyLoading = true;
    forkJoin({
      lessons: this.adminService.getLessons(this.schoolId),
      timeslots: this.adminService.getTimeslots(),
      classes: this.adminService.getClasses(this.schoolId),
      subjects: this.adminService.getSubjects(this.schoolId),
      rooms: this.adminService.getRooms(this.schoolId),
      teachers: this.adminService.getTeachers(this.schoolId),
      history: this.adminService.getTimetableHistory(this.schoolId)
    }).subscribe({
      next: ({ lessons, timeslots, classes, subjects, rooms, teachers, history }) => {
        this.lessons = lessons;
        this.timeslots = timeslots;
        this.classes = classes;
        this.subjects = subjects;
        this.rooms = rooms;
        this.teachers = teachers;
        this.generationHistory = history || [];
        this.buildMeta();
        this.applyFilter();
        this.runDataReadinessChecks();
        this.runIntegrityChecks();
        this.loading = false;
        this.historyLoading = false;
      },
      error: () => {
        this.loading = false;
        this.historyLoading = false;
      }
    });
  }

  exportExcel(): void {
    this.adminService.exportTimetable(this.schoolId).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob || blob.size === 0) {
          this.notify.error('Export vide. Generez puis sauvegardez un emploi du temps valide.');
          return;
        }

        const disposition = response.headers.get('content-disposition') || '';
        const fileNameMatch = disposition.match(/filename="?([^\";]+)"?/i);
        const fileName = fileNameMatch?.[1] || `timetable-school-${this.schoolId}.xlsx`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        this.notify.success('Export Excel reussi');
      },
      error: (err) => {
        const msg = this.extractApiErrorMessage(err, 'Echec export. Verifiez que le solveur a produit une solution.');
        this.notify.error(msg);
      }
    });
  }

  openCsvPicker(): void {
    if (this.csvImporting) {
      return;
    }
    this.csvInput?.nativeElement.click();
  }

  onCsvSelected(event: Event): void {
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
          this.notify.info(`Import terminé avec ${warnings.length} avertissement(s)`);
        } else {
          this.notify.success('Import CSV terminé');
        }
        this.refresh();
      },
      error: () => {
        this.csvImporting = false;
        input.value = '';
        this.notify.error('Échec de l\'import CSV');
      }
    });
  }

  openTimeslotModal(): void {
    this.copyToAllDays = false;
    this.timeslotForm.reset();
    this.timeslotModalVisible = true;
  }

  closeTimeslotModal(): void {
    this.timeslotModalVisible = false;
    this.copyToAllDays = false;
  }

  submitTimeslotConfig(): void {
    if (this.timeslotForm.invalid) return;

    const { dayOfWeek, startTime, endTime, breakStartTime, breakEndTime } = this.timeslotForm.value;
    if (startTime >= endTime) {
      this.notify.error('L\'heure de début doit être avant l\'heure de fin');
      return;
    }
    if ((!!breakStartTime && !breakEndTime) || (!breakStartTime && !!breakEndTime)) {
      this.notify.error('Veuillez renseigner début et fin de pause ensemble');
      return;
    }
    if (breakStartTime && breakEndTime) {
      if (breakStartTime >= breakEndTime) {
        this.notify.error('Le début de la pause doit être avant la fin de la pause');
        return;
      }
      if (breakStartTime < startTime || breakEndTime > endTime) {
        this.notify.error('La pause doit être comprise dans la journée');
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

    if (this.copyToAllDays) {
      const requests = this.scheduleDays.map(d => this.adminService.generateDayTimeslots({ ...payload, dayOfWeek: d }));
      forkJoin(requests).subscribe({
        next: generatedByDay => {
          const total = generatedByDay.reduce((sum, x) => sum + x.length, 0);
          this.timeslotSaving = false;
          this.closeTimeslotModal();
          this.syncTeachersForTimeslots(`${total} créneaux générés sur toute la semaine`);
        },
        error: () => {
          this.timeslotSaving = false;
          this.notify.error('Échec de génération automatique des créneaux');
        }
      });
      return;
    }

    this.adminService.generateDayTimeslots({ dayOfWeek, ...payload }).subscribe({
      next: generated => {
        this.timeslotSaving = false;
        this.closeTimeslotModal();
        this.syncTeachersForTimeslots(`${generated.length} créneaux générés automatiquement`);
      },
      error: () => {
        this.timeslotSaving = false;
        this.notify.error('Échec de génération automatique des créneaux');
      }
    });
  }

  private syncTeachersForTimeslots(successMessage: string): void {
    this.adminService.syncTeachersWithTimeslots(this.schoolId).subscribe({
      next: ({ created }) => {
        this.notify.success(`${successMessage}. Synchronisation enseignants: ${created} disponibilité(s) ajoutée(s).`);
        this.refresh();
      },
      error: () => {
        this.notify.success(successMessage);
        this.notify.error('Créneaux générés, mais la synchronisation enseignants a échoué');
        this.refresh();
      }
    });
  }

  applyFilter(): void {
    this.filteredLessons = this.lessons.filter(l =>
      (!this.filterClass || l.classGroupName === this.filterClass) &&
      (!this.filterTeacher || l.teacherName === this.filterTeacher)
    );
  }

  formatDay(day: string): string {
    return this.ts.t(day);
  }

  getFilteredLessonsForDay(day: string): Lesson[] {
    return this.filteredLessons
      .filter(l => l.dayOfWeek === day)
      .sort((a, b) => this.normalizeTime(a.startTime).localeCompare(this.normalizeTime(b.startTime)));
  }

  getLessonAt(day: string, slot: string): Lesson[] {
    return this.filteredLessons.filter(l => l.dayOfWeek === day && this.normalizeTime(l.startTime) === slot);
  }

  getTimeSlotLabel(startTime: string): string {
    const endTime = this.timeSlotEndByStart[startTime];
    return endTime ? `${startTime}-${endTime}` : startTime;
  }

  getSubjectColor(name: string): string {
    if (!this.subjectColors[name]) {
      const idx = Object.keys(this.subjectColors).length % this.colorPalette.length;
      this.subjectColors[name] = this.colorPalette[idx];
    }
    return this.subjectColors[name];
  }

  private buildMeta(): void {
    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const times = new Set<string>();
    const daysSet = new Set<string>();
    const classes = new Set<string>();
    const teachers = new Set<string>();
    const lunchBreaks = new Set<string>();

    this.timeSlotEndByStart = {};
    this.lunchBreakLabels = [];

    this.timeslots.forEach(ts => {
      if (ts.startTime) {
        const normalizedStart = this.normalizeTime(ts.startTime);
        times.add(normalizedStart);
        if (ts.endTime) {
          this.timeSlotEndByStart[normalizedStart] = this.normalizeTime(ts.endTime);
        }
      }
      if (ts.dayOfWeek) {
        daysSet.add(ts.dayOfWeek);
      }
      if (ts.breakStartTime && ts.breakEndTime) {
        lunchBreaks.add(`${this.normalizeTime(ts.breakStartTime)}-${this.normalizeTime(ts.breakEndTime)}`);
      }
    });

    this.lessons.forEach(l => {
      const normalizedStart = this.normalizeTime(l.startTime);
      times.add(normalizedStart);
      if (l.endTime) {
        this.timeSlotEndByStart[normalizedStart] = this.normalizeTime(l.endTime);
      }
      if (l.dayOfWeek) {
        daysSet.add(l.dayOfWeek);
      }
      classes.add(l.classGroupName);
      teachers.add(l.teacherName);
    });

    this.days = [...daysSet].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    if (this.days.length === 0) {
      this.days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    }

    this.timeSlots = [...times].sort((a, b) => a.localeCompare(b));
    this.lunchBreakLabels = [...lunchBreaks].sort((a, b) => a.localeCompare(b));
    this.classNames = [...classes].sort();
    this.teacherNames = [...teachers].sort();
  }

  private runIntegrityChecks(): void {
    const issues: string[] = [];
    const expectedByClass = new Map<string, number>();
    const hasBackendExpected = Object.keys(this.expectedClassHoursStats || {}).length > 0;

    if (hasBackendExpected) {
      Object.entries(this.expectedClassHoursStats).forEach(([className, expected]) => {
        expectedByClass.set(className, expected);
      });
    } else {
      this.classes.forEach(cg => {
        const expected = this.subjects
          .filter(s => this.subjectMatchesClassLevel(s.level, cg.level))
          .reduce((sum, s) => sum + (s.hoursPerWeek || 0), 0);
        expectedByClass.set(cg.name, expected);
      });
    }

    const actualByClass = new Map<string, number>();
    const hasBackendActual = Object.keys(this.classLoadStats || {}).length > 0;
    if (hasBackendActual) {
      Object.entries(this.classLoadStats).forEach(([className, load]) => {
        actualByClass.set(className, load);
      });
    } else {
      this.lessons.forEach(l => {
        actualByClass.set(l.classGroupName, (actualByClass.get(l.classGroupName) || 0) + 1);
      });
    }

    expectedByClass.forEach((expected, className) => {
      const actual = actualByClass.get(className) || 0;
      if (actual !== expected) {
        issues.push(`Classe ${className}: attendu ${expected} cours, genere ${actual}`);
      }
    });

    const classSlotSet = new Set<string>();
    const teacherSlotSet = new Set<string>();
    const roomSlotSet = new Set<string>();
    this.lessons.forEach(l => {
      const normalizedStart = this.normalizeTime(l.startTime);
      const classKey = `${l.classGroupName}|${l.dayOfWeek}|${normalizedStart}`;
      const teacherKey = `${l.teacherName}|${l.dayOfWeek}|${normalizedStart}`;
      const roomKey = `${l.roomName}|${l.dayOfWeek}|${normalizedStart}`;

      if (classSlotSet.has(classKey)) issues.push(`Conflit classe detecte: ${l.classGroupName} (${l.dayOfWeek} ${normalizedStart})`);
      if (teacherSlotSet.has(teacherKey)) issues.push(`Conflit enseignant detecte: ${l.teacherName} (${l.dayOfWeek} ${normalizedStart})`);
      if (roomSlotSet.has(roomKey)) issues.push(`Conflit salle detecte: ${l.roomName} (${l.dayOfWeek} ${normalizedStart})`);

      classSlotSet.add(classKey);
      teacherSlotSet.add(teacherKey);
      roomSlotSet.add(roomKey);
    });

    this.integrityIssues = [...new Set(issues)];
    if (this.integrityIssues.length > 0) {
      this.notify.error(`${this.integrityIssues.length} incoherence(s) detectee(s) dans l'emploi du temps`);
    }
  }

  private runDataReadinessChecks(): void {
    const issues: string[] = [];
    const tips: string[] = [];

    if (this.classes.length === 0) {
      issues.push('Aucune classe configuree');
      tips.push('Ajoutez au moins une classe avec un niveau et un effectif.');
    }
    if (this.subjects.length === 0) {
      issues.push('Aucune matiere configuree');
      tips.push('Ajoutez des matieres avec heures par semaine.');
    }
    if (this.rooms.length === 0) {
      issues.push('Aucune salle configuree');
      tips.push('Ajoutez au moins une salle avec capacite/type.');
    }
    if (this.timeslots.length === 0) {
      issues.push('Aucun creneau configure');
      tips.push('Generez les creneaux avant de lancer le solveur.');
    }

    const invalidSubjects = this.subjects.filter(s => !s.hoursPerWeek || s.hoursPerWeek <= 0);
    if (invalidSubjects.length > 0) {
      issues.push(`${invalidSubjects.length} matiere(s) sans heures par semaine valides`);
      tips.push('Renseignez hoursPerWeek > 0 pour toutes les matieres.');
    }

    const subjectsWithNoTeacher = this.subjects.filter(subject => {
      const sid = subject.id;
      return !this.teachers.some(t => (t.subjectIds || []).includes(sid));
    });
    if (subjectsWithNoTeacher.length > 0) {
      issues.push(`${subjectsWithNoTeacher.length} matiere(s) sans enseignant qualifie`);
      tips.push('Associez chaque matiere a au moins un enseignant.');
    }

    if (this.timeslots.length > 0) {
      for (const classGroup of this.classes) {
        const expectedHours = this.subjects
          .filter(s => this.subjectMatchesClassLevel(s.level, classGroup.level))
          .reduce((sum, s) => sum + (s.hoursPerWeek || 0), 0);

        if (expectedHours > this.timeslots.length) {
          issues.push(`Classe ${classGroup.name}: ${expectedHours} cours prevus > ${this.timeslots.length} creneaux disponibles`);
          tips.push(`Ajoutez des creneaux ou reduisez les heures hebdo pour ${classGroup.name}.`);
        }
      }
    }

    for (const classGroup of this.classes) {
      const hasCapacity = this.rooms.some(room => room.capacity >= classGroup.studentCount);
      if (!hasCapacity) {
        issues.push(`Classe ${classGroup.name}: aucune salle ne supporte ${classGroup.studentCount} eleves`);
        tips.push(`Augmentez la capacite d'une salle ou ajustez l'effectif de ${classGroup.name}.`);
      }
    }

    const subjectsWithRequiredRoomType = this.subjects.filter(s => (s.requiredRoomType || '').trim().length > 0);
    for (const subject of subjectsWithRequiredRoomType) {
      const requiredType = (subject.requiredRoomType || '').trim().toUpperCase();
      const hasMatchingRoom = this.rooms.some(r => (r.type || '').trim().toUpperCase() === requiredType);
      if (!hasMatchingRoom) {
        issues.push(`Matiere ${subject.name}: aucune salle de type requis (${subject.requiredRoomType})`);
        tips.push(`Ajoutez une salle de type ${subject.requiredRoomType} ou modifiez le type requis de ${subject.name}.`);
      }
    }

    this.dataReadinessIssues = [...new Set(issues)];
    this.dataReadinessSuggestions = [...new Set(tips)];
  }

  private subjectMatchesClassLevel(subjectLevel?: string, classLevel?: string): boolean {
    const normalize = (value?: string) => (value || '').trim().toUpperCase();
    const s = normalize(subjectLevel);
    const c = normalize(classLevel);
    if (!s) return true;
    if (!c) return false;

    const sn = this.extractFirstNumber(s);
    const cn = this.extractFirstNumber(c);
    if (sn !== null && cn !== null) return sn === cn;
    return s === c;
  }

  private extractFirstNumber(value: string): number | null {
    const m = value.match(/\d+/);
    if (!m) return null;
    const parsed = Number.parseInt(m[0], 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private normalizeTime(time?: string): string {
    if (!time) return '';
    const parts = time.trim().split(':');
    if (parts.length < 2) return time.trim();
    const hh = parts[0].padStart(2, '0');
    const mm = parts[1].padStart(2, '0');
    return `${hh}:${mm}`;
  }

  formatLessonDuration(lesson: Lesson): string {
    if (lesson.sessionDurationMinutes && lesson.sessionDurationMinutes > 0) {
      return `${lesson.sessionDurationMinutes} min`;
    }

    const start = this.parseTimeToMinutes(lesson.startTime);
    const end = this.parseTimeToMinutes(lesson.endTime);
    if (start !== null && end !== null && end > start) {
      return `${end - start} min`;
    }

    return 'N/A';
  }

  private parseTimeToMinutes(value?: string): number | null {
    if (!value) {
      return null;
    }
    const parts = value.split(':');
    if (parts.length < 2) {
      return null;
    }
    const h = Number.parseInt(parts[0], 10);
    const m = Number.parseInt(parts[1], 10);
    if (Number.isNaN(h) || Number.isNaN(m)) {
      return null;
    }
    return h * 60 + m;
  }

  formatHistoryDate(value?: string): string {
    if (!value) {
      return 'N/A';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString();
  }

  getSolveStageDescription(): string {
    if (this.solverCompleted) return 'Solveur termine: solution finale disponible';
    if (!this.solving) return '';
    if (this.solveProgress < 20) return 'Preparation des donnees (classes, enseignants, salles, creneaux)';
    if (this.solveProgress < 50) return 'Affectation des cours aux creneaux compatibles';
    if (this.solveProgress < 80) return 'Optimisation des conflits (enseignants, salles, classes)';
    if (this.solveProgress < 100) return 'Finalisation et verification de la solution';
    return 'Solution en cours de stabilisation';
  }

  hasSolverSnapshot(): boolean {
    return this.totalAssignments > 0 || !!this.scoreLabel || this.solverCompleted || this.solving;
  }

  hasConflictDetails(): boolean {
    return Object.keys(this.conflictsSummary || {}).length > 0;
  }

  formatSolvingTime(ms: number): string {
    const safe = Math.max(0, ms || 0);
    const seconds = Math.floor(safe / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainSeconds = seconds % 60;
    return `${minutes}m ${remainSeconds}s`;
  }

  private toTopList(map: Record<string, number>): string[] {
    return Object.entries(map || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => `${name}: ${value}`);
  }

  private extractApiErrorMessage(error: unknown, fallback: string): string {
    const httpError = error as HttpErrorResponse;
    const payload = httpError?.error;

    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        if (parsed?.message) {
          return parsed.message;
        }
      } catch {
        return payload;
      }
      return payload;
    }

    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = (payload as { message?: string }).message;
      if (message && message.trim().length > 0) {
        return message;
      }
    }

    if (httpError?.message) {
      return httpError.message;
    }

    return fallback;
  }
}
