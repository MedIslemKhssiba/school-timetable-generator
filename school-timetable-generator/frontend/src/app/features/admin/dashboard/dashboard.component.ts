import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <h2>Admin Dashboard</h2>
    <div class="stats-grid">
      <mat-card>
        <mat-card-content>
          <mat-icon color="primary">person</mat-icon>
          <div class="stat-value">{{ stats['totalTeachers'] ?? 0 }}</div>
          <div class="stat-label">Teachers</div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content>
          <mat-icon color="accent">class</mat-icon>
          <div class="stat-value">{{ stats['totalClasses'] ?? 0 }}</div>
          <div class="stat-label">Classes</div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content>
          <mat-icon color="warn">book</mat-icon>
          <div class="stat-value">{{ stats['totalSubjects'] ?? 0 }}</div>
          <div class="stat-label">Subjects</div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content>
          <mat-icon>meeting_room</mat-icon>
          <div class="stat-value">{{ stats['totalRooms'] ?? 0 }}</div>
          <div class="stat-label">Rooms</div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    mat-card-content { text-align: center; padding: 24px; }
    .stat-value { font-size: 2rem; font-weight: bold; margin: 8px 0 4px; }
    .stat-label { color: #666; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: Record<string, number> = {};
  private schoolId = 1;

  constructor(private adminService: AdminService, private authService: AuthService) {
    this.schoolId = this.authService.getSchoolId() || 1;
  }

  ngOnInit(): void {
    this.adminService.getDashboard(this.schoolId).subscribe(s => this.stats = s);
  }
}
