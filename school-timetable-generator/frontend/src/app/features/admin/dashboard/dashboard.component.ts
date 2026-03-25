import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CardModule, GridModule, ButtonDirective } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { Subscription, forkJoin, interval, switchMap } from 'rxjs';
import { AdminDashboardStats, Lesson, Timeslot } from '../../../core/models';

type DashboardStatKey = 'totalTeachers' | 'totalClasses' | 'totalSubjects' | 'totalRooms' | 'totalLessons';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, GridModule, ButtonDirective, SkeletonComponent],
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
          <a class="stat-card" [routerLink]="stat.route">
            <div class="stat-icon-wrapper" [class]="'stat-icon-' + stat.color">
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
        <c-col lg="8">
          <c-card class="welcome-card mb-4">
            <c-card-body>
              <div class="d-flex align-items-start gap-3 flex-wrap">
                <div class="flex-grow-1">
                  <h5 class="fw-bold mb-1">{{ t('welcome_back_name') }}, {{ userName }}!</h5>
                  <p class="text-body-secondary mb-3" style="max-width:520px">
                    Manage your school resources and generate optimized timetables. Add teachers, classes, subjects, and rooms to get started.
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

          <c-card class="mb-4" *ngIf="lessons.length > 0">
            <c-card-header class="d-flex align-items-center justify-content-between">
              <strong>Saved Timetable</strong>
              <span class="text-body-secondary small">{{ lessons.length }} lessons</span>
            </c-card-header>
            <c-card-body class="p-0">
              <div class="timetable-grid-wrapper">
                <table class="timetable-grid">
                  <thead>
                    <tr>
                      <th class="time-col">{{ t('time') }}</th>
                      @for (day of days; track day) {
                        <th>{{ t(day) }}</th>
                      }
                    </tr>
                  </thead>
                  <tbody>
                    @for (slot of timeSlots; track slot) {
                      <tr>
                        <td class="time-cell">{{ slot }}</td>
                        @for (day of days; track day) {
                          <td>
                            @for (lesson of getLessonAt(day, slot); track lesson.id) {
                              <div class="grid-lesson" [style.border-left-color]="getSubjectColor(lesson.subjectName)">
                                <div class="grid-subject">{{ lesson.subjectName }}</div>
                                <div class="grid-meta">{{ lesson.classGroupName }}</div>
                                <div class="grid-meta">{{ lesson.teacherName }} · {{ lesson.roomName }}</div>
                              </div>
                            } @empty {
                              <span class="empty-cell">—</span>
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
        </c-col>
        <c-col lg="4">
          <c-card class="quick-card mb-4">
            <c-card-header><strong>Timetable Status</strong></c-card-header>
            <c-card-body>
              <input #csvInput type="file" accept=".csv" class="d-none" (change)="onImportCsv($event)" />
              <div class="status-row mb-2">
                <span class="status-label">Saved lessons</span>
                <strong>{{ stats.totalLessons || 0 }}</strong>
              </div>
              <div class="status-row mb-2">
                <span class="status-label">Last saved</span>
                <strong>{{ formatDateTime(stats.timetableSavedAt) }}</strong>
              </div>
              <div class="status-row mb-3">
                <span class="status-label">Sent to teachers</span>
                <strong>{{ stats.timetableSent ? 'Yes' : 'No' }}</strong>
              </div>
              @if (stats.timetableSentAt) {
                <div class="status-row mb-3">
                  <span class="status-label">Last sent</span>
                  <strong>{{ formatDateTime(stats.timetableSentAt) }}</strong>
                </div>
              }
              <button cButton color="secondary" variant="outline" class="w-100 mb-2" (click)="csvInput.click()">
                {{ t('import_csv') }}
              </button>
              <button cButton color="danger" class="w-100 mb-2" [disabled]="!stats.totalLessons" (click)="exportPdf()">
                {{ t('export_pdf') }}
              </button>
              <button cButton color="primary" class="w-100" (click)="sendToTeachers()" [disabled]="sending || !stats.totalLessons">
                {{ sending ? 'Sending...' : 'Send Timetable To Teachers' }}
              </button>
            </c-card-body>
          </c-card>

          <c-card class="quick-card mb-4">
            <c-card-header><strong>{{ t('quick_actions') }}</strong></c-card-header>
            <c-card-body class="p-0">
              <a class="quick-link" routerLink="../teachers">
                <span class="quick-icon" [innerHTML]="icons.teachers"></span>
                <div class="flex-grow-1"><div class="quick-title">{{ t('teachers') }}</div><div class="quick-desc">{{ t('manage_teaching_staff') }}</div></div>
              </a>
              <a class="quick-link" routerLink="../classes">
                <span class="quick-icon" [innerHTML]="icons.classes"></span>
                <div class="flex-grow-1"><div class="quick-title">{{ t('classes') }}</div><div class="quick-desc">{{ t('manage_class_groups') }}</div></div>
              </a>
              <a class="quick-link" routerLink="../subjects">
                <span class="quick-icon" [innerHTML]="icons.subjects"></span>
                <div class="flex-grow-1"><div class="quick-title">{{ t('subjects') }}</div><div class="quick-desc">{{ t('manage_curriculum') }}</div></div>
              </a>
              <a class="quick-link" routerLink="../rooms">
                <span class="quick-icon" [innerHTML]="icons.rooms"></span>
                <div class="flex-grow-1"><div class="quick-title">{{ t('rooms') }}</div><div class="quick-desc">{{ t('manage_classrooms') }}</div></div>
              </a>
            </c-card-body>
          </c-card>
        </c-col>
      </c-row>
    }
  `,
  styles: [`
    .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8D99A8; margin: 4px 0 0; font-family: 'Montserrat', sans-serif; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .stat-card {
      background: #F8FAFF; border-radius: 14px; padding: 22px 24px;
      display: flex; align-items: center; gap: 16px;
      border: 1px solid #DDE3EE; box-shadow: 0 2px 8px rgba(13, 27, 62,0.05);
      cursor: pointer; transition: all 250ms; text-decoration: none; color: inherit;
    }
    .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(13, 27, 62,0.1); }
    .stat-icon-wrapper {
      width: 56px; height: 56px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .stat-icon { display: inline-flex; color: #fff; }
    .stat-icon :deep(svg) { width: 22px; height: 22px; stroke: currentColor; fill: none; }
    .stat-icon-primary { background: #2563EB; }
    .stat-icon-info    { background: #4A7C8A; }
    .stat-icon-warning { background: #D4A03C; }
    .stat-icon-success { background: #6B9080; }
    .stat-content { flex: 1; }
    .stat-value { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; line-height: 1; }
    .stat-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #8D99A8; margin-top: 4px; font-family: 'Montserrat', sans-serif; }

    .welcome-card { border-left: 4px solid #2563EB !important; }

    .quick-link {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 20px; text-decoration: none; color: inherit;
      border-bottom: 1px solid #EAEEF6; transition: background 200ms; cursor: pointer;
      &:hover { background: #F0F4FA; }
      &:last-child { border-bottom: none; }
    }
    .quick-icon {
      width: 32px; height: 32px; border-radius: 10px; background: #EAEEF6;
      display: inline-flex; align-items: center; justify-content: center; color: #2563EB; flex-shrink: 0;
    }
    .quick-icon :deep(svg) { width: 16px; height: 16px; stroke: currentColor; fill: none; }
    .quick-title { font-weight: 600; font-size: 0.875rem; color: #1A2332; font-family: 'Montserrat', sans-serif; }
    .quick-desc  { font-size: 0.75rem; color: #8D99A8; font-family: 'Montserrat', sans-serif; }

    .status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 0.85rem;
    }

    .status-label {
      color: #8D99A8;
      font-weight: 600;
      font-family: 'Montserrat', sans-serif;
    }

    .timetable-grid-wrapper { overflow-x: auto; }
    .timetable-grid {
      width: 100%;
      border-collapse: collapse;
      min-width: 760px;
      th, td { border: 1px solid #DDE3EE; padding: 8px; vertical-align: top; }
      th { background: #F0F4FA; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; color: #1A2332; }
    }
    .time-col { width: 90px; }
    .time-cell { font-size: 0.75rem; font-weight: 600; color: #2563EB; background: #F8FAFF; text-align: center; }
    .grid-lesson {
      border-left: 3px solid #2563EB;
      border-radius: 6px;
      padding: 6px 8px;
      background: #F0F4FA;
      margin-bottom: 4px;
    }
    .grid-subject { font-size: 0.8rem; font-weight: 700; color: #1A2332; }
    .grid-meta { font-size: 0.72rem; color: #8D99A8; }
    .empty-cell { color: #B0BAC8; font-size: 0.85rem; }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats: AdminDashboardStats = {
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalRooms: 0,
    totalLessons: 0,
    timetableSent: false,
    timetableSavedAt: null,
    timetableSentAt: null
  };
  userName = '';
  loading = true;
  sending = false;
  lessons: Lesson[] = [];
  timeslots: Timeslot[] = [];
  days: string[] = [];
  timeSlots: string[] = [];
  private schoolId = 1;
  private pollSub?: Subscription;
  private readonly dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  private subjectColors: Record<string, string> = {};
  private readonly colorPalette = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#7C3AED', '#0EA5E9', '#EC4899', '#06B6D4', '#F97316', '#6366F1'];

  private icon(d: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
    );
  }

  icons = {
    teachers: this.icon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    classes: this.icon('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
    subjects: this.icon('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
    rooms: this.icon('<path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M9 21V9"/>')
  };

  statCards: Array<{ key: DashboardStatKey; label: string; color: string; route: string; icon: SafeHtml }> = [
    { key: 'totalTeachers', label: 'Teachers', color: 'primary', route: '../teachers', icon: this.icons.teachers },
    { key: 'totalClasses', label: 'Classes', color: 'info', route: '../classes', icon: this.icons.classes },
    { key: 'totalSubjects', label: 'Subjects', color: 'warning', route: '../subjects', icon: this.icons.subjects },
    { key: 'totalRooms', label: 'Rooms', color: 'success', route: '../rooms', icon: this.icons.rooms },
    { key: 'totalLessons', label: 'Saved Lessons', color: 'primary', route: '../timetable', icon: this.icons.subjects }
  ];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private ts: TranslationService,
    private sanitizer: DomSanitizer,
    private notify: NotificationService
  ) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.authService.currentUser$.subscribe(u => {
      if (u) this.userName = u.firstName;
    });
  }

  t(key: string): string { return this.ts.t(key); }

  ngOnInit(): void {
    this.loadDashboardAndTimetable();
    this.pollSub = interval(30000).pipe(
      switchMap(() => this.adminService.getDashboard(this.schoolId))
    ).subscribe(s => this.stats = s);
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  sendToTeachers(): void {
    if (!this.stats.totalLessons) {
      this.notify.warning('Save a timetable first before sending it to teachers.');
      return;
    }

    this.sending = true;
    this.adminService.sendTimetableToTeachers(this.schoolId).subscribe({
      next: () => {
        this.notify.success('Timetable sent to teachers successfully.');
        this.loadDashboardAndTimetable();
        this.sending = false;
      },
      error: () => {
        this.notify.error('Failed to send timetable to teachers.');
        this.sending = false;
      }
    });
  }

  formatDateTime(value?: string | null): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  onImportCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
      return;
    }

    this.adminService.importData(this.schoolId, file).subscribe({
      next: (messages) => {
        this.notify.success(messages?.join(' | ') || 'CSV imported');
        this.loadDashboardAndTimetable();
      },
      error: () => this.notify.error('Failed to import CSV')
    });

    input.value = '';
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

  getLessonAt(day: string, slot: string): Lesson[] {
    return this.lessons.filter(lesson => lesson.dayOfWeek === day && lesson.startTime === slot);
  }

  getSubjectColor(name: string): string {
    if (!this.subjectColors[name]) {
      const idx = Object.keys(this.subjectColors).length % this.colorPalette.length;
      this.subjectColors[name] = this.colorPalette[idx];
    }
    return this.subjectColors[name];
  }

  private loadDashboardAndTimetable(): void {
    forkJoin({
      stats: this.adminService.getDashboard(this.schoolId),
      lessons: this.adminService.getLessons(this.schoolId),
      timeslots: this.adminService.getTimeslots()
    }).subscribe({
      next: ({ stats, lessons, timeslots }) => {
        this.stats = stats;
        this.lessons = lessons;
        this.timeslots = timeslots;
        this.buildTimetableMeta();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  private buildTimetableMeta(): void {
    const daySet = new Set<string>();
    const timeSet = new Set<string>();

    this.timeslots.forEach(slot => {
      if (slot.dayOfWeek) {
        daySet.add(slot.dayOfWeek);
      }
      if (slot.startTime) {
        timeSet.add(slot.startTime);
      }
    });

    this.lessons.forEach(lesson => {
      if (lesson.dayOfWeek) {
        daySet.add(lesson.dayOfWeek);
      }
      if (lesson.startTime) {
        timeSet.add(lesson.startTime);
      }
    });

    this.days = [...daySet].sort((a, b) => this.dayOrder.indexOf(a) - this.dayOrder.indexOf(b));
    this.timeSlots = [...timeSet].sort();
  }
}
