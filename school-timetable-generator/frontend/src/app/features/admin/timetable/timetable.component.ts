import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule, GridModule, ButtonDirective, BadgeModule, ProgressModule, AlertComponent } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Lesson } from '../../../core/models';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, CardModule, GridModule, ButtonDirective, BadgeModule, ProgressModule, AlertComponent],
  template: `
    <div class="page-header">
      <h2>Timetable</h2>
    </div>

    @if (msg) {
      <c-alert color="success" [dismissible]="true" (visibleChange)="msg=''">{{ msg }}</c-alert>
    }
    @if (errMsg) {
      <c-alert color="danger" [dismissible]="true" (visibleChange)="errMsg=''">{{ errMsg }}</c-alert>
    }

    <c-card class="mb-4">
      <c-card-body>
        <div class="d-flex flex-wrap gap-2">
          <button cButton color="primary" (click)="solve()" [disabled]="solving">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="me-1"><path d="M8 5v14l11-7z"/></svg>
            {{ solving ? 'Solving...' : 'Generate Timetable' }}
          </button>
          <button cButton color="danger" (click)="stop()" [disabled]="!solving">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="me-1"><path d="M6 6h12v12H6z"/></svg>
            Stop
          </button>
          <button cButton color="secondary" variant="outline" (click)="save()" [disabled]="solving || lessons.length === 0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="me-1"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
            Save
          </button>
          <button cButton color="light" (click)="refresh()">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="me-1"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
            Refresh
          </button>
          <button cButton color="success" (click)="exportExcel()" [disabled]="lessons.length === 0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="me-1"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            Export Excel
          </button>
        </div>
      </c-card-body>
    </c-card>

    @if (solving) {
      <c-card class="mb-4">
        <c-card-body>
          <c-progress [animated]="true" class="mb-2">
            <c-progress-bar color="primary" [value]="100"></c-progress-bar>
          </c-progress>
          <p class="solving-text mb-0">
            <svg class="spin me-2" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8A5.87 5.87 0 0 1 6 12c0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/></svg>
            AI solver is working...
          </p>
        </c-card-body>
      </c-card>
    }

    @if (lessons.length > 0) {
      <c-row>
        @for (day of days; track day) {
          <c-col lg="4" md="6" class="mb-4">
            <c-card class="h-100">
              <c-card-header class="day-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="me-2 opacity-75"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
                <span>{{ formatDay(day) }}</span>
                <c-badge color="light" textColor="dark" class="ms-auto">{{ getLessonsForDay(day).length }}</c-badge>
              </c-card-header>
              <c-card-body class="p-2">
                @for (lesson of getLessonsForDay(day); track lesson.id) {
                  <div class="lesson-slot">
                    <div class="lesson-time">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
                      {{ lesson.startTime }} - {{ lesson.endTime }}
                    </div>
                    <div class="lesson-subject">{{ lesson.subjectName }}</div>
                    <div class="lesson-details">
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                        {{ lesson.teacherName }}
                      </span>
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
                        {{ lesson.roomName }}
                      </span>
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                        {{ lesson.classGroupName }}
                      </span>
                    </div>
                  </div>
                } @empty {
                  <div class="text-center text-muted py-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" class="opacity-25 d-block mx-auto mb-1"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
                    <small>No lessons</small>
                  </div>
                }
              </c-card-body>
            </c-card>
          </c-col>
        }
      </c-row>
    } @else if (!solving) {
      <c-card>
        <c-card-body class="text-center py-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="currentColor" class="text-primary opacity-25 mb-3"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
          <h3>No Timetable Yet</h3>
          <p class="text-muted">Click "Generate Timetable" to start the AI solver and create an optimized schedule.</p>
        </c-card-body>
      </c-card>
    }
  `,
  styles: [`
    .day-header {
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, var(--cui-primary, #321fdb), var(--cui-info, #3399ff));
      color: white;
      font-weight: 600;
    }
    .lesson-slot {
      padding: 12px;
      margin: 6px;
      background: var(--cui-tertiary-bg, #f8f9fa);
      border-radius: 6px;
      border-left: 3px solid var(--cui-primary, #321fdb);
      transition: transform 0.15s;
    }
    .lesson-slot:hover { transform: translateX(4px); }
    .lesson-time {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; font-weight: 600;
      color: var(--cui-primary, #321fdb); margin-bottom: 4px;
    }
    .lesson-subject { font-weight: 600; font-size: 0.95rem; margin-bottom: 6px; }
    .lesson-details { display: flex; flex-direction: column; gap: 2px; }
    .lesson-details span { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: var(--cui-text-secondary); }
    .solving-text { display: flex; align-items: center; color: var(--cui-primary, #321fdb); font-weight: 500; font-size: 0.9rem; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }
  `]
})
export class TimetableComponent implements OnInit {
  lessons: Lesson[] = [];
  solving = false;
  msg = ''; errMsg = '';
  days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  private schoolId = 1;

  constructor(private adminService: AdminService, private authService: AuthService) {
    this.schoolId = this.authService.getSchoolId() || 1;
  }

  ngOnInit(): void { this.refresh(); }

  solve(): void {
    this.solving = true;
    this.adminService.solveTimetable(this.schoolId, {}).subscribe({
      next: () => this.msg = 'Solving started! This may take a few minutes.',
      error: () => { this.solving = false; this.errMsg = 'Failed to start solving'; }
    });
  }

  stop(): void {
    this.adminService.stopSolving(this.schoolId).subscribe(() => {
      this.solving = false;
      this.msg = 'Solving stopped';
      this.refresh();
    });
  }

  save(): void {
    this.adminService.saveTimetable(this.schoolId).subscribe({
      next: (lessons) => {
        this.lessons = lessons as any;
        this.msg = 'Timetable saved successfully!';
        this.refresh();
      },
      error: () => this.errMsg = 'Failed to save timetable'
    });
  }

  refresh(): void {
    this.adminService.getLessons(this.schoolId).subscribe(l => this.lessons = l);
  }

  exportExcel(): void {
    this.adminService.exportTimetable(this.schoolId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetable-school-${this.schoolId}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  formatDay(day: string): string {
    return day.charAt(0) + day.slice(1).toLowerCase();
  }

  getLessonsForDay(day: string): Lesson[] {
    return this.lessons.filter(l => l.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
}
