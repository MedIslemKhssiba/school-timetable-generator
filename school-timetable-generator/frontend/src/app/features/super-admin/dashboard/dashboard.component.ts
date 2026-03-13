import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CardModule, GridModule, ButtonDirective } from '@coreui/angular';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { Subscription, interval, switchMap } from 'rxjs';

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
                    You have full control over the platform. Manage schools, assign administrators, and monitor the entire system.
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
        <c-col lg="4">
          <c-card class="quick-card mb-4">
            <c-card-header><strong>{{ t('quick_actions') }}</strong></c-card-header>
            <c-card-body class="p-0">
              <a class="quick-link" routerLink="../schools">
                <span class="quick-icon" [innerHTML]="icons.schools"></span>
                <div class="flex-grow-1">
                  <div class="quick-title">{{ t('manage_schools') }}</div>
                  <div class="quick-desc">{{ t('add_edit_schools') }}</div>
                </div>
              </a>
              <a class="quick-link" routerLink="../admins">
                <span class="quick-icon" [innerHTML]="icons.admins"></span>
                <div class="flex-grow-1">
                  <div class="quick-title">{{ t('manage_admins') }}</div>
                  <div class="quick-desc">{{ t('assign_admins') }}</div>
                </div>
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

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
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

    .stat-content { flex: 1; }
    .stat-value { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; line-height: 1; }
    .stat-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #8D99A8; margin-top: 4px; font-family: 'Montserrat', sans-serif; }

    .welcome-card { border-left: 4px solid #2563EB !important; }

    .quick-link {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 20px; text-decoration: none; color: inherit;
      border-bottom: 1px solid #EAEEF6; transition: background 200ms;
      cursor: pointer;
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
export class SuperAdminDashboardComponent implements OnInit, OnDestroy {
  stats: Record<string, number> = {};
  userName = '';
  loading = true;
  private pollSub?: Subscription;

  private icon(d: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
    );
  }

  icons = {
    schools: this.icon('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
    admins: this.icon('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    users: this.icon('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/>')
  };

  statCards = [
    { key: 'totalSchools', label: 'Schools', color: 'primary', route: '../schools', icon: this.icons.schools },
    { key: 'totalAdmins', label: 'Administrators', color: 'info', route: '../admins', icon: this.icons.admins },
    { key: 'totalUsers', label: 'Total Users', color: 'warning', route: '../admins', icon: this.icons.users }
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

  ngOnInit(): void {
    this.superAdminService.getDashboard().subscribe({
      next: s => { this.stats = s; this.loading = false; },
      error: () => this.loading = false
    });
    this.pollSub = interval(30000).pipe(
      switchMap(() => this.superAdminService.getDashboard())
    ).subscribe(s => this.stats = s);
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}
