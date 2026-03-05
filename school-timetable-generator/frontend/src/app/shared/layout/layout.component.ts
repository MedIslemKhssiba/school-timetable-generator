import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule, MatSidenavModule, MatListModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav mode="side" opened class="sidenav">
        <mat-nav-list>
          @for (link of navLinks; track link.path) {
            <a mat-list-item [routerLink]="link.path" routerLinkActive="active">
              <mat-icon matListItemIcon>{{ link.icon }}</mat-icon>
              <span matListItemTitle>{{ link.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span>{{ title }}</span>
          <span class="spacer"></span>
          <button mat-button routerLink="/profile" style="color:white">
            <mat-icon>account_circle</mat-icon> {{ userName }}
          </button>
          <button mat-icon-button (click)="logout()">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>
        <div class="container">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container { height: 100vh; }
    .sidenav { width: 220px; }
    .spacer { flex: 1 1 auto; }
    .container { padding: 24px; }
    .active { background: rgba(0,0,0,.08); }
  `]
})
export class LayoutComponent {
  title = '';
  userName = '';
  navLinks: { path: string; label: string; icon: string }[] = [];

  constructor(private authService: AuthService, private router: Router) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = `${user.firstName} ${user.lastName}`;
        this.setNavLinks(user.role);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private setNavLinks(role: string): void {
    if (role === 'ROLE_SUPER_ADMIN') {
      this.title = 'Super Admin';
      this.navLinks = [
        { path: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { path: 'schools', label: 'Schools', icon: 'school' },
        { path: 'admins', label: 'Admins', icon: 'admin_panel_settings' }
      ];
    } else if (role === 'ROLE_ADMIN') {
      this.title = 'Admin';
      this.navLinks = [
        { path: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { path: 'teachers', label: 'Teachers', icon: 'person' },
        { path: 'classes', label: 'Classes', icon: 'class' },
        { path: 'subjects', label: 'Subjects', icon: 'book' },
        { path: 'rooms', label: 'Rooms', icon: 'meeting_room' },
        { path: 'timetable', label: 'Timetable', icon: 'calendar_today' }
      ];
    } else {
      this.title = 'Teacher';
      this.navLinks = [
        { path: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { path: 'schedule', label: 'My Schedule', icon: 'calendar_today' },
        { path: 'availability', label: 'My Availability', icon: 'event_available' }
      ];
    }
  }
}
