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
          <img src="https://i.postimg.cc/9QHRyzcn/Logo-ecocode.png" alt="EcoCode" class="brand-logo" />
          <span class="brand-text">EcoCode</span>
        </a>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-title">MAIN MENU</div>
        @for (link of navLinks; track link.path) {
          <a class="nav-entry" [routerLink]="link.path" routerLinkActive="active">
            <span class="nav-icon" [innerHTML]="link.icon"></span>
            <span class="nav-label">{{ link.label }}</span>
          </a>
        }
        <div class="nav-divider"></div>
        <div class="nav-section-title">ACCOUNT</div>
        <a class="nav-entry" routerLink="/profile" routerLinkActive="active">
          <span class="nav-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></span>
          <span class="nav-label">My Profile</span>
        </a>
        <a class="nav-entry logout-entry" (click)="logout()">
          <span class="nav-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg></span>
          <span class="nav-label">Sign Out</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="footer-user">
          <div class="footer-avatar">{{ userInitials }}</div>
          <div class="footer-info">
            <span class="footer-name">{{ userName }}</span>
            <span class="footer-role">{{ roleLabel }}</span>
          </div>
        </div>
      </div>
    </div>

    @if (sidebarMobileOpen) {
      <div class="sidebar-backdrop" (click)="sidebarMobileOpen = false"></div>
    }

    <div class="app-main" [class.sidebar-collapsed]="sidebarCollapsed">
      <header class="app-header">
        <button class="menu-toggle d-lg-none" (click)="sidebarMobileOpen = !sidebarMobileOpen" aria-label="Toggle menu">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
        </button>
        <button class="menu-toggle d-none d-lg-flex" (click)="sidebarCollapsed = !sidebarCollapsed" aria-label="Collapse sidebar">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
        </button>

        <div class="header-breadcrumb d-none d-md-flex">
          <span class="breadcrumb-app">EcoCode</span>
        </div>

        <span class="ms-auto"></span>

        <c-dropdown class="header-user">
          <a cDropdownToggle class="user-toggle">
            <div class="user-avatar-sm">{{ userInitials }}</div>
            <div class="d-none d-md-flex flex-column lh-sm">
              <span class="user-name">{{ userName }}</span>
              <span class="user-role">{{ roleLabel }}</span>
            </div>
            <svg class="dropdown-chevron d-none d-md-block" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
          </a>
          <div cDropdownMenu class="dropdown-menu-end">
            <div class="dropdown-header">Account</div>
            <a cDropdownItem routerLink="/profile">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="me-2"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              Profile
            </a>
            <div class="dropdown-divider"></div>
            <a cDropdownItem (click)="logout()" class="cursor-pointer text-danger">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="me-2"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
              Sign Out
            </a>
          </div>
        </c-dropdown>
      </header>

      <div class="app-body">
        <c-container [fluid]="true" class="px-4 py-4">
          <router-outlet></router-outlet>
        </c-container>
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; min-height: 100vh; background: #F0F4F8; }

    /* ── SIDEBAR ── */
    .app-sidebar {
      width: 260px; min-height: 100vh;
      background: linear-gradient(180deg, #102A43 0%, #0B1F33 100%);
      color: white;
      display: flex; flex-direction: column;
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: fixed; top: 0; left: 0; z-index: 1030; height: 100vh;
      overflow-y: auto; overflow-x: hidden;
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
    }
    .app-sidebar.collapsed { width: 68px; }
    .app-sidebar.collapsed .brand-text,
    .app-sidebar.collapsed .nav-label,
    .app-sidebar.collapsed .nav-section-title,
    .app-sidebar.collapsed .sidebar-footer .footer-info { display: none; }
    .app-sidebar.collapsed .sidebar-brand { justify-content: center; padding: 1rem 0.5rem; }
    .app-sidebar.collapsed .nav-entry { justify-content: center; padding: 0.65rem; }
    .app-sidebar.collapsed .sidebar-footer { padding: 0.75rem; justify-content: center; }

    .sidebar-brand {
      display: flex; align-items: center; justify-content: flex-start;
      padding: 1.25rem 1.5rem; min-height: 64px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .brand-link {
      display: flex; align-items: center; gap: 12px;
      text-decoration: none; color: white;
    }
    .brand-logo {
      width: 38px; height: 38px; border-radius: 10px;
      object-fit: contain; flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(21, 101, 192, 0.35);
    }
    .brand-text { font-size: 1.2rem; font-weight: 800; letter-spacing: -0.02em; }

    .sidebar-nav { flex: 1; padding: 0.75rem; }
    .nav-section-title {
      padding: 1rem 1rem 0.4rem; font-size: 0.65rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.3);
    }
    .nav-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 0.75rem 0; }

    .nav-entry {
      display: flex; align-items: center; gap: 12px; padding: 0.65rem 1rem;
      border-radius: 10px; color: rgba(255,255,255,0.6); text-decoration: none;
      font-size: 0.875rem; font-weight: 500; cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      margin-bottom: 3px; position: relative;
    }
    .nav-entry:hover { color: white; background: rgba(255,255,255,0.07); }
    .nav-entry.active {
      color: white;
      background: linear-gradient(135deg, rgba(21,101,192,0.6), rgba(66,165,245,0.4));
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(21,101,192,0.3);
    }
    .nav-entry.active::before {
      content: ''; position: absolute; left: -12px; top: 50%; transform: translateY(-50%);
      width: 4px; height: 20px; background: #42A5F5; border-radius: 0 3px 3px 0;
    }
    .nav-entry.logout-entry { color: rgba(255,255,255,0.4); }
    .nav-entry.logout-entry:hover { color: #ef9a9a; background: rgba(198,40,40,0.15); }

    .nav-icon { display: flex; flex-shrink: 0; }
    .nav-icon :deep(svg) { fill: currentColor; }

    /* ── SIDEBAR FOOTER ── */
    .sidebar-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .footer-user {
      display: flex; align-items: center; gap: 10px;
    }
    .footer-avatar {
      width: 36px; height: 36px; border-radius: 10px;
      background: linear-gradient(135deg, #1565C0, #42A5F5);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
    }
    .footer-info { display: flex; flex-direction: column; overflow: hidden; }
    .footer-name {
      font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.9);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .footer-role {
      font-size: 0.7rem; color: rgba(255,255,255,0.4);
    }

    .sidebar-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 1029;
      backdrop-filter: blur(2px);
    }

    /* ── MAIN AREA ── */
    .app-main {
      flex: 1; min-width: 0; display: flex; flex-direction: column;
      margin-left: 260px; transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .app-main.sidebar-collapsed { margin-left: 68px; }

    .app-header {
      height: 64px; background: white;
      border-bottom: 1px solid #E2E8F0;
      display: flex; align-items: center; padding: 0 1.25rem; gap: 0.75rem;
      position: sticky; top: 0; z-index: 1020;
      box-shadow: 0 1px 3px rgba(16, 42, 67, 0.04);
    }

    .menu-toggle {
      cursor: pointer; padding: 0.4rem; border: none; background: transparent;
      border-radius: 8px; display: flex; align-items: center;
      color: #636E80; transition: all 0.15s;
    }
    .menu-toggle:hover { background: #F0F4F8; color: #1565C0; }

    .header-breadcrumb {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; color: #8892A4;
    }
    .breadcrumb-app { font-weight: 600; color: #636E80; }

    /* ── HEADER USER ── */
    .header-user { position: relative; }
    .user-toggle {
      cursor: pointer; text-decoration: none; color: inherit;
      display: flex; align-items: center; gap: 10px;
      padding: 6px 10px; border-radius: 10px; transition: background 0.15s;
    }
    .user-toggle:hover { background: #F0F4F8; }
    .user-toggle::after { display: none !important; }

    .user-avatar-sm {
      width: 38px; height: 38px; border-radius: 10px;
      background: linear-gradient(135deg, #1565C0, #42A5F5);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(21,101,192,0.2);
    }

    .user-name { font-weight: 600; font-size: 0.85rem; color: #1A2236; }
    .user-role { font-size: 0.72rem; color: #8892A4; }
    .dropdown-chevron { color: #B0B8C9; margin-left: -2px; }

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
      if (!user) return;
      this.userName = `${user.firstName} ${user.lastName}`;
      this.userInitials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
      this.setNavLinks(user.role);
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
