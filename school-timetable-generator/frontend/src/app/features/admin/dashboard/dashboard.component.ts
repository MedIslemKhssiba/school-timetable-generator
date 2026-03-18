import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CardModule, GridModule, ButtonDirective } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { Lesson } from '../../../core/models';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { Subscription, interval, switchMap } from 'rxjs';

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

          <c-card>
            <c-card-header class="d-flex justify-content-between align-items-center">
              <strong>Saved Timetable</strong>
              <button cButton color="primary" size="sm" variant="outline" routerLink="../timetable">Open Timetable</button>
            </c-card-header>
            <c-card-body class="p-0">
              @if (savedLessons.length === 0) {
                <div class="text-center text-muted py-4">No saved timetable yet.</div>
              } @else {
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Time</th>
                        <th>Class</th>
                        <th>Subject</th>
                        <th>Teacher</th>
                        <th>Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (lesson of previewLessons; track lesson.id) {
                        <tr>
                          <td>{{ formatDay(lesson.dayOfWeek) }}</td>
                          <td>{{ lesson.startTime }} - {{ lesson.endTime }}</td>
                          <td>{{ lesson.classGroupName }}</td>
                          <td>{{ lesson.subjectName }}</td>
                          <td>{{ lesson.teacherName }}</td>
                          <td>{{ lesson.roomName }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
                @if (savedLessons.length > previewLessons.length) {
                  <div class="px-3 py-2 text-muted small">Showing {{ previewLessons.length }} of {{ savedLessons.length }} saved lessons.</div>
                }
              }
            </c-card-body>
          </c-card>
        </c-col>
        <c-col lg="4">
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
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats: Record<string, number> = {};
  savedLessons: Lesson[] = [];
  userName = '';
  loading = true;
  private schoolId = 1;
  private pollSub?: Subscription;

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

  statCards = [
    { key: 'totalTeachers', label: 'Teachers', color: 'primary', route: '../teachers', icon: this.icons.teachers },
    { key: 'totalClasses', label: 'Classes', color: 'info', route: '../classes', icon: this.icons.classes },
    { key: 'totalSubjects', label: 'Subjects', color: 'warning', route: '../subjects', icon: this.icons.subjects },
    { key: 'totalRooms', label: 'Rooms', color: 'success', route: '../rooms', icon: this.icons.rooms }
  ];

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private ts: TranslationService,
    private sanitizer: DomSanitizer
  ) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.authService.currentUser$.subscribe(u => {
      if (u) this.userName = u.firstName;
    });
  }

  t(key: string): string { return this.ts.t(key); }

  get previewLessons(): Lesson[] {
    return this.savedLessons.slice(0, 12);
  }

  formatDay(day: string): string {
    return this.t(day);
  }

  ngOnInit(): void {
    this.adminService.getDashboard(this.schoolId).subscribe({
      next: s => { this.stats = s; this.loading = false; },
      error: () => this.loading = false
    });
    this.loadSavedLessons();

    this.pollSub = interval(30000).pipe(
      switchMap(() => this.adminService.getDashboard(this.schoolId))
    ).subscribe(s => this.stats = s);
  }

  private loadSavedLessons(): void {
    this.adminService.getLessons(this.schoolId).subscribe({
      next: lessons => {
        this.savedLessons = [...lessons].sort((a, b) => {
          const dayCompare = a.dayOfWeek.localeCompare(b.dayOfWeek);
          if (dayCompare !== 0) return dayCompare;
          return a.startTime.localeCompare(b.startTime);
        });
      },
      error: () => { this.savedLessons = []; }
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}
