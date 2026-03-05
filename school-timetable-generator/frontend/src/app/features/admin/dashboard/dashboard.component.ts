import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule, GridModule, ButtonDirective } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, GridModule, ButtonDirective],
  template: `
    <div class="page-header">
      <h2>Dashboard</h2>
    </div>

    <c-row class="mb-4">
      <c-col sm="6" lg="3" *ngFor="let stat of statCards">
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
          Manage your school resources and generate optimized timetables. Add teachers, classes, subjects, and rooms to get started.
        </p>
        <div class="d-flex gap-2 flex-wrap">
          <button cButton color="primary" routerLink="../timetable">Generate Timetable</button>
          <button cButton color="info" variant="outline" routerLink="../teachers">Manage Teachers</button>
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
    .bg-success { background: var(--cui-success); }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: Record<string, number> = {};
  userName = '';
  private schoolId = 1;

  statCards = [
    { key: 'totalTeachers', label: 'Teachers', color: 'primary', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' },
    { key: 'totalClasses', label: 'Classes', color: 'info', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>' },
    { key: 'totalSubjects', label: 'Subjects', color: 'warning', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>' },
    { key: 'totalRooms', label: 'Rooms', color: 'success', svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 19V4h-4V3H5v16H3v2h12V6h2v15h4v-2h-2zm-6 0H7V5h6v14z"/></svg>' }
  ];

  constructor(private adminService: AdminService, private authService: AuthService) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.authService.currentUser$.subscribe(u => {
      if (u) this.userName = u.firstName;
    });
  }

  ngOnInit(): void {
    this.adminService.getDashboard(this.schoolId).subscribe(s => this.stats = s);
  }
}
