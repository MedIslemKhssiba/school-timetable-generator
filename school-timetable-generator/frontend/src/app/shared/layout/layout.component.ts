import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/services/auth.service';
import { ContainerComponent, DropdownModule } from '@coreui/angular';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    ContainerComponent, DropdownModule
  ],
  template: `
    <div class="app-sidebar" [class.collapsed]="sidebarCollapsed" [class.mobile-open]="sidebarMobileOpen">
      <div class="sidebar-brand">
        <a class="brand-link" routerLink="./">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
          </svg>
          <span class="brand-text">EduSchedule</span>
        </a>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-title">Navigation</div>
        @for (link of navLinks; track link.path) {
          <a class="nav-entry" [routerLink]="link.path" routerLinkActive="active">
            <span class="nav-icon" [innerHTML]="link.icon"></span>
            <span class="nav-label">{{ link.label }}</span>
          </a>
        }
        <div class="nav-divider"></div>
        <a class="nav-entry" routerLink="/profile" routerLinkActive="active">
          <span class="nav-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></span>
          <span class="nav-label">My Profile</span>
        </a>
        <a class="nav-entry logout-entry" (click)="logout()">
          <span class="nav-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg></span>
          <span class="nav-label">Sign Out</span>
        </a>
      </nav>
    </div>

    @if (sidebarMobileOpen) {
      <div class="sidebar-backdrop" (click)="sidebarMobileOpen = false"></div>
    }

    <div class="app-main" [class.sidebar-collapsed]="sidebarCollapsed">
      <header class="app-header">
        <button class="menu-toggle d-lg-none" (click)="sidebarMobileOpen = !sidebarMobileOpen">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#636f83"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
        </button>
        <button class="menu-toggle d-none d-lg-flex" (click)="sidebarCollapsed = !sidebarCollapsed">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#636f83"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
        </button>

        <span class="ms-auto"></span>

        <div cDropdown class="header-user">
          <a cDropdownToggle class="user-toggle">
            <div class="user-avatar-sm">{{ userInitials }}</div>
            <div class="d-none d-md-flex flex-column lh-sm">
              <span class="fw-semibold small">{{ userName }}</span>
              <span class="text-body-secondary" style="font-size: 0.75rem;">{{ roleLabel }}</span>
            </div>
          </a>
          <div cDropdownMenu class="dropdown-menu-end pt-0">
            <div class="dropdown-header bg-body-secondary text-body-secondary fw-semibold rounded-top mb-2 px-3 py-2">Account</div>
            <a cDropdownItem routerLink="/profile">Profile</a>
            <div class="dropdown-divider"></div>
            <a cDropdownItem (click)="logout()" class="cursor-pointer">Sign Out</a>
          </div>
        </div>
      </header>

      <div class="app-body">
        <c-container [fluid]="true" class="px-4 py-4">
          <router-outlet></router-outlet>
        </c-container>
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; min-height: 100vh; background: #f4f6f9; }

    .app-sidebar {
      width: 256px; min-height: 100vh; background: #3c4b64; color: white;
      display: flex; flex-direction: column; transition: width 0.2s ease;
      position: fixed; top: 0; left: 0; z-index: 1030; height: 100vh; overflow-y: auto;
    }
    .app-sidebar.collapsed { width: 64px; }
    .app-sidebar.collapsed .brand-text,
    .app-sidebar.collapsed .nav-label,
    .app-sidebar.collapsed .nav-section-title { display: none; }

    .sidebar-brand {
      display: flex; align-items: center; justify-content: center;
      padding: 1rem; min-height: 64px; background: rgba(0,0,0,0.15);
    }
    .brand-link {
      display: flex; align-items: center; gap: 10px;
      text-decoration: none; color: white;
    }
    .brand-text { font-size: 1.15rem; font-weight: 700; }

    .sidebar-nav { flex: 1; padding: 0.5rem 0.75rem; }
    .nav-section-title {
      padding: 0.75rem 1rem 0.4rem; font-size: 0.7rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.4);
    }
    .nav-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 0.75rem 0; }

    .nav-entry {
      display: flex; align-items: center; gap: 12px; padding: 0.6rem 1rem;
      border-radius: 8px; color: rgba(255,255,255,0.7); text-decoration: none;
      font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.15s ease;
      margin-bottom: 2px;
    }
    .nav-entry:hover { color: white; background: rgba(255,255,255,0.08); }
    .nav-entry.active { color: white; background: rgba(99,102,241,0.5); font-weight: 600; }
    .nav-entry.logout-entry { color: rgba(255,255,255,0.5); }
    .nav-entry.logout-entry:hover { color: #fca5a5; background: rgba(239,68,68,0.15); }

    .nav-icon { display: flex; flex-shrink: 0; }
    .nav-icon :deep(svg) { fill: currentColor; }

    .sidebar-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1029;
    }

    .app-main {
      flex: 1; min-width: 0; display: flex; flex-direction: column;
      margin-left: 256px; transition: margin-left 0.2s ease;
    }
    .app-main.sidebar-collapsed { margin-left: 64px; }

    .app-header {
      height: 64px; background: white; border-bottom: 1px solid #e9ecef;
      display: flex; align-items: center; padding: 0 1rem; gap: 0.5rem;
      position: sticky; top: 0; z-index: 1020;
    }

    .menu-toggle {
      cursor: pointer; padding: 0.25rem 0.5rem; border: none; background: transparent;
      border-radius: 4px; display: flex; align-items: center;
    }
    .menu-toggle:hover { background: #f0f2f5; }

    .header-user { position: relative; }
    .user-toggle {
      cursor: pointer; text-decoration: none; color: inherit;
      display: flex; align-items: center; gap: 8px;
      padding: 4px 8px; border-radius: 8px; transition: background 0.15s;
    }
    .user-toggle:hover { background: #f0f2f5; }
    .user-toggle::after { display: none; }

    .user-avatar-sm {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
    }

    .app-body { flex: 1; }
    .cursor-pointer { cursor: pointer; }

    @media (max-width: 991.98px) {
      .app-sidebar { transform: translateX(-100%); }
      .app-sidebar.mobile-open { transform: translateX(0); }
      .app-main { margin-left: 0 !important; }
    }
  `]
})
export class LayoutComponent implements OnInit {
  userName = '';
  userInitials = '';
  roleLabel = '';
  navLinks: { path: string; label: string; icon: SafeHtml }[] = [];
  sidebarCollapsed = false;
  sidebarMobileOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = `${user.firstName} ${user.lastName}`;
        this.userInitials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
        this.setNavLinks(user.role);
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarMobileOpen = !this.sidebarMobileOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private setNavLinks(role: string): void {
    const svgIcon = (d: string) => this.sanitizer.bypassSecurityTrustHtml(
      `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="${d}"/></svg>`
    );

    const icons: Record<string, SafeHtml> = {
      dashboard: svgIcon('M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'),
      school: svgIcon('M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z'),
      people: svgIcon('M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'),
      person: svgIcon('M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'),
      book: svgIcon('M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z'),
      room: svgIcon('M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z'),
      calendar: svgIcon('M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z'),
      schedule: svgIcon('M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z'),
      check: svgIcon('M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z')
    };

    if (role === 'ROLE_SUPER_ADMIN') {
      this.roleLabel = 'Super Admin';
      this.navLinks = [
        { path: 'dashboard', label: 'Dashboard', icon: icons['dashboard'] },
        { path: 'schools', label: 'Schools', icon: icons['school'] },
        { path: 'admins', label: 'Admins', icon: icons['people'] }
      ];
    } else if (role === 'ROLE_ADMIN') {
      this.roleLabel = 'Administrator';
      this.navLinks = [
        { path: 'dashboard', label: 'Dashboard', icon: icons['dashboard'] },
        { path: 'teachers', label: 'Teachers', icon: icons['person'] },
        { path: 'classes', label: 'Classes', icon: icons['school'] },
        { path: 'subjects', label: 'Subjects', icon: icons['book'] },
        { path: 'rooms', label: 'Rooms', icon: icons['room'] },
        { path: 'timetable', label: 'Timetable', icon: icons['calendar'] }
      ];
    } else {
      this.roleLabel = 'Teacher';
      this.navLinks = [
        { path: 'dashboard', label: 'Dashboard', icon: icons['dashboard'] },
        { path: 'schedule', label: 'My Schedule', icon: icons['schedule'] },
        { path: 'availability', label: 'Availability', icon: icons['check'] }
      ];
    }
  }
}
