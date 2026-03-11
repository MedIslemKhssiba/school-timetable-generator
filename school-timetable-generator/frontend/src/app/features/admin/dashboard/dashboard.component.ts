import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule, GridModule, ButtonDirective } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
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
          <div class="stat-card" [routerLink]="stat.route">
            <div class="stat-icon-wrapper" [class]="'stat-icon-' + stat.color">
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats[stat.key] ?? 0 }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
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
        </c-col>
        <c-col lg="4">
          <c-card class="quick-card mb-4">
            <c-card-header><strong>{{ t('quick_actions') }}</strong></c-card-header>
            <c-card-body class="p-0">
              <a class="quick-link" routerLink="../teachers">
                <div class="flex-grow-1"><div class="quick-title">{{ t('teachers') }}</div><div class="quick-desc">{{ t('manage_teaching_staff') }}</div></div>
              </a>
              <a class="quick-link" routerLink="../classes">
                <div class="flex-grow-1"><div class="quick-title">{{ t('classes') }}</div><div class="quick-desc">{{ t('manage_class_groups') }}</div></div>
              </a>
              <a class="quick-link" routerLink="../subjects">
                <div class="flex-grow-1"><div class="quick-title">{{ t('subjects') }}</div><div class="quick-desc">{{ t('manage_curriculum') }}</div></div>
              </a>
              <a class="quick-link" routerLink="../rooms">
                <div class="flex-grow-1"><div class="quick-title">{{ t('rooms') }}</div><div class="quick-desc">{{ t('manage_classrooms') }}</div></div>
              </a>
            </c-card-body>
          </c-card>
        </c-col>
      </c-row>
    }
  `,
  styles: [`
    .page-title { font-size: 1.5rem; font-weight: 800; color: #0F172A; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #94A3B8; margin: 4px 0 0; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .stat-card {
      background: white; border-radius: 14px; padding: 20px 24px;
      display: flex; align-items: center; gap: 16px;
      border: 1px solid #E2E8F0; box-shadow: 0 2px 8px rgba(15,23,42,0.06);
      cursor: pointer; transition: all 200ms; text-decoration: none; color: inherit;
    }
    .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(15,23,42,0.12); }
    .stat-icon-wrapper {
      width: 54px; height: 54px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      :deep(svg) { width: 26px; height: 26px; fill: white; }
    }
    .stat-icon-primary { background: linear-gradient(135deg, #2563EB, #60A5FA); }
    .stat-icon-info    { background: linear-gradient(135deg, #0EA5E9, #38BDF8); }
    .stat-icon-warning { background: linear-gradient(135deg, #F59E0B, #FBBF24); }
    .stat-icon-success { background: linear-gradient(135deg, #22C55E, #4ADE80); }
    .stat-content { flex: 1; }
    .stat-value { font-size: 1.75rem; font-weight: 800; color: #0F172A; line-height: 1; }
    .stat-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #94A3B8; margin-top: 4px; }
    .stat-arrow { color: #94A3B8; }

    .welcome-card { border-left: 4px solid #2563EB !important; }
    .welcome-icon {
      width: 52px; height: 52px; border-radius: 12px;
      background: linear-gradient(135deg, #2563EB, #60A5FA);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; box-shadow: 0 4px 12px rgba(37,99,235,0.2);
    }

    .quick-link {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 20px; text-decoration: none; color: inherit;
      border-bottom: 1px solid #E2E8F0; transition: background 150ms; cursor: pointer;
      &:hover { background: #F8FAFC; }
      &:last-child { border-bottom: none; }
    }
    .quick-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .qi-primary { background: #EFF6FF; color: #2563EB; }
    .qi-info    { background: #F0F9FF; color: #0EA5E9; }
    .qi-warning { background: #FFFBEB; color: #F59E0B; }
    .qi-success { background: #F0FDF4; color: #22C55E; }
    .quick-title { font-weight: 600; font-size: 0.875rem; color: #0F172A; }
    .quick-desc  { font-size: 0.75rem; color: #94A3B8; }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats: Record<string, number> = {};
  userName = '';
  loading = true;
  private schoolId = 1;
  private pollSub?: Subscription;

  statCards = [
    { key: 'totalTeachers', label: 'Teachers', color: 'primary', route: '../teachers' },
    { key: 'totalClasses', label: 'Classes', color: 'info', route: '../classes' },
    { key: 'totalSubjects', label: 'Subjects', color: 'warning', route: '../subjects' },
    { key: 'totalRooms', label: 'Rooms', color: 'success', route: '../rooms' }
  ];

  constructor(private adminService: AdminService, private authService: AuthService, private ts: TranslationService) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.authService.currentUser$.subscribe(u => {
      if (u) this.userName = u.firstName;
    });
  }

  t(key: string): string { return this.ts.t(key); }

  ngOnInit(): void {
    this.adminService.getDashboard(this.schoolId).subscribe({
      next: s => { this.stats = s; this.loading = false; },
      error: () => this.loading = false
    });
    this.pollSub = interval(30000).pipe(
      switchMap(() => this.adminService.getDashboard(this.schoolId))
    ).subscribe(s => this.stats = s);
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}
