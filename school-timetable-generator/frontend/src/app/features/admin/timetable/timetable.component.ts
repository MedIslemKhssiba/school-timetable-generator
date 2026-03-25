import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule, GridModule, ButtonDirective, BadgeModule, ProgressModule } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';
import { Lesson, Timeslot } from '../../../core/models';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { forkJoin } from 'rxjs';
import { Subscription } from 'rxjs';
import { TimetableSolveStateService } from '../../../core/services/timetable-solve-state.service';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, GridModule, ButtonDirective, BadgeModule, ProgressModule, SkeletonComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">{{ t('timetable') }}</h2>
        <p class="page-subtitle">{{ t('generate_manage_schedules') }}</p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <input #csvInput type="file" accept=".csv" class="d-none" (change)="onImportCsv($event)" />
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
        <button cButton color="secondary" variant="outline" (click)="csvInput.click()" [disabled]="solving">
          {{ t('import_csv') }}
        </button>
        <button cButton color="danger" class="pdf-export-btn" (click)="exportPdf()" [disabled]="lessons.length === 0">
          {{ t('export_pdf') }}
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
          </div>
        </c-card-body>
      </c-card>
    }

    @if (loading) {
      <ui-skeleton type="table" [count]="6" />
    } @else if (lessons.length > 0) {
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
                    <th class="time-col">{{ t('time') }}</th>
                    @for (day of days; track day) {
                      <th class="day-col">{{ formatDay(day) }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (slot of timeSlots; track slot) {
                    <tr>
                      <td class="time-cell">{{ slot }}</td>
                      @for (day of days; track day) {
                        <td class="grid-cell">
                          @for (lesson of getLessonAt(day, slot); track lesson.id) {
                            <div class="grid-lesson" [style.border-left-color]="getSubjectColor(lesson.subjectName)">
                              <div class="grid-subject">{{ lesson.subjectName }}</div>
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
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8D99A8; margin: 4px 0 0; font-family: 'Montserrat', sans-serif; }

    .solving-card { border-left: 4px solid #2563EB !important; }
    .solver-progress-text { font-size: 0.8rem; font-weight: 700; color: #2563EB; }
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
    .filter-group { display: flex; align-items: center; gap: 6px; }
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
      .time-col { width: 100px; }
      .time-cell { font-size: 0.75rem; font-weight: 600; color: #2563EB; white-space: nowrap; text-align: center; background: #F8FAFF; font-family: 'Montserrat', sans-serif; }
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
  `]
})
export class TimetableComponent implements OnInit, OnDestroy {
  lessons: Lesson[] = [];
  timeslots: Timeslot[] = [];
  filteredLessons: Lesson[] = [];
  solving = false;
  solveProgress = 0;
  loading = true;
  viewMode: 'grid' | 'cards' = 'grid';
  filterClass = '';
  filterTeacher = '';
  days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  timeSlots: string[] = [];
  classNames: string[] = [];
  teacherNames: string[] = [];
  private schoolId = 1;
  private subjectColors: Record<string, string> = {};
  private colorPalette = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#7C3AED', '#0EA5E9', '#EC4899', '#06B6D4', '#F97316', '#6366F1'];
  private stateSubscription?: Subscription;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private notify: NotificationService,
    private ts: TranslationService,
    private solveState: TimetableSolveStateService
  ) {
    this.schoolId = this.authService.getSchoolId() || 1;
  }

  t(key: string): string { return this.ts.t(key); }

  ngOnInit(): void {
    this.refresh();
    this.solveState.init(this.schoolId);
    this.stateSubscription = this.solveState.state$.subscribe(state => {
      this.solving = state.solving;
      this.solveProgress = state.progressPercent;

      if (state.lessons.length > 0) {
        this.lessons = state.lessons;
        this.buildMeta();
        this.applyFilter();
      }
    });
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  solve(): void {
    this.solveState.startSolve(this.schoolId).subscribe({
      next: () => {
        this.notify.info('Solving started! This may take a few minutes.');
      },
      error: () => {
        this.notify.error('Failed to start solving');
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
        this.notify.success('Timetable saved!');
        this.solveState.refreshFromServer();
        this.refresh();
      },
      error: () => this.notify.error('Failed to save timetable')
    });
  }

  refresh(): void {
    this.loading = true;
    forkJoin({
      lessons: this.adminService.getLessons(this.schoolId),
      timeslots: this.adminService.getTimeslots()
    }).subscribe({
      next: ({ lessons, timeslots }) => {
        this.lessons = lessons;
        this.timeslots = timeslots;
        this.buildMeta();
        this.applyFilter();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  exportExcel(): void {
    this.adminService.exportTimetable(this.schoolId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetable-school-${this.schoolId}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.notify.success('Excel exported');
    });
  }

  exportPdf(): void {
    this.adminService.exportTimetablePdf(this.schoolId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetable-school-${this.schoolId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.notify.success('PDF exported');
    });
  }

  onImportCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
      return;
    }

    this.adminService.importData(this.schoolId, file).subscribe({
      next: (messages) => {
        const message = messages && messages.length > 0 ? messages.join(' | ') : 'CSV imported';
        this.notify.success(message);
        this.refresh();
      },
      error: () => this.notify.error('Failed to import CSV')
    });

    input.value = '';
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
    return this.filteredLessons.filter(l => l.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  getLessonAt(day: string, slot: string): Lesson[] {
    return this.filteredLessons.filter(l => l.dayOfWeek === day && l.startTime === slot);
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

    this.timeslots.forEach(ts => {
      if (ts.startTime) {
        times.add(ts.startTime);
      }
      if (ts.dayOfWeek) {
        daysSet.add(ts.dayOfWeek);
      }
    });

    this.lessons.forEach(l => {
      times.add(l.startTime);
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

    this.timeSlots = [...times].sort();
    this.classNames = [...classes].sort();
    this.teacherNames = [...teachers].sort();
  }
}
