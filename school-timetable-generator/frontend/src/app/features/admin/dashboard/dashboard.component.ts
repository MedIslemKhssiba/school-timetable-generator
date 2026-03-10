import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule, GridModule, ButtonDirective } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, GridModule, ButtonDirective, SkeletonComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">Dashboard</h2>
        <p class="page-subtitle">School management overview</p>
      </div>
    </div>

    @if (loading) {
      <ui-skeleton type="cards" [count]="4" />
    } @else {
      <div class="stats-grid mb-4">
        @for (stat of statCards; track stat.key) {
          <div class="stat-card" [routerLink]="stat.route">
            <div class="stat-icon-wrapper" [class]="'stat-icon-' + stat.color">
              <span [innerHTML]="stat.svg"></span>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats[stat.key] ?? 0 }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
            <div class="stat-arrow">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
            </div>
          </div>
        }
      </div>

      <c-row>
        <c-col lg="8">
          <c-card class="welcome-card mb-4">
            <c-card-body>
              <div class="d-flex align-items-start gap-3 flex-wrap">
                <div class="welcome-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>
                </div>
                <div class="flex-grow-1">
                  <h5 class="fw-bold mb-1">Welcome back, {{ userName }}!</h5>
                  <p class="text-body-secondary mb-3" style="max-width:520px">
                    Manage your school resources and generate optimized timetables. Add teachers, classes, subjects, and rooms to get started.
                  </p>
                  <div class="d-flex gap-2 flex-wrap">
                    <button cButton color="primary" routerLink="../timetable">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-1"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
                      Generate Timetable
                    </button>
                    <button cButton color="info" variant="outline" routerLink="../teachers">Manage Teachers</button>
                  </div>
                </div>
              </div>
            </c-card-body>
          </c-card>
        </c-col>
        <c-col lg="4">
          <c-card class="quick-card mb-4">
            <c-card-header><strong>Quick Actions</strong></c-card-header>
            <c-card-body class="p-0">
              <a class="quick-link" routerLink="../teachers">
                <div class="quick-icon qi-primary"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>
                <div class="flex-grow-1"><div class="quick-title">Teachers</div><div class="quick-desc">Manage teaching staff</div></div>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#B0B8C9"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
              </a>
              <a class="quick-link" routerLink="../classes">
                <div class="quick-icon qi-info"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg></div>
                <div class="flex-grow-1"><div class="quick-title">Classes</div><div class="quick-desc">Manage class groups</div></div>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#B0B8C9"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
              </a>
              <a class="quick-link" routerLink="../subjects">
                <div class="quick-icon qi-warning"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg></div>
                <div class="flex-grow-1"><div class="quick-title">Subjects</div><div class="quick-desc">Manage curriculum</div></div>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#B0B8C9"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
              </a>
              <a class="quick-link" routerLink="../rooms">
                <div class="quick-icon qi-success"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 19V4h-4V3H5v16H3v2h12V6h2v15h4v-2h-2zm-6 0H7V5h6v14z"/></svg></div>
                <div class="flex-grow-1"><div class="quick-title">Rooms</div><div class="quick-desc">Manage classrooms</div></div>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#B0B8C9"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
              </a>
            </c-card-body>
          </c-card>
        </c-col>
      </c-row>
    }
  `,
  styles: [`
    .page-title { font-size: 1.5rem; font-weight: 800; color: #1A2236; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8892A4; margin: 4px 0 0; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .stat-card {
      background: white; border-radius: 14px; padding: 20px 24px;
      display: flex; align-items: center; gap: 16px;
      border: 1px solid #E2E8F0; box-shadow: 0 2px 8px rgba(16,42,67,0.06);
      cursor: pointer; transition: all 200ms; text-decoration: none; color: inherit;
    }
    .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(16,42,67,0.12); }
    .stat-icon-wrapper {
      width: 54px; height: 54px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      :deep(svg) { width: 26px; height: 26px; fill: white; }
    }
    .stat-icon-primary { background: linear-gradient(135deg, #1565C0, #42A5F5); }
    .stat-icon-info    { background: linear-gradient(135deg, #0277BD, #4FC3F7); }
    .stat-icon-warning { background: linear-gradient(135deg, #F57F17, #FFB300); }
    .stat-icon-success { background: linear-gradient(135deg, #2E7D32, #66BB6A); }
    .stat-content { flex: 1; }
    .stat-value { font-size: 1.75rem; font-weight: 800; color: #1A2236; line-height: 1; }
    .stat-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #8892A4; margin-top: 4px; }
    .stat-arrow { color: #B0B8C9; }

    .welcome-card { border-left: 4px solid #1565C0 !important; }
    .welcome-icon {
      width: 52px; height: 52px; border-radius: 12px;
      background: linear-gradient(135deg, #1565C0, #42A5F5);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; box-shadow: 0 4px 12px rgba(21,101,192,0.2);
    }

    .quick-link {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 20px; text-decoration: none; color: inherit;
      border-bottom: 1px solid #EDF0F5; transition: background 150ms; cursor: pointer;
      &:hover { background: #F8FAFC; }
      &:last-child { border-bottom: none; }
    }
    .quick-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .qi-primary { background: #E3F2FD; color: #1565C0; }
    .qi-info    { background: #E1F5FE; color: #0277BD; }
    .qi-warning { background: #FFF8E1; color: #F57F17; }
    .qi-success { background: #E8F5E9; color: #2E7D32; }
    .quick-title { font-weight: 600; font-size: 0.875rem; color: #1A2236; }
    .quick-desc  { font-size: 0.75rem; color: #8892A4; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: Record<string, number> = {};
  userName = '';
  loading = true;
  private schoolId = 1;

  statCards = [
    { key: 'totalTeachers', label: 'Teachers', color: 'primary', route: '../teachers', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' },
    { key: 'totalClasses', label: 'Classes', color: 'info', route: '../classes', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>' },
    { key: 'totalSubjects', label: 'Subjects', color: 'warning', route: '../subjects', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>' },
    { key: 'totalRooms', label: 'Rooms', color: 'success', route: '../rooms', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 19V4h-4V3H5v16H3v2h12V6h2v15h4v-2h-2zm-6 0H7V5h6v14z"/></svg>' }
  ];

  constructor(private adminService: AdminService, private authService: AuthService) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.authService.currentUser$.subscribe(u => {
      if (u) this.userName = u.firstName;
    });
  }

  ngOnInit(): void {
    this.adminService.getDashboard(this.schoolId).subscribe({
      next: s => { this.stats = s; this.loading = false; },
      error: () => this.loading = false
    });
  }
}
