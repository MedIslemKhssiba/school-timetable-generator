import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { CardModule, GridModule, ButtonDirective } from '@coreui/angular';
import { AuthService } from '../../../core/services/auth.service';
import { Lesson } from '../../../core/models';
import { environment } from '@env/environment';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, GridModule, ButtonDirective],
  template: `
    <div class="page-header">
      <h2>Dashboard</h2>
    </div>

    <c-row class="mb-4">
      <c-col sm="6" lg="4">
        <c-card class="border-top-primary border-top-3 h-100">
          <c-card-body class="d-flex align-items-center gap-3">
            <div class="stat-icon bg-primary bg-opacity-10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
            </div>
            <div>
              <div class="fs-4 fw-semibold">{{ totalLessons }}</div>
              <div class="text-muted small">Weekly Lessons</div>
            </div>
          </c-card-body>
        </c-card>
      </c-col>
      <c-col sm="6" lg="4">
        <c-card class="border-top-info border-top-3 h-100">
          <c-card-body class="d-flex align-items-center gap-3">
            <div class="stat-icon bg-info bg-opacity-10 text-info">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
            </div>
            <div>
              <div class="fs-4 fw-semibold">{{ subjects.size }}</div>
              <div class="text-muted small">Subjects</div>
            </div>
          </c-card-body>
        </c-card>
      </c-col>
      <c-col sm="6" lg="4">
        <c-card class="border-top-success border-top-3 h-100">
          <c-card-body class="d-flex align-items-center gap-3">
            <div class="stat-icon bg-success bg-opacity-10 text-success">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            </div>
            <div>
              <div class="fs-4 fw-semibold">{{ classes.size }}</div>
              <div class="text-muted small">Classes</div>
            </div>
          </c-card-body>
        </c-card>
      </c-col>
    </c-row>

    <c-card>
      <c-card-body class="d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div>
          <h3 class="mb-1">Welcome back, {{ userName }}!</h3>
          <p class="text-muted mb-0">View your weekly schedule and manage your availability preferences.</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button cButton color="primary" routerLink="../schedule">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="me-1"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
            View Schedule
          </button>
          <button cButton color="info" routerLink="../availability">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="me-1"><path d="M16.53 11.06L15.47 10l-4.88 4.88-2.12-2.12-1.06 1.06L10.59 17l5.94-5.94zM19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
            Set Availability
          </button>
        </div>
      </c-card-body>
    </c-card>
  `,
  styles: [`
    .stat-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
  `]
})
export class TeacherDashboardComponent implements OnInit {
  totalLessons = 0;
  subjects = new Set<string>();
  classes = new Set<string>();
  userName = '';

  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.currentUser$.subscribe(u => {
      if (u) this.userName = `${u.firstName} ${u.lastName}`;
    });
  }

  ngOnInit(): void {
    this.http.get<Lesson[]>(`${environment.apiUrl}/teacher/schedule`).subscribe(lessons => {
      this.totalLessons = lessons.length;
      lessons.forEach(l => {
        this.subjects.add(l.subjectName);
        this.classes.add(l.classGroupName);
      });
    });
  }
}
