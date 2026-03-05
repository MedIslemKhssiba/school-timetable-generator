import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule, GridModule, ButtonDirective } from '@coreui/angular';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, GridModule, ButtonDirective],
  template: `
    <div class="page-header">
      <h2>Dashboard</h2>
    </div>

    <c-row class="mb-4">
      <c-col sm="6" lg="4" *ngFor="let stat of statCards">
        <c-card class="mb-3 border-top-3" [ngClass]="'border-top-' + stat.color">
          <c-card-body class="d-flex align-items-center gap-3">
            <div class="stat-icon" [ngClass]="'bg-' + stat.color">
              <span [innerHTML]="stat.svg"></span>
            </div>
            <div>
              <div class="fs-4 fw-bold">{{ stats[stat.key] ?? 0 }}</div>
              <div class="text-body-secondary small text-uppercase fw-semibold">{{ stat.label }}</div>
            </div>
          </c-card-body>
        </c-card>
      </c-col>
    </c-row>

    <c-card>
      <c-card-body>
        <h5 class="fw-bold mb-2">Welcome back, {{ userName }}!</h5>
        <p class="text-body-secondary mb-3" style="max-width:520px">
          You have full control over the platform. Manage schools, assign administrators, and monitor the entire system.
        </p>
        <div class="d-flex gap-2 flex-wrap">
          <button cButton color="primary" routerLink="../schools">+ Add School</button>
          <button cButton color="info" variant="outline" routerLink="../admins">+ Add Admin</button>
        </div>
      </c-card-body>
    </c-card>
  `,
  styles: [`
    .stat-icon {
      width: 52px; height: 52px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .stat-icon :deep(svg) { width: 26px; height: 26px; fill: white; }
    .bg-primary { background: var(--cui-primary); }
    .bg-info { background: var(--cui-info); }
    .bg-warning { background: var(--cui-warning); }
  `]
})
export class SuperAdminDashboardComponent implements OnInit {
  stats: Record<string, number> = {};
  userName = '';

  statCards = [
    { key: 'totalSchools', label: 'Schools', color: 'primary', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>' },
    { key: 'totalAdmins', label: 'Administrators', color: 'info', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>' },
    { key: 'totalUsers', label: 'Total Users', color: 'warning', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>' }
  ];

  constructor(private superAdminService: SuperAdminService, private authService: AuthService) {
    this.authService.currentUser$.subscribe(u => {
      if (u) this.userName = u.firstName;
    });
  }

  ngOnInit(): void {
    this.superAdminService.getDashboard().subscribe(s => this.stats = s);
  }
}
