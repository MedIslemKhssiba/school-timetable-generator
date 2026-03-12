import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
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
      <ui-skeleton type="cards" [count]="3" />
    } @else {
      <div class="stats-grid mb-4">
        <a routerLink="../schedule" class="stat-card stat-primary">
          <div class="stat-icon-wrap bg-primary">
          </div>
          <div class="stat-value">{{ totalLessons }}</div>
          <div class="stat-label">{{ t('weekly_lessons') }}</div>
        </a>
        <a routerLink="../schedule" class="stat-card stat-info">
          <div class="stat-icon-wrap bg-info">
          </div>
          <div class="stat-value">{{ subjects.size }}</div>
          <div class="stat-label">{{ t('subjects') }}</div>
        </a>
        <a routerLink="../schedule" class="stat-card stat-success">
          <div class="stat-icon-wrap bg-success">
          </div>
          <div class="stat-value">{{ classes.size }}</div>
          <div class="stat-label">{{ t('classes') }}</div>
        </a>
      </div>
    }

    <c-row>
      <c-col lg="8" class="mb-4">
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
      <c-col lg="4" class="mb-4">
        <c-card class="h-100">
          <c-card-header class="fw-semibold">
            {{ t('quick_links') }}
          </c-card-header>
          <c-card-body class="p-0">
            <a routerLink="../schedule" class="quick-link">
              <span>{{ t('my_schedule') }}</span>
            </a>
            <a routerLink="../availability" class="quick-link">
              <span>{{ t('set_availability') }}</span>
            </a>
            <a routerLink="/profile" class="quick-link">
              <span>{{ t('my_profile') }}</span>
            </a>
          </c-card-body>
        </c-card>
      </c-col>
    </c-row>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8D99A8; margin: 4px 0 0; font-family: 'Montserrat', sans-serif; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .stat-card {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 24px 16px; border-radius: 14px; background: #F8FAFF; text-decoration: none;
      border: 1px solid #DDE3EE; border-left: 4px solid transparent;
      transition: transform 250ms, box-shadow 250ms; cursor: pointer;
    }
    .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(13, 27, 62,0.1); }
    .stat-primary { border-left-color: #2563EB; }
    .stat-info { border-left-color: #4A7C8A; }
    .stat-success { border-left-color: #6B9080; }
    .stat-icon-wrap {
      width: 52px; height: 52px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-value { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; line-height: 1; }
    .stat-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #8D99A8; font-family: 'Montserrat', sans-serif; }

    .welcome-card { border-left: 4px solid #2563EB !important; }

    .quick-link {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 20px; text-decoration: none; color: #1A2332;
      font-weight: 500; font-size: 0.9rem; font-family: 'Montserrat', sans-serif;
      border-bottom: 1px solid #EAEEF6; transition: background 200ms;
      &:last-child { border-bottom: none; }
      &:hover { background: #F0F4FA; }
    }
  `]
})
export class TeacherDashboardComponent implements OnInit, OnDestroy {
  totalLessons = 0;
  subjects = new Set<string>();
  classes = new Set<string>();
  userName = '';
  loading = true;
  private pollSub?: Subscription;

  constructor(private http: HttpClient, private authService: AuthService, private ts: TranslationService) {
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
        lessons.forEach(l => {
          this.subjects.add(l.subjectName);
          this.classes.add(l.classGroupName);
        });
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
}
