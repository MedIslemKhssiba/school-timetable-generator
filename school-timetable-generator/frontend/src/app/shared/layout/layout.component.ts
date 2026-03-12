import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { ContainerComponent } from '@coreui/angular';
import { ProfileComponent } from '../../features/profile/profile.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    ContainerComponent, ProfileComponent
  ],
  template: `
    <div class="app-sidebar" [class.mobile-open]="sidebarMobileOpen">
      <div class="sidebar-brand">
        <a class="brand-link" routerLink="./">
          <img src="https://i.postimg.cc/9QHRyzcn/Logo-ecocode.png" alt="Logo" class="brand-logo" />
        </a>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-title">{{ t('main_menu') }}</div>
        @for (link of navLinks; track link.path) {
          <a class="nav-entry" [routerLink]="link.path" routerLinkActive="active">
            <span class="nav-icon" [innerHTML]="link.icon"></span>
            <span class="nav-label">{{ link.label }}</span>
          </a>
        }
        <div class="nav-divider"></div>
        <div class="nav-section-title">{{ t('account') }}</div>
        <a class="nav-entry" (click)="showProfilePanel = true" [class.active]="showProfilePanel" style="cursor:pointer">
          <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
          <span class="nav-label">{{ t('my_profile') }}</span>
        </a>
        <a class="nav-entry logout-entry" (click)="logout()">
          <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></span>
          <span class="nav-label">{{ t('sign_out') }}</span>
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

    <div class="app-main">
      <header class="app-header">
        <button class="menu-toggle d-lg-none" (click)="sidebarMobileOpen = !sidebarMobileOpen" aria-label="Toggle menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        <div class="header-breadcrumb d-none d-md-flex">
        </div>

        <span class="ms-auto"></span>

        <div class="header-user" (click)="showProfilePanel = true" style="cursor: pointer;">
          <div class="user-toggle">
            <div class="user-avatar-sm">{{ userInitials }}</div>
            <div class="d-none d-md-flex flex-column lh-sm">
              <span class="user-name">{{ userName }}</span>
              <span class="user-role">{{ roleLabel }}</span>
            </div>
          </div>
        </div>
      </header>

      <div class="app-body">
        <c-container [fluid]="true" class="px-4 py-4">
          <router-outlet></router-outlet>
        </c-container>
      </div>
    </div>

    <!-- Profile Panel -->
    @if (showProfilePanel) {
      <div class="profile-backdrop" (click)="showProfilePanel = false"></div>
      <div class="profile-panel">
        <div class="profile-panel-header">
          <h3>{{ t('my_profile') }}</h3>
          <button class="panel-close" (click)="showProfilePanel = false">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="profile-panel-body">
          <app-profile></app-profile>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: flex; min-height: 100vh; background: #F0F4FA; }

    /* ── SIDEBAR ── */
    .app-sidebar {
      width: 272px; min-height: 100vh;
      background: linear-gradient(180deg, #1E3A8A 0%, #172554 100%);
      color: white;
      display: flex; flex-direction: column;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: fixed; top: 0; left: 0; z-index: 1030; height: 100vh;
      overflow-y: auto; overflow-x: hidden;
      box-shadow: 4px 0 24px rgba(13, 20, 40, 0.12);
    }

    .sidebar-brand {
      display: flex; align-items: center; justify-content: center;
      padding: 1.35rem 1.5rem; min-height: 68px;
      border-bottom: 1px solid rgba(248, 250, 255,0.06);
    }
    .brand-link {
      display: flex; align-items: center; gap: 12px;
      text-decoration: none; color: white;
    }
    .brand-logo {
      width: 80px; height: 80px; border-radius: 0;
      object-fit: contain; flex-shrink: 0;
    }

    .sidebar-nav { flex: 1; padding: 0.75rem; }
    .nav-section-title {
      padding: 1rem 1rem 0.4rem; font-size: 0.62rem; font-weight: 700;
      font-family: 'Montserrat', sans-serif;
      text-transform: uppercase; letter-spacing: 0.12em; color: rgba(248, 250, 255,0.25);
    }
    .nav-divider { height: 1px; background: rgba(248, 250, 255,0.06); margin: 0.75rem 0; }

    .nav-entry {
      display: flex; align-items: center; gap: 12px; padding: 0.7rem 1rem;
      border-radius: 10px; color: rgba(248, 250, 255,0.75); text-decoration: none;
      font-size: 0.875rem; font-weight: 500; cursor: pointer;
      font-family: 'Montserrat', sans-serif;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      margin-bottom: 3px; position: relative;
    }
    .nav-entry:hover { color: rgba(248, 250, 255,0.95); background: rgba(248, 250, 255,0.06); }
    .nav-entry.active {
      color: #F0F4FA;
      background: rgba(37, 99, 235,0.35);
      font-weight: 600;
      box-shadow: 0 2px 10px rgba(37, 99, 235,0.2);
    }
    .nav-entry.active::before {
      content: ''; position: absolute; left: -12px; top: 50%; transform: translateY(-50%);
      width: 4px; height: 22px; background: #93C5FD; border-radius: 0 3px 3px 0;
    }
    .nav-entry.logout-entry { color: rgba(248, 250, 255,0.35); }
    .nav-entry.logout-entry:hover { color: #E07B5B; background: rgba(196,69,54,0.15); }

    .nav-icon { display: flex; flex-shrink: 0; }
    .nav-icon :deep(svg) { fill: currentColor; }

    /* ── SIDEBAR FOOTER ── */
    .sidebar-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid rgba(248, 250, 255,0.06);
    }
    .footer-user {
      display: flex; align-items: center; gap: 10px;
    }
    .footer-avatar {
      width: 38px; height: 38px; border-radius: 10px;
      background: #2563EB;
      color: #F0F4FA; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
      font-family: 'Montserrat', sans-serif;
    }
    .footer-info { display: flex; flex-direction: column; overflow: hidden; }
    .footer-name {
      font-size: 0.8rem; font-weight: 600; color: rgba(248, 250, 255,0.85);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      font-family: 'Montserrat', sans-serif;
    }
    .footer-role {
      font-size: 0.7rem; color: rgba(248, 250, 255,0.35);
      font-family: 'Montserrat', sans-serif;
    }

    .sidebar-backdrop {
      position: fixed; inset: 0; background: rgba(13, 20, 40,0.4); z-index: 1029;
      backdrop-filter: blur(3px);
    }

    /* ── MAIN AREA ── */
    .app-main {
      flex: 1; min-width: 0; display: flex; flex-direction: column;
      margin-left: 272px;
    }

    .app-header {
      height: 68px; background: #FAFCFF;
      border-bottom: 1px solid #DDE3EE;
      display: flex; align-items: center; padding: 0 1.25rem; gap: 0.75rem;
      position: sticky; top: 0; z-index: 1020;
      box-shadow: 0 1px 3px rgba(13, 27, 62, 0.04);
    }

    .menu-toggle {
      cursor: pointer; padding: 0.4rem; border: none; background: transparent;
      border-radius: 8px; display: flex; align-items: center;
      color: #3E4C5E; transition: all 0.15s;
      font-size: 1.4rem;
    }
    .menu-toggle:hover { background: #F0F4FA; color: #2563EB; }

    .header-breadcrumb {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; color: #8D99A8;
    }

    /* ── HEADER USER ── */
    .header-user { position: relative; }
    .user-toggle {
      cursor: pointer; text-decoration: none; color: inherit;
      display: flex; align-items: center; gap: 10px;
      padding: 6px 10px; border-radius: 12px; transition: background 0.2s;
    }
    .user-toggle:hover { background: #F0F4FA; }
    .user-toggle::after { display: none !important; }

    .user-avatar-sm {
      width: 40px; height: 40px; border-radius: 12px;
      background: #2563EB;
      color: #F0F4FA; display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
      font-family: 'Montserrat', sans-serif;
      box-shadow: 0 2px 8px rgba(37, 99, 235,0.18);
    }

    .user-name { font-weight: 600; font-size: 0.85rem; color: #1A2332; font-family: 'Montserrat', sans-serif; }
    .user-role { font-size: 0.72rem; color: #8D99A8; font-family: 'Montserrat', sans-serif; }

    .app-body { flex: 1; }
    .cursor-pointer { cursor: pointer; }

    @media (max-width: 991.98px) {
      .app-sidebar { transform: translateX(-100%); }
      .app-sidebar.mobile-open { transform: translateX(0); }
      .app-main { margin-left: 0 !important; }
    }

    /* ── PROFILE PANEL ── */
    .profile-backdrop {
      position: fixed; inset: 0; background: rgba(13, 20, 40, 0.4);
      z-index: 1040; backdrop-filter: blur(3px);
      animation: fadeIn 200ms ease;
    }
    .profile-panel {
      position: fixed; top: 0; right: 0; width: 480px; max-width: 100vw;
      height: 100vh; background: #F8FAFF; z-index: 1041;
      box-shadow: -8px 0 40px rgba(13, 20, 40, 0.15);
      display: flex; flex-direction: column;
      animation: slideIn 250ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    .profile-panel-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-bottom: 1px solid #DDE3EE;
      h3 { margin: 0; font-family: 'Montserrat', sans-serif;
           font-size: 1.25rem; font-weight: 700; color: #1A2332; }
    }
    .panel-close {
      background: none; border: none; cursor: pointer; color: #8D99A8;
      padding: 6px; border-radius: 8px; display: flex;
      transition: all 0.15s;
      &:hover { background: #EAEEF6; color: #1A2332; }
    }
    .profile-panel-body {
      flex: 1; overflow-y: auto; padding: 0;
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    @media (max-width: 576px) {
      .profile-panel { width: 100vw; }
    }
  `]
})
export class LayoutComponent implements OnInit {
  userName = '';
  userInitials = '';
  roleLabel = '';
  navLinks: { path: string; label: string; icon: string }[] = [];
  sidebarMobileOpen = false;
  showProfilePanel = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public translationService: TranslationService
  ) {}

  t(key: string): string {
    return this.translationService.t(key);
  }

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

  private svg(d: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  }

  private setNavLinks(role: string): void {
    const icons = {
      dashboard: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
      schools: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
      admins: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      teachers: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
      classes: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
      subjects: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
      rooms: '<path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M9 21V9"/>',
      timetable: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
      timeslots: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
      schedule: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
      availability: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'
    };

    if (role === 'ROLE_SUPER_ADMIN') {
      this.roleLabel = this.t('super_admin');
      this.navLinks = [
        { path: 'dashboard', label: this.t('dashboard'), icon: this.svg(icons.dashboard) },
        { path: 'schools', label: this.t('schools'), icon: this.svg(icons.schools) },
        { path: 'admins', label: this.t('administrators'), icon: this.svg(icons.admins) }
      ];
    } else if (role === 'ROLE_ADMIN') {
      this.roleLabel = this.t('administrator');
      this.navLinks = [
        { path: 'dashboard', label: this.t('dashboard'), icon: this.svg(icons.dashboard) },
        { path: 'teachers', label: this.t('teachers'), icon: this.svg(icons.teachers) },
        { path: 'classes', label: this.t('classes'), icon: this.svg(icons.classes) },
        { path: 'subjects', label: this.t('subjects'), icon: this.svg(icons.subjects) },
        { path: 'rooms', label: this.t('rooms'), icon: this.svg(icons.rooms) },
        { path: 'timeslots', label: this.t('timeslots') || 'Créneaux', icon: this.svg(icons.timeslots) },
        { path: 'timetable', label: this.t('timetable'), icon: this.svg(icons.timetable) }
      ];
    } else {
      this.roleLabel = this.t('role_teacher');
      this.navLinks = [
        { path: 'dashboard', label: this.t('dashboard'), icon: this.svg(icons.dashboard) },
        { path: 'schedule', label: this.t('my_schedule'), icon: this.svg(icons.schedule) },
        { path: 'availability', label: this.t('availability'), icon: this.svg(icons.availability) }
      ];
    }
  }
}
