import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CardModule, GridModule, ButtonDirective } from '@coreui/angular';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { School, User } from '../../../core/models';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { Subscription, forkJoin, interval, switchMap } from 'rxjs';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, GridModule, ButtonDirective, SkeletonComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">{{ t('dashboard') }}</h2>
        <p class="page-subtitle">{{ t('platform_overview') }}</p>
      </div>
    </div>

    @if (loading) {
      <ui-skeleton type="cards" [count]="3" />
    } @else {
      <div class="stats-grid mb-4">
        @for (stat of statCards; track stat.key) {
          <a class="stat-card" [routerLink]="stat.route" [ngClass]="'stat-' + stat.color">
            <div [ngClass]="['stat-icon-wrapper', 'stat-icon-' + stat.color]">
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
        <c-col lg="12">
          <c-card class="welcome-card mb-4">
            <c-card-body>
              <div class="d-flex align-items-start gap-3 flex-wrap">
                <div class="flex-grow-1">
                  <h5 class="fw-bold mb-1">{{ t('welcome_back_name') }}, {{ userName }}!</h5>
                  <p class="text-body-secondary mb-3" style="max-width:520px">
                    {{ t('platform_control_message') }}
                  </p>
                  <div class="d-flex gap-2 flex-wrap">
                    <button cButton color="primary" routerLink="../schools">
                      {{ t('add_school') }}
                    </button>
                    <button cButton color="info" variant="outline" routerLink="../admins">
                      {{ t('add_admin') }}
                    </button>
                  </div>
                </div>
              </div>
            </c-card-body>
          </c-card>
        </c-col>
      </c-row>
    }
  `,
  styles: [`
    .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8D99A8; margin: 4px 0 0; font-family: 'Montserrat', sans-serif; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .stat-card {
      background: linear-gradient(165deg, #ffffff 0%, #f4f8ff 100%); border-radius: 18px; padding: 22px 24px;
      display: flex; align-items: center; gap: 0;
      border: 1px solid rgba(183, 200, 226, 0.5); border-left: 4px solid transparent; box-shadow: 0 10px 24px rgba(15, 23, 42,0.08);
      cursor: pointer; transition: all 250ms; text-decoration: none; color: inherit;
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
    .stat-primary { border-left-color: #2563EB; background: linear-gradient(165deg, #ffffff 0%, #edf4ff 100%); }
    .stat-info { border-left-color: #0EA5E9; background: linear-gradient(165deg, #ffffff 0%, #ecfeff 100%); }
    .stat-success { border-left-color: #10B981; background: linear-gradient(165deg, #ffffff 0%, #ecfdf5 100%); }
    .stat-warning { border-left-color: #F59E0B; background: linear-gradient(165deg, #ffffff 0%, #fffbeb 100%); }
    .stat-dark { border-left-color: #334155; background: linear-gradient(165deg, #ffffff 0%, #f1f5f9 100%); }

    .stat-icon-wrapper {
      width: 56px; height: 56px; border-radius: 14px;
      display: none; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .stat-icon { display: inline-flex; color: #2563EB; }
    .stat-icon :deep(svg) { width: 22px; height: 22px; fill: currentColor; stroke: none; }
    .stat-icon-primary { background: transparent; color: #2563EB; }
    .stat-icon-info    { background: transparent; color: #0284C7; }
    .stat-icon-warning { background: transparent; color: #D97706; }
    .stat-icon-success { background: transparent; color: #059669; }
    .stat-icon-dark { background: transparent; color: #334155; }

    .stat-content { flex: 1; }
    .stat-value { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; line-height: 1; }
    .stat-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #8D99A8; margin-top: 4px; font-family: 'Montserrat', sans-serif; }

    .welcome-card {
      border: 1px solid rgba(37, 99, 235, 0.2) !important;
      background: linear-gradient(140deg, rgba(255,255,255,0.95), rgba(239,246,255,0.92)) !important;
      box-shadow: 0 18px 30px rgba(37, 99, 235, 0.1) !important;
    }

  `]
})
export class SuperAdminDashboardComponent implements OnInit, OnDestroy {
  stats: Record<string, number> = {
    totalSchools: 0,
    activeSchools: 0,
    totalAdmins: 0,
    assignedAdmins: 0,
    totalUsers: 0,
    adminsPerSchool: 0
  };
  userName = '';
  loading = true;
  private pollSub?: Subscription;

  private icon(d: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">${d}</svg>`
    );
  }

  icons = {
    schools: this.icon('<path d="M12 3.172 3 10v10a1 1 0 0 0 1 1h5v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6h5a1 1 0 0 0 1-1V10l-9-6.828Z"/>'),
    admins: this.icon('<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0v1H2v-1Zm13 1v-1a5 5 0 0 1 7 0v1h-7Z"/>'),
    users: this.icon('<path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7-2a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM4 21v-1a6 6 0 0 1 12 0v1H4Zm13 0v-1a4 4 0 0 1 6 0v1h-6Z"/>'),
    active: this.icon('<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4.707 7.293a1 1 0 0 1 0 1.414l-5.5 5.5a1 1 0 0 1-1.414 0l-2.5-2.5a1 1 0 1 1 1.414-1.414l1.793 1.793 4.793-4.793a1 1 0 0 1 1.414 0Z"/>'),
    ratio: this.icon('<path d="M4 20h16v2H2V4h2v16Zm2-1v-6h3v6H6Zm5 0V8h3v11h-3Zm5 0V4h3v15h-3Z"/>'),
    teachers: this.icon('<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0v1H2v-1Zm13 1v-1a5 5 0 0 1 7 0v1h-7Z"/>'),
    classes: this.icon('<path d="M6 4a3 3 0 0 0-3 3v11a2 2 0 0 0 2 2h14v-2H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h13V4H6Z"/><path d="M19 8H8a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11V8Z"/>'),
    subjects: this.icon('<path d="M9 2a2 2 0 0 0-2 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1a2 2 0 0 0-2-2H9Zm1 7h6v2h-6V9Zm0 4h6v2h-6v-2Z"/>'),
    rooms: this.icon('<path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6v-4h-4v4H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 3v2h2V6H7Zm0 4v2h2v-2H7Zm0 4v2h2v-2H7Zm8-8v2h2V6h-2Zm0 4v2h2v-2h-2Z"/>'),
    lessons: this.icon('<path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm12 8H5v10h14V10Z"/>')
  };

  statCards = [
    { key: 'totalSchools', label: this.t('schools'), color: 'primary', route: '../schools', icon: this.icons.schools },
    { key: 'activeSchools', label: this.t('active_schools'), color: 'success', route: '../schools', icon: this.icons.active },
    { key: 'totalAdmins', label: this.t('administrators'), color: 'info', route: '../admins', icon: this.icons.admins },
    { key: 'assignedAdmins', label: this.t('assigned_admins'), color: 'dark', route: '../admins', icon: this.icons.admins },
    { key: 'totalUsers', label: this.t('total_users'), color: 'warning', route: '../admins', icon: this.icons.users },
    { key: 'adminsPerSchool', label: this.t('admins_per_school'), color: 'primary', route: '../schools', icon: this.icons.ratio }
  ];

  constructor(
    private superAdminService: SuperAdminService,
    private authService: AuthService,
    private ts: TranslationService,
    private sanitizer: DomSanitizer
  ) {
    this.authService.currentUser$.subscribe(u => {
      if (u) this.userName = u.firstName;
    });
  }

  t(key: string): string { return this.ts.t(key); }

  private loadDashboard(): void {
    forkJoin({
      summary: this.superAdminService.getDashboard(),
      schools: this.superAdminService.getSchools(),
      admins: this.superAdminService.getAdmins()
    }).subscribe({
      next: ({ summary, schools, admins }) => {
        const schoolList = schools ?? [] as School[];
        const adminList = admins ?? [] as User[];
        const totalSchools = Number(summary?.['totalSchools'] ?? schoolList.length);
        const totalAdmins = Number(summary?.['totalAdmins'] ?? adminList.length);
        const totalUsers = Number(summary?.['totalUsers'] ?? 0);
        const activeSchools = schoolList.filter(s => s.active).length;
        const assignedAdmins = adminList.filter(a => !!(a.schoolId || a.school?.id)).length;

        this.stats = {
          totalSchools,
          activeSchools,
          totalAdmins,
          assignedAdmins,
          totalUsers,
          adminsPerSchool: activeSchools > 0 ? Number((totalAdmins / activeSchools).toFixed(1)) : 0
        };
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  ngOnInit(): void {
    this.loadDashboard();
    this.pollSub = interval(30000).pipe(
      switchMap(() => this.superAdminService.getDashboard())
    ).subscribe(summary => {
      this.stats = {
        ...this.stats,
        totalSchools: Number(summary?.['totalSchools'] ?? this.stats['totalSchools']),
        totalAdmins: Number(summary?.['totalAdmins'] ?? this.stats['totalAdmins']),
        totalUsers: Number(summary?.['totalUsers'] ?? this.stats['totalUsers']),
        adminsPerSchool: this.stats['activeSchools'] > 0
          ? Number((Number(summary?.['totalAdmins'] ?? this.stats['totalAdmins']) / this.stats['activeSchools']).toFixed(1))
          : 0
      };
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}
