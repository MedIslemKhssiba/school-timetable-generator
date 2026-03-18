import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule, GridModule, ButtonDirective, BadgeModule, ProgressModule } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';
import { Lesson } from '../../../core/models';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';

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
        <button cButton color="primary" (click)="solve()" [disabled]="solving">
          {{ solving ? t('solving') : t('generate') }}
        </button>
        <button cButton color="danger" variant="outline" (click)="stop()" [disabled]="!solving">
          {{ t('stop') }}
        </button>
        <button cButton color="secondary" variant="outline" (click)="save()" [disabled]="solving || lessons.length === 0">
          {{ t('save') }}
        </button>
        <button cButton color="success" (click)="share()" [disabled]="solving || lessons.length === 0">
          Share to Teachers
        </button>
        <button cButton color="success" variant="outline" (click)="exportExcel()" [disabled]="lessons.length === 0">
          {{ t('export') }}
        </button>
      </div>
    </div>

    @if (solving) {
      <c-card class="mb-4 solving-card">
        <c-card-body class="d-flex align-items-center gap-3">
          <div class="spinner"></div>
          <div class="flex-grow-1">
            <div class="fw-semibold mb-1">{{ solvingMessage }}</div>
            <c-progress [animated]="true" style="height: 6px">
              <c-progress-bar color="primary" [value]="solverProgress"></c-progress-bar>
            </c-progress>
            <div class="solver-hint mt-2">{{ solverProgress }}% • {{ t('ai_solver_working') }}</div>
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
    .spinner {
      width: 28px; height: 28px; border: 3px solid rgba(37, 99, 235,0.15);
      border-top-color: #2563EB; border-radius: 50%;
      animation: spin 0.8s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .solver-hint { font-size: 0.75rem; color: #8D99A8; font-family: 'Montserrat', sans-serif; }

    .filter-bar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
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
  filteredLessons: Lesson[] = [];
  solving = false;
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
  private pollInterval: any;
  private progressInterval: any;
  solverProgress = 5;
  solvingMessage = 'AI solver is analyzing timetable constraints...';

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private notify: NotificationService,
    private ts: TranslationService
  ) {
    this.schoolId = this.authService.getSchoolId() || 1;
  }

  t(key: string): string { return this.ts.t(key); }

  ngOnInit(): void {
    this.refresh();
    this.checkSolveStatus();
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.stopProgressAnimation();
  }

  solve(): void {
    this.solving = true;
    this.startProgressAnimation();
    this.adminService.solveTimetable(this.schoolId, {}).subscribe({
      next: () => {
        this.notify.info('Solving started! This may take a few minutes.');
        this.startPolling();
      },
      error: () => {
        this.solving = false;
        this.stopProgressAnimation();
        this.notify.error('Failed to start solving');
      }
    });
  }

  stop(): void {
    this.adminService.stopSolving(this.schoolId).subscribe({
      next: () => { this.solving = false; this.stopPolling(); this.stopProgressAnimation(); this.notify.info('Solving stopped'); this.pollSolution(); },
      error: () => this.notify.error('Failed to stop solving')
    });
  }

  private checkSolveStatus(): void {
    this.adminService.getSolveStatus(this.schoolId).subscribe({
      next: ({ status }) => {
        this.solving = status !== 'NOT_SOLVING';
        if (this.solving) {
          this.startProgressAnimation();
          this.startPolling();
          this.pollSolution();
        }
      },
      error: () => {}
    });
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => this.pollSolution(), 3000);
  }

  private stopPolling(): void {
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
  }

  private pollSolution(): void {
    this.adminService.getSolution(this.schoolId).subscribe({
      next: (solution: any) => {
        if (solution && solution.lessonAssignments) {
          this.lessons = solution.lessonAssignments
            .filter((la: any) => la.timeslot && la.room)
            .map((la: any, i: number) => ({
              id: la.id || i,
              subjectName: la.subject?.name || '',
              teacherName: la.teacher ? `${la.teacher.firstName} ${la.teacher.lastName}` : '',
              classGroupName: la.classGroup?.name || '',
              roomName: la.room?.name || '',
              roomId: la.room?.id,
              timeslotId: la.timeslot?.id,
              dayOfWeek: la.timeslot?.dayOfWeek || '',
              startTime: la.timeslot?.startTime || '',
              endTime: la.timeslot?.endTime || ''
            }));
          this.buildMeta();
          this.applyFilter();
        }
      },
      error: () => {}
    });

    this.adminService.getSolveStatus(this.schoolId).subscribe({
      next: ({ status }) => {
        const wasSolving = this.solving;
        this.solving = status !== 'NOT_SOLVING';
        if (wasSolving && !this.solving) {
          this.stopProgressAnimation();
          this.stopPolling();
          this.notify.success('Generation completed successfully');
        }
        if (!wasSolving && this.solving) {
          this.startProgressAnimation();
        }
      }
    });
  }

  private startProgressAnimation(): void {
    this.stopProgressAnimation();
    this.solverProgress = 8;
    this.solvingMessage = 'AI solver is analyzing timetable constraints...';
    this.progressInterval = setInterval(() => {
      if (!this.solving) return;
      if (this.solverProgress < 92) {
        this.solverProgress += this.solverProgress < 60 ? 5 : 2;
      }

      if (this.solverProgress < 35) {
        this.solvingMessage = 'AI solver is analyzing timetable constraints...';
      } else if (this.solverProgress < 70) {
        this.solvingMessage = 'AI solver is assigning teachers and rooms...';
      } else {
        this.solvingMessage = 'AI solver is optimizing final schedule quality...';
      }
    }, 1200);
  }

  private stopProgressAnimation(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.solverProgress = 100;
    this.solvingMessage = 'AI solver finished.';
  }

  save(): void {
    this.adminService.saveTimetable(this.schoolId).subscribe({
      next: () => { this.notify.success('Timetable saved!'); this.refresh(); },
      error: () => this.notify.error('Failed to save timetable')
    });
  }

  share(): void {
    this.adminService.shareTimetable(this.schoolId).subscribe({
      next: (lessons) => {
        this.notify.success(`Shared ${lessons.length} lessons with teachers`);
        this.refresh();
      },
      error: () => this.notify.error('Failed to share timetable with teachers')
    });
  }

  refresh(): void {
    this.adminService.getLessons(this.schoolId).subscribe({
      next: l => {
        this.lessons = l;
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
    const times = new Set<string>();
    const classes = new Set<string>();
    const teachers = new Set<string>();
    this.lessons.forEach(l => {
      times.add(l.startTime);
      classes.add(l.classGroupName);
      teachers.add(l.teacherName);
    });
    this.timeSlots = [...times].sort();
    this.classNames = [...classes].sort();
    this.teacherNames = [...teachers].sort();
  }
}
