import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CardModule, GridModule, ButtonDirective } from '@coreui/angular';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { Lesson } from '../../../core/models';
import { environment } from '@env/environment';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { Subscription, interval, switchMap } from 'rxjs';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, GridModule, ButtonDirective, SkeletonComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">{{ t('dashboard') }}</h2>
        <p class="page-subtitle">{{ t('teaching_overview') }}</p>
      </div>
    </div>

    @if (loading) {
      <ui-skeleton type="cards" [count]="5" />
    } @else {
      <div class="stats-grid mb-4">
        @for (stat of statCards; track stat.key) {
          <a [routerLink]="stat.route" class="stat-card" [ngClass]="'stat-' + stat.color">
            <div class="stat-icon-wrap">
              <span class="stat-icon" [innerHTML]="stat.icon"></span>
            </div>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </a>
        }
      </div>
    }

    <c-row>
      <c-col lg="12" class="mb-4">
        <c-card class="welcome-card h-100">
          <c-card-body>
            <div class="d-flex align-items-start gap-3 flex-wrap">
              <div class="flex-grow-1">
                <h5 class="fw-bold mb-1">{{ t('welcome_back_name') }}, {{ userName }}!</h5>
                <p class="text-body-secondary mb-3" style="max-width:520px">
                  {{ t('welcome_back_msg_teacher') }}
                </p>
                <div class="d-flex gap-2 flex-wrap">
                  <button cButton color="primary" routerLink="../schedule">
                    {{ t('view_schedule') }}
                  </button>
                  <button cButton color="info" variant="outline" routerLink="../availability">
                    {{ t('set_availability') }}
                  </button>
                </div>
              </div>
            </div>
          </c-card-body>
        </c-card>
      </c-col>
    </c-row>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8D99A8; margin: 4px 0 0; font-family: 'Montserrat', sans-serif; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(185px, 1fr)); gap: 14px; }
    .stat-card {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 24px 16px; border-radius: 18px; background: linear-gradient(165deg, #ffffff 0%, #f4f8ff 100%); text-decoration: none;
      border: 1px solid rgba(183, 200, 226, 0.5); border-left: 4px solid transparent;
      transition: transform 250ms, box-shadow 250ms; cursor: pointer;
      box-shadow: 0 10px 24px rgba(15, 23, 42,0.08);
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
    .stat-primary { border-left-color: #2563EB; }
    .stat-info { border-left-color: #4A7C8A; }
    .stat-success { border-left-color: #6B9080; }
    .stat-icon-wrap {
      width: 52px; height: 52px; border-radius: 12px;
      display: none; align-items: center; justify-content: center;
      background: transparent;
    }
    .stat-icon { color: #2563EB; display: inline-flex; }
    .stat-icon :deep(svg) { width: 20px; height: 20px; fill: currentColor; stroke: none; }
    .stat-primary .stat-icon-wrap { color: #2563EB; }
    .stat-info .stat-icon-wrap { color: #0284C7; }
    .stat-success .stat-icon-wrap { color: #059669; }
    .stat-warning .stat-icon-wrap { color: #D97706; }
    .stat-dark .stat-icon-wrap { color: #334155; }
    .stat-value { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; line-height: 1; }
    .stat-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #8D99A8; font-family: 'Montserrat', sans-serif; }

    .welcome-card {
      border: 1px solid rgba(37, 99, 235, 0.2) !important;
      background: linear-gradient(140deg, rgba(255,255,255,0.95), rgba(239,246,255,0.92)) !important;
      box-shadow: 0 18px 30px rgba(37, 99, 235, 0.1) !important;
    }

  `]
})
export class TeacherDashboardComponent implements OnInit, OnDestroy {
  totalLessons = 0;
  subjects = new Set<string>();
  classes = new Set<string>();
  teachingHours = 0;
  activeDays = 0;
  busiestDayLessons = 0;
  userName = '';
  loading = true;
  private pollSub?: Subscription;

  private icon(d: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">${d}</svg>`
    );
  }

  private readonly icons = {
    lessons: this.icon('<path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm12 8H5v10h14V10Z"/>'),
    subjects: this.icon('<path d="M9 2a2 2 0 0 0-2 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1a2 2 0 0 0-2-2H9Zm1 7h6v2h-6V9Zm0 4h6v2h-6v-2Z"/>'),
    classes: this.icon('<path d="M6 4a3 3 0 0 0-3 3v11a2 2 0 0 0 2 2h14v-2H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h13V4H6Z"/><path d="M19 8H8a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11V8Z"/>'),
    hours: this.icon('<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 5a1 1 0 0 0-2 0v5.586l3.707 3.707a1 1 0 0 0 1.414-1.414L13 11.586V7Z"/>'),
    days: this.icon('<path d="M4 20h16v2H2V4h2v16Zm2-1v-6h3v6H6Zm5 0V8h3v11h-3Zm5 0V4h3v15h-3Z"/>')
  };

  statCards: Array<{ key: string; value: number; label: string; color: string; route: string; icon: SafeHtml }> = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private ts: TranslationService,
    private sanitizer: DomSanitizer
  ) {
    this.authService.currentUser$.subscribe(u => {
      if (u) this.userName = `${u.firstName} ${u.lastName}`;
    });
  }

  t(key: string): string { return this.ts.t(key); }

  private loadStats(): void {
    this.http.get<Lesson[]>(`${environment.apiUrl}/teacher/schedule`).subscribe({
      next: lessons => {
        this.totalLessons = lessons.length;
        this.subjects.clear();
        this.classes.clear();
        this.teachingHours = 0;
        const lessonsByDay = new Map<string, number>();

        lessons.forEach(l => {
          this.subjects.add(l.subjectName);
          this.classes.add(l.classGroupName);

          const start = this.timeToMinutes(l.startTime);
          const end = this.timeToMinutes(l.endTime);
          if (start !== null && end !== null && end > start) {
            this.teachingHours += (end - start) / 60;
          }

          const day = l.dayOfWeek || 'UNKNOWN';
          lessonsByDay.set(day, (lessonsByDay.get(day) ?? 0) + 1);
        });

        this.activeDays = lessonsByDay.size;
        this.busiestDayLessons = Math.max(0, ...Array.from(lessonsByDay.values()));
        this.statCards = [
          { key: 'weeklyLessons', value: this.totalLessons, label: this.t('weekly_lessons'), color: 'primary', route: '../schedule', icon: this.icons.lessons },
          { key: 'subjects', value: this.subjects.size, label: this.t('subjects'), color: 'info', route: '../schedule', icon: this.icons.subjects },
          { key: 'classes', value: this.classes.size, label: this.t('classes'), color: 'success', route: '../schedule', icon: this.icons.classes },
          { key: 'hours', value: Number(this.teachingHours.toFixed(1)), label: this.t('teaching_hours'), color: 'warning', route: '../schedule', icon: this.icons.hours },
          { key: 'dayLoad', value: this.busiestDayLessons, label: this.t('busiest_day_load'), color: 'dark', route: '../schedule', icon: this.icons.days }
        ];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  ngOnInit(): void {
    this.loadStats();
    this.pollSub = interval(30000).subscribe(() => this.loadStats());
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  private timeToMinutes(value: string): number | null {
    if (!value) {
      return null;
    }
    const parts = value.split(':');
    if (parts.length < 2) {
      return null;
    }
    const hour = Number(parts[0]);
    const minute = Number(parts[1]);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return null;
    }
    return hour * 60 + minute;
  }
}
