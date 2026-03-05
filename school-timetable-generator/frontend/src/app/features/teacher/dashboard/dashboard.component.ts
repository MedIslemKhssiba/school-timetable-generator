import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { Lesson } from '../../../core/models';
import { environment } from '@env/environment';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <h2>Teacher Dashboard</h2>
    <div class="stats-grid">
      <mat-card>
        <mat-card-content>
          <mat-icon color="primary">calendar_today</mat-icon>
          <div class="stat-value">{{ totalLessons }}</div>
          <div class="stat-label">Weekly Lessons</div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content>
          <mat-icon color="accent">book</mat-icon>
          <div class="stat-value">{{ subjects.size }}</div>
          <div class="stat-label">Subjects</div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content>
          <mat-icon color="warn">class</mat-icon>
          <div class="stat-value">{{ classes.size }}</div>
          <div class="stat-label">Classes</div>
        </mat-card-content>
      </mat-card>
    </div>
    <mat-card style="margin-top:24px">
      <mat-card-header><mat-card-title>Welcome, {{ userName }}!</mat-card-title></mat-card-header>
      <mat-card-content>
        <p>Use the sidebar to view your schedule or manage your availability.</p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
    mat-card-content { text-align: center; padding: 24px; }
    .stat-value { font-size: 2rem; font-weight: bold; margin: 8px 0 4px; }
    .stat-label { color: #666; }
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
