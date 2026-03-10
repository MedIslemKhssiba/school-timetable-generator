import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CardModule, GridModule, ButtonDirective } from '@coreui/angular';
import { AuthService } from '../../../core/services/auth.service';
import { Lesson } from '../../../core/models';
import { environment } from '@env/environment';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, GridModule, ButtonDirective, SkeletonComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">Dashboard</h2>
        <p class="page-subtitle">Your teaching overview at a glance</p>
      </div>
    </div>

    @if (loading) {
      <ui-skeleton type="cards" [count]="3" />
    } @else {
      <div class="stats-grid mb-4">
        <a routerLink="../schedule" class="stat-card stat-primary">
          <div class="stat-icon-wrap bg-primary">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
          </div>
          <div class="stat-value">{{ totalLessons }}</div>
          <div class="stat-label">Weekly Lessons</div>
        </a>
        <a routerLink="../schedule" class="stat-card stat-info">
          <div class="stat-icon-wrap bg-info">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
          </div>
          <div class="stat-value">{{ subjects.size }}</div>
          <div class="stat-label">Subjects</div>
        </a>
        <a routerLink="../schedule" class="stat-card stat-success">
          <div class="stat-icon-wrap bg-success">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="white"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          </div>
          <div class="stat-value">{{ classes.size }}</div>
          <div class="stat-label">Classes</div>
        </a>
      </div>
    }

    <c-row>
      <c-col lg="8" class="mb-4">
        <c-card class="welcome-card h-100">
          <c-card-body>
            <div class="d-flex align-items-start gap-3 flex-wrap">
              <div class="welcome-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
              </div>
              <div class="flex-grow-1">
                <h5 class="fw-bold mb-1">Welcome back, {{ userName }}!</h5>
                <p class="text-body-secondary mb-3" style="max-width:520px">
                  View your weekly schedule and manage your availability preferences.
                </p>
                <div class="d-flex gap-2 flex-wrap">
                  <button cButton color="primary" routerLink="../schedule">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-1"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
                    View Schedule
                  </button>
                  <button cButton color="info" variant="outline" routerLink="../availability">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-1"><path d="M16.53 11.06L15.47 10l-4.88 4.88-2.12-2.12-1.06 1.06L10.59 17l5.94-5.94zM19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
                    Set Availability
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
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-2 text-primary"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>
            Quick Links
          </c-card-header>
          <c-card-body class="p-0">
            <a routerLink="../schedule" class="quick-link">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#1565C0"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
              <span>My Schedule</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#8892A4" class="ms-auto"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
            </a>
            <a routerLink="../availability" class="quick-link">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#2E7D32"><path d="M16.53 11.06L15.47 10l-4.88 4.88-2.12-2.12-1.06 1.06L10.59 17l5.94-5.94zM19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
              <span>Set Availability</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#8892A4" class="ms-auto"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
            </a>
            <a routerLink="/profile" class="quick-link">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#F57F17"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              <span>My Profile</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#8892A4" class="ms-auto"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
            </a>
          </c-card-body>
        </c-card>
      </c-col>
    </c-row>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #1A2236; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8892A4; margin: 4px 0 0; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .stat-card {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 24px 16px; border-radius: 12px; background: white; text-decoration: none;
      border: 1px solid #E2E8F0; border-left: 4px solid transparent;
      transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;
    }
    .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
    .stat-primary { border-left-color: #1565C0; }
    .stat-info { border-left-color: #0277BD; }
    .stat-success { border-left-color: #2E7D32; }
    .stat-icon-wrap {
      width: 52px; height: 52px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-value { font-size: 1.75rem; font-weight: 800; color: #1A2236; line-height: 1; }
    .stat-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #8892A4; }

    .welcome-card { border-left: 4px solid #1565C0 !important; }
    .welcome-icon {
      width: 52px; height: 52px; border-radius: 12px;
      background: linear-gradient(135deg, #1565C0, #42A5F5);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; box-shadow: 0 4px 12px rgba(21,101,192,0.2);
    }

    .quick-link {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 20px; text-decoration: none; color: #1A2236;
      font-weight: 500; font-size: 0.9rem;
      border-bottom: 1px solid #F0F2F5; transition: background 0.15s;
      &:last-child { border-bottom: none; }
      &:hover { background: #F8FAFC; }
    }
  `]
})
export class TeacherDashboardComponent implements OnInit {
  totalLessons = 0;
  subjects = new Set<string>();
  classes = new Set<string>();
  userName = '';
  loading = true;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.currentUser$.subscribe(u => {
      if (u) this.userName = `${u.firstName} ${u.lastName}`;
    });
  }

  ngOnInit(): void {
    this.http.get<Lesson[]>(`${environment.apiUrl}/teacher/schedule`).subscribe({
      next: lessons => {
        this.totalLessons = lessons.length;
        lessons.forEach(l => {
          this.subjects.add(l.subjectName);
          this.classes.add(l.classGroupName);
        });
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}
