import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule, GridModule, ButtonDirective, BadgeModule, ProgressModule } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Lesson } from '../../../core/models';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, GridModule, ButtonDirective, BadgeModule, ProgressModule, SkeletonComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">Timetable</h2>
        <p class="page-subtitle">Generate and manage optimized schedules</p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <button cButton color="primary" (click)="solve()" [disabled]="solving">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-1"><path d="M8 5v14l11-7z"/></svg>
          {{ solving ? 'Solving...' : 'Generate' }}
        </button>
        <button cButton color="danger" variant="outline" (click)="stop()" [disabled]="!solving">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-1"><path d="M6 6h12v12H6z"/></svg>
          Stop
        </button>
        <button cButton color="secondary" variant="outline" (click)="save()" [disabled]="solving || lessons.length === 0">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-1"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
          Save
        </button>
        <button cButton color="light" (click)="refresh()">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-1"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          Refresh
        </button>
        <button cButton color="success" variant="outline" (click)="exportExcel()" [disabled]="lessons.length === 0">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-1"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          Export
        </button>
      </div>
    </div>

    @if (solving) {
      <c-card class="mb-4 solving-card">
        <c-card-body class="d-flex align-items-center gap-3">
          <div class="spinner"></div>
          <div class="flex-grow-1">
            <div class="fw-semibold mb-1">AI solver is working...</div>
            <c-progress [animated]="true" style="height: 6px">
              <c-progress-bar color="primary" [value]="100"></c-progress-bar>
            </c-progress>
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
              <label class="filter-label">View by:</label>
              <select class="filter-select" [(ngModel)]="viewMode">
                <option value="grid">Grid View</option>
                <option value="cards">Card View</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Filter class:</label>
              <select class="filter-select" [(ngModel)]="filterClass" (ngModelChange)="applyFilter()">
                <option value="">All Classes</option>
                @for (c of classNames; track c) {
                  <option [value]="c">{{ c }}</option>
                }
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">Filter teacher:</label>
              <select class="filter-select" [(ngModel)]="filterTeacher" (ngModelChange)="applyFilter()">
                <option value="">All Teachers</option>
                @for (t of teacherNames; track t) {
                  <option [value]="t">{{ t }}</option>
                }
              </select>
            </div>
            <c-badge color="primary" class="ms-auto">{{ filteredLessons.length }} lessons</c-badge>
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
                    <th class="time-col">Time</th>
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
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-2 opacity-75"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
                  <span>{{ formatDay(day) }}</span>
                  <c-badge color="light" textColor="dark" class="ms-auto">{{ getFilteredLessonsForDay(day).length }}</c-badge>
                </c-card-header>
                <c-card-body class="p-2">
                  @for (lesson of getFilteredLessonsForDay(day); track lesson.id) {
                    <div class="lesson-slot" [style.border-left-color]="getSubjectColor(lesson.subjectName)">
                      <div class="lesson-time">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
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
                    <div class="text-center text-muted py-4"><small>No lessons</small></div>
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
          <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" class="text-primary opacity-25 mb-3"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
          <h3 class="fw-bold mb-2">No Timetable Yet</h3>
          <p class="text-muted mb-0">Click "Generate" to start the AI solver and create an optimized schedule.</p>
        </c-card-body>
      </c-card>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #1A2236; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8892A4; margin: 4px 0 0; }

    .solving-card { border-left: 4px solid #1565C0 !important; }
    .spinner {
      width: 28px; height: 28px; border: 3px solid #E3F2FD;
      border-top-color: #1565C0; border-radius: 50%;
      animation: spin 0.8s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .filter-bar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .filter-group { display: flex; align-items: center; gap: 6px; }
    .filter-label { font-size: 0.8rem; font-weight: 600; color: #8892A4; white-space: nowrap; }
    .filter-select {
      font-size: 0.85rem; padding: 4px 10px; border: 1px solid #E2E8F0;
      border-radius: 8px; background: white; outline: none;
      &:focus { border-color: #1565C0; }
    }

    .timetable-grid-wrapper { overflow-x: auto; }
    .timetable-grid {
      width: 100%; border-collapse: collapse; min-width: 800px;
      th, td { padding: 8px 10px; border: 1px solid #E2E8F0; vertical-align: top; }
      thead th {
        background: #F8FAFC; font-size: 0.8rem; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.04em; color: #1A2236; text-align: center;
      }
      .time-col { width: 100px; }
      .time-cell { font-size: 0.75rem; font-weight: 600; color: #1565C0; white-space: nowrap; text-align: center; background: #FAFBFE; }
      .grid-cell { min-height: 60px; }
    }
    .grid-lesson {
      padding: 6px 8px; margin-bottom: 4px; border-radius: 6px;
      border-left: 3px solid #1565C0; background: #F8FAFD;
      font-size: 0.75rem; transition: transform 150ms;
      &:hover { transform: scale(1.02); }
      &:last-child { margin-bottom: 0; }
    }
    .grid-subject { font-weight: 700; color: #1A2236; margin-bottom: 2px; }
    .grid-meta { color: #8892A4; }

    .day-header {
      display: flex; align-items: center;
      background: linear-gradient(135deg, #1565C0, #42A5F5);
      color: white; font-weight: 600;
    }
    .lesson-slot {
      padding: 12px; margin: 6px; background: #f8fafd;
      border-radius: 8px; border-left: 3px solid #1565C0;
      transition: transform 0.15s, box-shadow 0.15s;
      &:hover { transform: translateX(4px); box-shadow: 0 2px 8px rgba(21,101,192,0.1); }
    }
    .lesson-time {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; font-weight: 600; color: #1565C0; margin-bottom: 4px;
    }
    .lesson-subject { font-weight: 700; font-size: 0.95rem; margin-bottom: 6px; color: #1A2236; }
    .lesson-details { display: flex; flex-direction: column; gap: 2px; }
    .lesson-details span { font-size: 0.78rem; color: #8892A4; }
  `]
})
export class TimetableComponent implements OnInit {
  lessons: Lesson[] = [];
  filteredLessons: Lesson[] = [];
  solving = false;
  loading = true;
  viewMode: 'grid' | 'cards' = 'grid';
  filterClass = '';
  filterTeacher = '';
  days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  timeSlots: string[] = [];
  classNames: string[] = [];
  teacherNames: string[] = [];
  private schoolId = 1;
  private subjectColors: Record<string, string> = {};
  private colorPalette = ['#1565C0', '#2E7D32', '#F57F17', '#D32F2F', '#7B1FA2', '#0277BD', '#C2185B', '#00838F', '#FF6F00', '#3f51b5'];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private notify: NotificationService
  ) {
    this.schoolId = this.authService.getSchoolId() || 1;
  }

  ngOnInit(): void { this.refresh(); }

  solve(): void {
    this.solving = true;
    this.adminService.solveTimetable(this.schoolId, {}).subscribe({
      next: () => this.notify.info('Solving started! This may take a few minutes.'),
      error: () => { this.solving = false; this.notify.error('Failed to start solving'); }
    });
  }

  stop(): void {
    this.adminService.stopSolving(this.schoolId).subscribe({
      next: () => { this.solving = false; this.notify.info('Solving stopped'); this.refresh(); },
      error: () => this.notify.error('Failed to stop solving')
    });
  }

  save(): void {
    this.adminService.saveTimetable(this.schoolId).subscribe({
      next: () => { this.notify.success('Timetable saved!'); this.refresh(); },
      error: () => this.notify.error('Failed to save timetable')
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
    return day.charAt(0) + day.slice(1).toLowerCase();
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
