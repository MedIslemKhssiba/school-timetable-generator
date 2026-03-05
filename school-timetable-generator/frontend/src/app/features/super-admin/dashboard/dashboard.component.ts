import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { SuperAdminService } from '../../../core/services/super-admin.service';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <h2>Dashboard</h2>
    <div class="stats-grid">
      <mat-card>
        <mat-card-content>
          <mat-icon color="primary">school</mat-icon>
          <div class="stat-value">{{ stats['totalSchools'] ?? 0 }}</div>
          <div class="stat-label">Schools</div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content>
          <mat-icon color="accent">admin_panel_settings</mat-icon>
          <div class="stat-value">{{ stats['totalAdmins'] ?? 0 }}</div>
          <div class="stat-label">Admins</div>
        </mat-card-content>
      </mat-card>
      <mat-card>
        <mat-card-content>
          <mat-icon color="warn">people</mat-icon>
          <div class="stat-value">{{ stats['totalUsers'] ?? 0 }}</div>
          <div class="stat-label">Total Users</div>
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
export class SuperAdminDashboardComponent implements OnInit {
  stats: Record<string, number> = {};

  constructor(private superAdminService: SuperAdminService) {}

  ngOnInit(): void {
    this.superAdminService.getDashboard().subscribe(s => this.stats = s);
  }
}
