import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule, GridModule, ButtonDirective, BadgeModule, ProgressModule, FormModule } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';
import { Lesson, Timeslot, ClassGroup, Subject, Teacher, Room } from '../../../core/models';
import { HttpErrorResponse } from '@angular/common/http';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { forkJoin } from 'rxjs';
import { Subscription } from 'rxjs';
import { TimetableSolveStateService } from '../../../core/services/timetable-solve-state.service';
import JSZip from 'jszip';

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
        <button cButton class="send-btn" (click)="save()" [disabled]="solving || lessons.length === 0">
          Envoyer
        </button>
        <button cButton color="danger" class="pdf-export-btn" (click)="openExportModal()" [disabled]="solving || lessons.length === 0">
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
              <div class="solver-assignment mt-1">Cours placés : {{ assignedAssignments }} / {{ totalAssignments }}</div>
            }
            <div class="solver-assignment mt-1">Qualité actuelle : {{ qualityPercent }}% | Score : {{ scoreLabel || 'N/D' }}</div>
            @if (solverCompleted) {
              <div class="solver-assignment mt-1 fw-semibold">Solveur terminé. Faisabilité : {{ solverFeasible ? 'OK' : 'NON' }} | Optimal : {{ solverOptimal ? 'OUI' : 'EN COURS' }}</div>
            }
          </div>
        </c-card-body>
      </c-card>
    }

    @if (hasSolverSnapshot()) {
      <div class="premium-stats-grid mb-4">
        <c-card class="premium-stat-card">
          <c-card-body>
            <div class="stat-title">Statut solveur</div>
            <div class="stat-value">{{ solverCompleted ? 'Terminé' : (solving ? 'En cours' : 'En attente') }}</div>
            <div class="stat-meta">Temps : {{ formatSolvingTime(solvingTimeMs) }}</div>
          </c-card-body>
        </c-card>
        <c-card class="premium-stat-card">
          <c-card-body>
            <div class="stat-title">Progression</div>
            <div class="stat-value">{{ solveProgress }}%</div>
            <div class="stat-meta">Complétion : {{ completionPercent }}%</div>
          </c-card-body>
        </c-card>
        <c-card class="premium-stat-card">
          <c-card-body>
            <div class="stat-title">Qualité globale</div>
            <div class="stat-value">{{ qualityPercent }}%</div>
            <div class="stat-meta">Indice global : {{ scoreLabel || 'N/D' }}</div>
          </c-card-body>
        </c-card>
        <c-card class="premium-stat-card">
          <c-card-body>
            <div class="stat-title">Conflits</div>
            <div class="stat-value">{{ conflictsSummary['total'] || 0 }}</div>
            <div class="stat-meta">Enseignant {{ conflictsSummary['teacher'] || 0 }} | Salle {{ conflictsSummary['room'] || 0 }} | Classe {{ conflictsSummary['class'] || 0 }}</div>
          </c-card-body>
        </c-card>
        <c-card class="premium-stat-card">
          <c-card-body>
            <div class="stat-title">Score dur</div>
            <div class="stat-value">{{ hardScore }}</div>
            <div class="stat-meta">Violation critique</div>
          </c-card-body>
        </c-card>
        <c-card class="premium-stat-card">
          <c-card-body>
            <div class="stat-title">Score souple (confort)</div>
            <div class="stat-value">{{ getNormalizedSoftScoreLabel() }}</div>
            <div class="stat-meta">{{ getSoftScoreExplanation() }}</div>
          </c-card-body>
        </c-card>
      </div>
    }

    @if (hasSolverSnapshot() && (teacherLoadTop.length > 0 || roomUsageTop.length > 0 || classLoadTop.length > 0)) {
      <c-card class="mb-4">
        <c-card-body>
          <h6 class="mb-2">Analyse de charge</h6>
          <div class="analysis-grid">
            <div class="analysis-col">
              <div class="analysis-title">Enseignants les plus chargés</div>
              @for (row of teacherLoadTop; track row) {
                <div class="analysis-item">{{ row }}</div>
              }
            </div>
            <div class="analysis-col">
              <div class="analysis-title">Classes les plus chargées</div>
              @for (row of classLoadTop; track row) {
                <div class="analysis-item">{{ row }}</div>
              }
            </div>
            <div class="analysis-col">
              <div class="analysis-title">Salles les plus utilisées</div>
              @for (row of roomUsageTop; track row) {
                <div class="analysis-item">{{ row }}</div>
              }
            </div>
          </div>
        </c-card-body>
      </c-card>
    }

    @if (dataReadinessIssues.length > 0 || dataReadinessSuggestions.length > 0) {
      <c-card class="mb-4">
        <c-card-body>
          <h6 class="mb-2">Validation des données pour la génération</h6>
          @if (dataReadinessIssues.length > 0) {
            <div class="mb-2 fw-semibold text-danger">Points bloquants</div>
            <ul class="mb-3 ps-3">
              @for (issue of dataReadinessIssues; track issue) {
                <li>{{ issue }}</li>
              }
            </ul>
          }
          @if (dataReadinessSuggestions.length > 0) {
            <div class="mb-2 fw-semibold">Actions recommandées</div>
            <ul class="mb-0 ps-3">
              @for (tip of dataReadinessSuggestions; track tip) {
                <li>{{ tip }}</li>
              }
            </ul>
          }
        </c-card-body>
      </c-card>
    }

    @if (loading) {
      <ui-skeleton type="table" [count]="6" />
    } @else if (lessons.length > 0) {
      @if (integrityIssues.length > 0) {
        <c-card class="mb-4">
          <c-card-body>
            <h6 class="mb-2">Incohérences détectées dans l'emploi du temps</h6>
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
              <div class="lunch-break-chip">Pause déjeuner : {{ lunchBreakLabels.join(' | ') }}</div>
            }
            @if (draggedLesson) {
              <div class="move-help-chip">Déplacement en cours: {{ getPossibleMoveCount() }} case(s) possible(s)</div>
            }
            <c-badge color="primary" class="ms-auto">{{ filteredLessons.length }} {{ t('lessons') }}</c-badge>
          </div>
        </c-card-body>
      </c-card>

      <div #exportSurface class="export-surface">
      @if (viewMode === 'grid') {
        <!-- Grid View -->
        <c-card>
          <c-card-body class="p-0">
            <div class="timetable-grid-wrapper">
              <table class="timetable-grid">
                <thead>
                  <tr>
                    <th class="time-col">Créneau</th>
                    @for (day of days; track day) {
                      <th class="day-col">{{ formatDay(day) }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (slot of timeSlots; track slot) {
                    <tr>
                      <td class="time-cell">{{ getTimeSlotLabel(slot) }}</td>
                      @for (day of days; track day) {
                        <td
                          class="grid-cell"
                          [class.drop-possible]="isDropTarget(day, slot)"
                          [class.drop-source]="isSourceCell(day, slot)"
                          [class.drop-occupied]="isDropTarget(day, slot) && hasSwappableTarget(day, slot)"
                          (dragover)="onCellDragOver($event)"
                          (drop)="onCellDrop(day, slot, $event)">
                          @if (draggedLesson && isDropTarget(day, slot)) {
                            <div class="drop-hint">{{ hasSwappableTarget(day, slot) ? 'Permutation' : 'Déplacer ici' }}</div>
                          }
                          @for (lesson of getLessonAt(day, slot); track lesson.id) {
                            <div class="grid-lesson"
                              [style.border-left-color]="getSubjectColor(lesson.subjectName)"
                              draggable="true"
                              (dragstart)="onLessonDragStart(lesson, $event)"
                              (dragend)="onLessonDragEnd()"
                              (drop)="onLessonDrop(lesson, $event)">
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
      </div>
    } @else if (!solving) {
      <c-card>
        <c-card-body class="text-center py-5">
          <h3 class="fw-bold mb-2">{{ t('no_timetable_yet') }}</h3>
          <p class="text-muted mb-0">{{ t('click_generate_msg') }}</p>
        </c-card-body>
      </c-card>
    }

    @if (exportModalVisible) {
      <div class="modal-backdrop" (click)="closeExportModal()"></div>
      <div class="modal-wrapper">
        <div class="modal-box">
          <div class="modal-header-custom">
            <h3>Exporter en image</h3>
            <button class="modal-close" (click)="closeExportModal()">&times;</button>
          </div>
          <div class="modal-body-custom">
            <div class="form-field">
              <label cLabel>Type d export</label>
              <select cFormControl [(ngModel)]="exportScope" [ngModelOptions]="{standalone: true}">
                <option value="all-classes">Toutes les classes (une image par classe)</option>
                <option value="class">Une classe spécifique</option>
                <option value="teacher">Un professeur spécifique</option>
                <option value="combined-all">Export combiné (ZIP classes + professeurs)</option>
              </select>
            </div>
            <div class="form-field">
              <label cLabel>Nom de l'école</label>
              <input cFormControl [(ngModel)]="exportSchoolName" [ngModelOptions]="{standalone: true}" placeholder="Nom de l'école" />
            </div>
            <div class="form-field">
              <label cLabel>Année scolaire</label>
              <input cFormControl [(ngModel)]="exportAcademicYear" [ngModelOptions]="{standalone: true}" placeholder="2025-2026" />
            </div>
            @if (exportScope === 'class') {
              <div class="form-field">
                <label cLabel>Classe</label>
                <select cFormControl [(ngModel)]="exportClass" [ngModelOptions]="{standalone: true}">
                  <option value="">Choisir une classe</option>
                  @for (c of classNames; track c) {
                    <option [value]="c">{{ c }}</option>
                  }
                </select>
              </div>
            }
            @if (exportScope === 'teacher') {
              <div class="form-field">
                <label cLabel>Professeur</label>
                <select cFormControl [(ngModel)]="exportTeacher" [ngModelOptions]="{standalone: true}">
                  <option value="">Choisir un professeur</option>
                  @for (t of teacherNames; track t) {
                    <option [value]="t">{{ t }}</option>
                  }
                </select>
              </div>
            }
          </div>
          <div class="modal-footer-custom">
            <button cButton color="secondary" type="button" (click)="closeExportModal()">{{ t('cancel') }}</button>
            <button cButton color="danger" type="button" (click)="confirmExportImage()">Exporter</button>
          </div>
        </div>
      </div>
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
    .send-btn {
      background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%) !important;
      border-color: #16A34A !important;
      color: #ffffff !important;
      font-weight: 700 !important;
      box-shadow: 0 10px 20px rgba(22, 163, 74, 0.22) !important;
    }
    .send-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%) !important;
      box-shadow: 0 12px 24px rgba(22, 163, 74, 0.28) !important;
    }
    .send-btn:focus,
    .send-btn:focus-visible,
    .send-btn:active {
      box-shadow: 0 0 0 0.2rem rgba(34, 197, 94, 0.28) !important;
      border-color: #16A34A !important;
      background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%) !important;
    }
    .send-btn:disabled {
      opacity: 0.7;
      box-shadow: none !important;
    }
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
    .move-help-chip {
      font-size: 0.76rem;
      font-weight: 700;
      color: #065F46;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
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
    .premium-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    .premium-stat-card {
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
    }
    .stat-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0F172A;
      line-height: 1.1;
    }
    .stat-meta {
      margin-top: 6px;
      font-size: 0.74rem;
      color: #475569;
    }
    .analysis-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    .analysis-col {
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      background: #F8FAFC;
      padding: 10px;
    }
    .analysis-title {
      font-size: 0.78rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 8px;
    }
    .analysis-item {
      font-size: 0.75rem;
      color: #475569;
      padding: 4px 0;
      border-top: 1px dashed #CBD5E1;
    }
    .analysis-item:first-of-type {
      border-top: none;
      padding-top: 0;
    }
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
      .time-cell {
        font-size: 0.75rem;
        font-weight: 700;
        color: #1E3A8A;
        white-space: nowrap;
        text-align: center;
        vertical-align: middle;
        background: #F8FAFF;
        font-family: 'Montserrat', sans-serif;
      }
      .grid-cell { min-height: 60px; position: relative; }
      .grid-cell.drag-over { outline: 2px dashed #22C55E; background: #ECFDF5; }
      .grid-cell.drop-possible { background: #F8FFFC; }
      .grid-cell.drop-source { background: #EFF6FF; }
      .grid-cell.drop-occupied { background: #FFF7ED; }
    }
    .export-surface { background: transparent; }
    .drop-hint {
      position: absolute;
      top: 6px;
      right: 6px;
      z-index: 1;
      font-size: 0.62rem;
      font-weight: 700;
      color: #0F766E;
      background: #CCFBF1;
      border: 1px solid #99F6E4;
      border-radius: 999px;
      padding: 2px 6px;
      font-family: 'Montserrat', sans-serif;
      pointer-events: none;
    }
    .grid-lesson {
      padding: 6px 8px; margin-bottom: 4px; border-radius: 6px;
      border-left: 3px solid #2563EB; background: #FFFFFF;
      border: 1px solid #E2E8F0;
      position: relative;
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
      padding: 12px; margin: 6px; background: #FFFFFF;
      border-radius: 8px; border-left: 3px solid #2563EB;
      border: 1px solid #E2E8F0;
      position: relative;
      transition: transform 0.15s, box-shadow 0.15s;
      &:hover { transform: translateX(4px); box-shadow: 0 2px 8px rgba(37, 99, 235,0.1); }
    }
    .lesson-time {
      display: flex; align-items: center; gap: 6px;
      justify-content: center;
      text-align: center;
      width: 100%;
      padding: 4px 8px;
      border-radius: 8px;
      background: #EFF6FF;
      font-size: 0.8rem; font-weight: 700; color: #2563EB; margin-bottom: 6px;
      font-family: 'Montserrat', sans-serif;
    }
    .lesson-subject { font-weight: 700; font-size: 0.95rem; margin-bottom: 6px; color: #1A2332; font-family: 'Montserrat', sans-serif; }
    .lesson-details { display: flex; flex-direction: column; gap: 2px; }
    .lesson-details span { font-size: 0.78rem; color: #8D99A8; font-family: 'Montserrat', sans-serif; }
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
  exportScope: 'all-classes' | 'class' | 'teacher' | 'combined-all' = 'all-classes';
  exportClass = '';
  exportTeacher = '';
  exportModalVisible = false;
  exportSchoolName = 'EcoCode School';
  exportAcademicYear = this.getDefaultAcademicYear();
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
  private schoolId = 1;
  timeslotModalVisible = false;
  timeslotSaving = false;
  draggedLesson: Lesson | null = null;
  dropSaving = false;
  copyToAllDays = false;
  timeslotForm: FormGroup;
  scheduleDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  csvImporting = false;
  @ViewChild('csvInput') csvInput?: ElementRef<HTMLInputElement>;
  @ViewChild('exportSurface') exportSurface?: ElementRef<HTMLElement>;
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
    this.authService.getProfile().subscribe({
      next: (profile) => {
        const schoolName = profile?.schoolName || profile?.school?.name;
        if (schoolName && String(schoolName).trim().length > 0) {
          this.exportSchoolName = String(schoolName).trim();
        }
      }
    });
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
      this.notify.error('Génération bloquée : corrigez les données signalées dans la validation');
      return;
    }

    this.adminService.getSolveDiagnostics(this.schoolId).subscribe({
      next: (diagnostics) => {
        this.dataReadinessIssues = diagnostics.blockingIssues || [];
        const warningTips = diagnostics.warnings || [];
        const serverTips = diagnostics.suggestions || [];
        this.dataReadinessSuggestions = [...new Set([...(this.dataReadinessSuggestions || []), ...warningTips, ...serverTips])];

        if (!diagnostics.ready) {
          this.notify.error('Génération bloquée : le diagnostic backend a détecté des blocages');
          return;
        }

        this.adminService.syncTeachersWithTimeslots(this.schoolId).subscribe({
          next: () => {
            this.solveState.startSolve(this.schoolId).subscribe({
              next: () => {
                this.notify.info('Génération lancée. Cela peut prendre quelques minutes.');
              },
              error: (err) => {
                const msg = this.extractApiErrorMessage(err, 'Échec du lancement de la génération');
                this.notify.error(msg);
              }
            });
          },
          error: () => {
            this.notify.error('Impossible de synchroniser les disponibilités des enseignants avant la génération');
          }
        });
      },
      error: () => {
        this.notify.error('Diagnostic pré-génération indisponible. Réessayez.');
      }
    });
  }

  stop(): void {
    this.solveState.stopSolve().subscribe({
      next: () => {
        this.notify.info('Génération arrêtée');
      },
      error: () => this.notify.error('Échec de l arrêt de la génération')
    });
  }

  save(): void {
    this.adminService.saveTimetable(this.schoolId).subscribe({
      next: () => {
        const lessonsCount = this.lessons.length;
        const teachersCount = new Set(this.lessons.map(l => l.teacherName).filter(name => !!name && name.trim().length > 0)).size;
        if (lessonsCount > 0) {
          this.notify.success(`Publication réussie : ${lessonsCount} cours envoyés à ${teachersCount} enseignant(s) concerné(s).`);
        } else {
          this.notify.success('Publication de l emploi du temps effectuée.');
        }
        this.solveState.refreshFromServer();
        this.refresh();
      },
      error: (err) => {
        const msg = this.extractApiErrorMessage(err, 'Échec de l envoi de l emploi du temps');
        this.notify.error(msg);
      }
    });
  }

  refresh(): void {
    this.loading = true;
    forkJoin({
      lessons: this.adminService.getLessons(this.schoolId),
      timeslots: this.adminService.getTimeslots(),
      classes: this.adminService.getClasses(this.schoolId),
      subjects: this.adminService.getSubjects(this.schoolId),
      rooms: this.adminService.getRooms(this.schoolId),
      teachers: this.adminService.getTeachers(this.schoolId)
    }).subscribe({
      next: ({ lessons, timeslots, classes, subjects, rooms, teachers }) => {
        this.lessons = lessons;
        this.timeslots = timeslots;
        this.classes = classes;
        this.subjects = subjects;
        this.rooms = rooms;
        this.teachers = teachers;
        this.buildMeta();
        this.applyFilter();
        this.runDataReadinessChecks();
        this.runIntegrityChecks();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openExportModal(): void {
    this.exportModalVisible = true;
  }

  closeExportModal(): void {
    this.exportModalVisible = false;
  }

  async confirmExportImage(): Promise<void> {
    await this.exportAsImage();
    this.closeExportModal();
  }

  async exportAsImage(): Promise<void> {
    if (this.lessons.length === 0) {
      this.notify.error('Aucun emploi du temps à exporter');
      return;
    }

    const previousClass = this.filterClass;
    const previousTeacher = this.filterTeacher;
    let exportedCount = 0;

    try {
      if (this.exportScope === 'combined-all') {
        const zip = new JSZip();

        for (const className of this.classNames) {
          const blob = await this.renderProfessionalTimetableImage(this.lessons.filter(l => l.classGroupName === className), `Classe : ${className}`);
          zip.file(`classes/emploi-${this.slugify(className)}.png`, blob);
          exportedCount += 1;
        }

        for (const teacherName of this.teacherNames) {
          const blob = await this.renderProfessionalTimetableImage(this.lessons.filter(l => l.teacherName === teacherName), `Enseignant : ${teacherName}`);
          zip.file(`professeurs/emploi-prof-${this.slugify(teacherName)}.png`, blob);
          exportedCount += 1;
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        this.downloadBlob(zipBlob, `emplois-combines-${this.schoolId}.zip`);
      } else if (this.exportScope === 'all-classes') {
        if (this.classNames.length === 0) {
          const blob = await this.renderProfessionalTimetableImage(this.lessons, 'Vue globale');
          this.downloadBlob(blob, 'emploi-du-temps.png');
          exportedCount += 1;
        } else {
          for (const className of this.classNames) {
            const blob = await this.renderProfessionalTimetableImage(this.lessons.filter(l => l.classGroupName === className), `Classe : ${className}`);
            this.downloadBlob(blob, `emploi-${this.slugify(className)}.png`);
            exportedCount += 1;
          }
        }
      } else if (this.exportScope === 'class') {
        if (!this.exportClass) {
          this.notify.error('Choisissez une classe pour l export');
          return;
        }
        const blob = await this.renderProfessionalTimetableImage(this.lessons.filter(l => l.classGroupName === this.exportClass), `Classe : ${this.exportClass}`);
        this.downloadBlob(blob, `emploi-${this.slugify(this.exportClass)}.png`);
        exportedCount += 1;
      } else {
        if (!this.exportTeacher) {
          this.notify.error('Choisissez un enseignant pour l export');
          return;
        }
        const blob = await this.renderProfessionalTimetableImage(this.lessons.filter(l => l.teacherName === this.exportTeacher), `Enseignant : ${this.exportTeacher}`);
        this.downloadBlob(blob, `emploi-prof-${this.slugify(this.exportTeacher)}.png`);
        exportedCount += 1;
      }

      if (this.exportScope === 'combined-all') {
        this.notify.success(`Export premium terminé : ${exportedCount} emploi(s) du temps généré(s) dans une archive ZIP.`);
      } else {
        this.notify.success(`Export premium terminé : ${exportedCount} image(s) générée(s).`);
      }
    } catch {
      this.notify.error('Échec de l export image');
    } finally {
      this.filterClass = previousClass;
      this.filterTeacher = previousTeacher;
      this.applyFilter();
    }
  }

  onLessonDragStart(lesson: Lesson, event: DragEvent): void {
    if (this.dropSaving) {
      event.preventDefault();
      return;
    }
    if (!lesson.id || lesson.id <= 0) {
      event.preventDefault();
      this.notify.info('Publiez d abord l emploi du temps pour déplacer les cours.');
      return;
    }
    this.draggedLesson = lesson;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(lesson.id));
    }
  }

  onLessonDragEnd(): void {
    this.draggedLesson = null;
    document.querySelectorAll('.grid-cell.drag-over').forEach(cell => cell.classList.remove('drag-over'));
  }

  isSourceCell(day: string, slot: string): boolean {
    if (!this.draggedLesson) {
      return false;
    }
    return this.draggedLesson.dayOfWeek === day && this.normalizeTime(this.draggedLesson.startTime) === slot;
  }

  isDropTarget(day: string, slot: string): boolean {
    if (!this.draggedLesson) {
      return false;
    }
    if (this.isSourceCell(day, slot)) {
      return false;
    }
    const targetTimeslot = this.resolveTimeslot(day, slot);
    if (!targetTimeslot) {
      return false;
    }
    const occupant = this.getAllLessonsAt(day, slot).find(lesson => lesson.id !== this.draggedLesson?.id);
    return this.canApplyMove(targetTimeslot.id, occupant).ok;
  }

  hasSwappableTarget(day: string, slot: string): boolean {
    if (!this.draggedLesson) {
      return false;
    }
    return this.getAllLessonsAt(day, slot).some(lesson => lesson.id !== this.draggedLesson?.id);
  }

  getPossibleMoveCount(): number {
    if (!this.draggedLesson) {
      return 0;
    }
    let total = 0;
    for (const day of this.days) {
      for (const slot of this.timeSlots) {
        if (this.isDropTarget(day, slot)) {
          total += 1;
        }
      }
    }
    return total;
  }

  onCellDragOver(event: DragEvent): void {
    if (!this.draggedLesson) {
      return;
    }
    event.preventDefault();
    const cell = event.currentTarget as HTMLElement | null;
    cell?.classList.add('drag-over');
  }

  onCellDrop(day: string, slot: string, event: DragEvent): void {
    event.preventDefault();
    const cell = event.currentTarget as HTMLElement | null;
    cell?.classList.remove('drag-over');

    if (!this.draggedLesson || this.dropSaving) {
      return;
    }

    const targetTimeslot = this.resolveTimeslot(day, slot);
    if (!targetTimeslot) {
      this.notify.error('Impossible de trouver le créneau cible');
      return;
    }

    const occupant = this.getAllLessonsAt(day, slot).find(lesson => lesson.id !== this.draggedLesson?.id);
    const validation = this.canApplyMove(targetTimeslot.id, occupant);
    if (!validation.ok) {
      this.notify.error(validation.reason || 'Déplacement impossible (conflit détecté)');
      return;
    }
    this.applyDragDropMove(targetTimeslot.id, occupant?.id);
  }

  onLessonDrop(targetLesson: Lesson, event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.draggedLesson || this.dropSaving || this.draggedLesson.id === targetLesson.id) {
      return;
    }

    const targetTimeslot = this.resolveTimeslot(targetLesson.dayOfWeek, this.normalizeTime(targetLesson.startTime));
    if (!targetTimeslot) {
      this.notify.error('Impossible de trouver le créneau cible');
      return;
    }

    const validation = this.canApplyMove(targetTimeslot.id, targetLesson);
    if (!validation.ok) {
      this.notify.error(validation.reason || 'Permutation impossible (conflit détecté)');
      return;
    }

    this.applyDragDropMove(targetTimeslot.id, targetLesson.id);
  }

  private applyDragDropMove(targetTimeslotId: number, targetLessonId?: number): void {
    if (!this.draggedLesson) {
      return;
    }

    const sourceLessonId = this.draggedLesson.id;
    if (!sourceLessonId || sourceLessonId <= 0) {
      this.notify.info('Publiez d abord l emploi du temps pour déplacer les cours.');
      this.draggedLesson = null;
      return;
    }

    const effectiveTargetLessonId = targetLessonId && targetLessonId > 0 ? targetLessonId : undefined;
    const beforeById = new Map<number, Lesson>(this.lessons.map(l => [l.id, l]));
    this.dropSaving = true;
    this.adminService.moveLesson(sourceLessonId, { targetTimeslotId, targetLessonId: effectiveTargetLessonId }).subscribe({
      next: updates => {
        let changed = false;
        updates.forEach(updated => {
          const before = beforeById.get(updated.id);
          if (!before
              || before.timeslotId !== updated.timeslotId
              || before.roomId !== updated.roomId
              || before.teacherId !== updated.teacherId
              || before.classGroupId !== updated.classGroupId) {
            changed = true;
          }
          this.lessons = this.lessons.map(item => item.id === updated.id ? updated : item);
        });
        this.buildMeta();
        this.applyFilter();
        this.runIntegrityChecks();
        this.solveState.refreshFromServer();
        this.refresh();
        if (!changed) {
          this.notify.info('Aucune permutation appliquée. Vérifiez les contraintes et les filtres actifs.');
        } else {
          this.notify.success(effectiveTargetLessonId ? 'Leçons permutées avec succès' : 'Leçon déplacée avec succès');
        }
        this.dropSaving = false;
        this.draggedLesson = null;
      },
      error: (err) => {
        this.dropSaving = false;
        const msg = this.extractApiErrorMessage(err, 'Déplacement impossible');
        this.notify.error(msg);
      }
    });
  }

  private resolveTimeslot(day: string, slotStart: string): Timeslot | undefined {
    const normalized = this.normalizeTime(slotStart);
    return this.timeslots.find(ts => ts.dayOfWeek === day && this.normalizeTime(ts.startTime) === normalized);
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

  private getAllLessonsAt(day: string, slot: string): Lesson[] {
    return this.lessons.filter(l => l.dayOfWeek === day && this.normalizeTime(l.startTime) === slot);
  }

  private canApplyMove(targetTimeslotId: number, targetLesson?: Lesson): { ok: boolean; reason?: string } {
    if (!this.draggedLesson) {
      return { ok: false, reason: 'Aucune leçon en cours de déplacement' };
    }

    const source = this.draggedLesson;
    const ignoredIds = new Set<number>([source.id]);

    if (!targetLesson) {
      return this.validatePlacement(source, targetTimeslotId, source.roomId, ignoredIds);
    }

    ignoredIds.add(targetLesson.id);
    const sourceToTarget = this.validatePlacement(source, targetTimeslotId, targetLesson.roomId, ignoredIds);
    if (!sourceToTarget.ok) {
      return sourceToTarget;
    }

    return this.validatePlacement(targetLesson, source.timeslotId, source.roomId, ignoredIds);
  }

  private validatePlacement(
    lesson: Lesson,
    timeslotId: number,
    roomId: number,
    ignoreIds: Set<number>
  ): { ok: boolean; reason?: string } {
    for (const other of this.lessons) {
      if (ignoreIds.has(other.id)) {
        continue;
      }
      if (other.timeslotId !== timeslotId) {
        continue;
      }

      if (other.teacherId === lesson.teacherId) {
        return { ok: false, reason: `Conflit enseignant: ${lesson.teacherName} est déjà occupé(e) sur ce créneau` };
      }
      if (other.roomId === roomId) {
        return { ok: false, reason: `Conflit salle: ${other.roomName} est déjà occupée sur ce créneau` };
      }
      if (other.classGroupId === lesson.classGroupId) {
        return { ok: false, reason: `Conflit classe: ${lesson.classGroupName} a déjà un cours sur ce créneau` };
      }
    }

    return { ok: true };
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
    if (!this.lessons || this.lessons.length === 0) {
      this.integrityIssues = [];
      return;
    }

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

  normalizeTime(time?: string): string {
    if (!time) return '';
    const parts = time.trim().split(':');
    if (parts.length < 2) return time.trim();
    const hh = parts[0].padStart(2, '0');
    const mm = parts[1].padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
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

    return 'N/D';
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

  private truncateCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (!text) {
      return '';
    }
    if (ctx.measureText(text).width <= maxWidth) {
      return text;
    }
    const ellipsis = '...';
    let low = 0;
    let high = text.length;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      const candidate = `${text.slice(0, mid)}${ellipsis}`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    return `${text.slice(0, low)}${ellipsis}`;
  }

  getSolveStageDescription(): string {
    if (this.solverCompleted) return 'Solveur terminé : solution finale disponible';
    if (!this.solving) return '';
    if (this.solveProgress < 20) return 'Préparation des données (classes, enseignants, salles, créneaux)';
    if (this.solveProgress < 50) return 'Affectation des cours aux créneaux compatibles';
    if (this.solveProgress < 80) return 'Optimisation des conflits (enseignants, salles, classes)';
    if (this.solveProgress < 100) return 'Finalisation et vérification de la solution';
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

  private async renderProfessionalTimetableImage(lessons: Lesson[], scopeLabel: string): Promise<Blob> {
    const days = this.days.length > 0 ? this.days : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const configuredStarts = new Set<string>();
    const localEndByStart: Record<string, string> = {};
    this.timeslots.forEach(ts => {
      const start = this.normalizeTime(ts.startTime);
      if (!start) {
        return;
      }
      configuredStarts.add(start);
      if (ts.endTime) {
        localEndByStart[start] = this.normalizeTime(ts.endTime);
      }
    });

    lessons.forEach(l => {
      const start = this.normalizeTime(l.startTime);
      if (!start) {
        return;
      }
      configuredStarts.add(start);
      if (l.endTime && !localEndByStart[start]) {
        localEndByStart[start] = this.normalizeTime(l.endTime);
      }
    });

    const slots = configuredStarts.size > 0
      ? Array.from(configuredStarts).sort((a, b) => a.localeCompare(b))
      : (this.timeSlots.length > 0
        ? this.timeSlots
        : Array.from(new Set(lessons.map(l => this.normalizeTime(l.startTime)))).sort((a, b) => a.localeCompare(b)));

    const breakRows = this.lunchBreakLabels
      .map(label => {
        const [rawStart, rawEnd] = label.split('-');
        const start = this.normalizeTime(rawStart || '');
        const end = this.normalizeTime(rawEnd || '');
        return { kind: 'break' as const, start, end, label: start && end ? `${start}-${end}` : label };
      })
      .filter(row => !!row.start)
      .sort((a, b) => a.start.localeCompare(b.start));

    const timeRows: Array<{ kind: 'lesson' | 'break'; start: string; label: string }> = [
      ...slots.map(slot => ({
        kind: 'lesson' as const,
        start: slot,
        label: localEndByStart[slot] ? `${slot}-${localEndByStart[slot]}` : this.getTimeSlotLabel(slot)
      })),
      ...breakRows.map(row => ({ kind: 'break' as const, start: row.start, label: row.label }))
    ].sort((a, b) => {
      const byStart = a.start.localeCompare(b.start);
      if (byStart !== 0) return byStart;
      if (a.kind === b.kind) return 0;
      return a.kind === 'break' ? -1 : 1;
    });

    const scale = 2;
    const headerHeight = 180;
    const footerHeight = 0;
    const leftCol = 170;
    const dayCol = 290;
    const rowHeight = 128;
    const width = leftCol + dayCol * days.length;
    const slotRowCount = Math.max(1, timeRows.length);
    const tableRowCount = slotRowCount + 1; // +1 for the header row (Créneau + jours)
    const gridHeight = tableRowCount * rowHeight;
    const height = headerHeight + footerHeight + gridHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponible');
    ctx.scale(scale, scale);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const headerGradient = ctx.createLinearGradient(0, 0, width, 0);
    headerGradient.addColorStop(0, '#0f4c81');
    headerGradient.addColorStop(1, '#1e88e5');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, width, headerHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 30px Montserrat, Arial, sans-serif';
    ctx.fillText(this.exportSchoolName?.trim() || 'École', 36, 56);
    const isClassScope = scopeLabel.startsWith('Classe :');
    ctx.font = isClassScope ? '800 30px Montserrat, Arial, sans-serif' : '700 22px Montserrat, Arial, sans-serif';
    const normalizedScope = this.truncateCanvasText(ctx, scopeLabel, width * 0.68);
    ctx.fillText(normalizedScope, 36, 100);
    ctx.font = '600 18px Montserrat, Arial, sans-serif';
    ctx.fillText(`Année scolaire : ${this.exportAcademicYear || this.getDefaultAcademicYear()}`, 36, 132);

    ctx.textAlign = 'right';
    ctx.font = '500 16px Montserrat, Arial, sans-serif';
    ctx.fillText(`Emploi valable à partir du ${new Date().toLocaleDateString('fr-FR')}`, width - 24, 40);
    ctx.textAlign = 'left';

    const gridTop = headerHeight;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, gridTop, width, rowHeight);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    for (let i = 0; i <= days.length; i++) {
      const x = leftCol + i * dayCol;
      ctx.beginPath();
      ctx.moveTo(x, gridTop);
      ctx.lineTo(x, gridTop + gridHeight);
      ctx.stroke();
    }
    for (let r = 0; r <= tableRowCount; r++) {
      const y = gridTop + r * rowHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 15px Montserrat, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Créneau', leftCol / 2, gridTop + (rowHeight / 2));
    days.forEach((day, index) => {
      const x = leftCol + index * dayCol + (dayCol / 2);
      ctx.fillText(this.formatDay(day), x, gridTop + (rowHeight / 2));
    });
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const lessonMap = new Map<string, Lesson[]>();
    lessons.forEach(l => {
      const key = `${l.dayOfWeek}|${this.normalizeTime(l.startTime)}`;
      const arr = lessonMap.get(key) || [];
      arr.push(l);
      lessonMap.set(key, arr);
    });

    timeRows.forEach((rowInfo, row) => {
      const y = gridTop + rowHeight * (row + 1);
      ctx.fillStyle = '#1e3a8a';
      ctx.font = '600 14px Montserrat, Arial, sans-serif';
      const slotLabel = rowInfo.label;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(slotLabel, leftCol / 2, y + (rowHeight / 2));
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      if (rowInfo.kind === 'break') {
        days.forEach((day, col) => {
          const x = leftCol + col * dayCol;
          const blockPadding = 8;
          const blockY = y + 8;
          const blockH = rowHeight - 16;
          const dayHasBreak = this.timeslots.some(ts =>
            ts.dayOfWeek === day
            && ts.breakStartTime
            && ts.breakEndTime
            && this.normalizeTime(ts.breakStartTime) === rowInfo.start
          );

          ctx.fillStyle = dayHasBreak ? '#fff7ed' : '#f8fafc';
          ctx.fillRect(x + blockPadding, blockY, dayCol - blockPadding * 2, blockH);
          ctx.strokeStyle = dayHasBreak ? '#fdba74' : '#e2e8f0';
          ctx.strokeRect(x + blockPadding, blockY, dayCol - blockPadding * 2, blockH);
          ctx.fillStyle = dayHasBreak ? '#9a3412' : '#94a3b8';
          ctx.font = '700 12px Montserrat, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(dayHasBreak ? 'Pause déjeuner' : '-', x + (dayCol / 2), blockY + (blockH / 2) + 4);
          ctx.textAlign = 'left';
        });
        return;
      }

      days.forEach((day, col) => {
        const x = leftCol + col * dayCol;
        const items = lessonMap.get(`${day}|${rowInfo.start}`) || [];
        const blockPadding = 8;
        const blockY = y + 8;
        const blockH = rowHeight - 16;
        if (items.length === 0) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(x + blockPadding, blockY, dayCol - blockPadding * 2, blockH);
          ctx.strokeStyle = '#e2e8f0';
          ctx.strokeRect(x + blockPadding, blockY, dayCol - blockPadding * 2, blockH);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '500 11px Montserrat, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Aucun cours', x + (dayCol / 2), blockY + (blockH / 2) + 4);
          ctx.textAlign = 'left';
          return;
        }

        const cardColor = this.getSubjectColor(items[0].subjectName);

        ctx.fillStyle = this.hexToRgba(cardColor, 0.12);
        ctx.fillRect(x + blockPadding, blockY, dayCol - blockPadding * 2, blockH);
        ctx.fillStyle = cardColor;
        ctx.fillRect(x + blockPadding, blockY, 4, blockH);

        const first = items[0];
        const contentWidth = dayCol - 34;
        const badgeText = slotLabel;
        const badgeX = x + dayCol - 18;
        const badgeY = blockY + 18;
        ctx.font = '700 10px Montserrat, Arial, sans-serif';
        const badgeW = Math.min(120, Math.max(54, ctx.measureText(badgeText).width + 16));
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(badgeX - badgeW, badgeY - 10, badgeW, 18);
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(this.truncateCanvasText(ctx, badgeText, badgeW - 10), badgeX - (badgeW / 2), badgeY + 3);
        ctx.textAlign = 'left';

        ctx.fillStyle = '#0f172a';
        ctx.font = '700 14px Montserrat, Arial, sans-serif';
        ctx.fillText(this.truncateCanvasText(ctx, first.subjectName, contentWidth - badgeW - 8), x + 18, blockY + 24);
        ctx.font = '500 12px Montserrat, Arial, sans-serif';
        ctx.fillStyle = '#334155';
        ctx.fillText(this.truncateCanvasText(ctx, `Enseignant : ${first.teacherName}`, contentWidth), x + 18, blockY + 54);
        ctx.fillText(this.truncateCanvasText(ctx, `Salle : ${first.roomName}`, contentWidth), x + 18, blockY + 78);
        if (items.length > 1) {
          ctx.fillStyle = '#7c2d12';
          ctx.font = '700 11px Montserrat, Arial, sans-serif';
          ctx.fillText(`+${items.length - 1} autre(s) cours`, x + 18, blockY + 100);
        }
      });
    });

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Impossible de générer l image'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    });
  }

  private hexToRgba(hex: string, alpha: number): string {
    const value = hex.replace('#', '').trim();
    const normalized = value.length === 3
      ? value.split('').map((c) => `${c}${c}`).join('')
      : value.padEnd(6, '0').slice(0, 6);
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  getSoftScoreExplanation(): string {
    const total = Math.max(1, this.totalAssignments || this.assignedAssignments || 1);
    const perCourse = Math.abs(this.softScore || 0) / total;
    let level = 'Très bon';
    if (perCourse > 6) {
      level = 'À améliorer';
    } else if (perCourse > 3) {
      level = 'Correct';
    }
    return `Niveau ${level} (${perCourse.toFixed(1)} pts/cours)`;
  }

  getNormalizedSoftScoreLabel(): string {
    const total = Math.max(1, this.totalAssignments || this.assignedAssignments || 1);
    const perCourse = (this.softScore || 0) / total;
    return `${perCourse.toFixed(1)} pts/cours`;
  }

  private getDefaultAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const start = now.getMonth() >= 7 ? year : year - 1;
    return `${start}-${start + 1}`;
  }
}
