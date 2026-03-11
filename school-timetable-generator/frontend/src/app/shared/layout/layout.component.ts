import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { ContainerComponent } from '@coreui/angular';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    ContainerComponent
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
            <span class="nav-label">{{ link.label }}</span>
          </a>
        }
        <div class="nav-divider"></div>
        <div class="nav-section-title">{{ t('account') }}</div>
        <a class="nav-entry" routerLink="/profile" routerLinkActive="active">
          <span class="nav-label">{{ t('my_profile') }}</span>
        </a>
        <a class="nav-entry logout-entry" (click)="logout()">
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
          &#9776;
        </button>

        <div class="header-breadcrumb d-none d-md-flex">
        </div>

        <span class="ms-auto"></span>

        <div class="header-user" routerLink="/profile" style="cursor: pointer;">
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
  `,
  styles: [`
    :host { display: flex; min-height: 100vh; background: #F8FAFC; }

    /* ── SIDEBAR ── */
    .app-sidebar {
      width: 260px; min-height: 100vh;
      background: linear-gradient(180deg, #0F172A 0%, #020617 100%);
      color: white;
      display: flex; flex-direction: column;
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: fixed; top: 0; left: 0; z-index: 1030; height: 100vh;
      overflow-y: auto; overflow-x: hidden;
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08);
    }

    .sidebar-brand {
      display: flex; align-items: center; justify-content: center;
      padding: 1.25rem 1.5rem; min-height: 64px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
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
      padding: 1rem 1rem 0.4rem; font-size: 0.65rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.3);
    }
    .nav-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 0.75rem 0; }

    .nav-entry {
      display: flex; align-items: center; gap: 12px; padding: 0.65rem 1rem;
      border-radius: 10px; color: rgba(255,255,255,0.85); text-decoration: none;
      font-size: 0.875rem; font-weight: 500; cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      margin-bottom: 3px; position: relative;
    }
    .nav-entry:hover { color: white; background: rgba(255,255,255,0.07); }
    .nav-entry.active {
      color: white;
      background: linear-gradient(135deg, rgba(37,99,235,0.6), rgba(96,165,250,0.4));
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(37,99,235,0.3);
    }
    .nav-entry.active::before {
      content: ''; position: absolute; left: -12px; top: 50%; transform: translateY(-50%);
      width: 4px; height: 20px; background: #60A5FA; border-radius: 0 3px 3px 0;
    }
    .nav-entry.logout-entry { color: rgba(255,255,255,0.4); }
    .nav-entry.logout-entry:hover { color: #FCA5A5; background: rgba(239,68,68,0.15); }

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
      background: linear-gradient(135deg, #2563EB, #60A5FA);
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
      margin-left: 260px;
    }

    .app-header {
      height: 64px; background: white;
      border-bottom: 1px solid #E2E8F0;
      display: flex; align-items: center; padding: 0 1.25rem; gap: 0.75rem;
      position: sticky; top: 0; z-index: 1020;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
    }

    .menu-toggle {
      cursor: pointer; padding: 0.4rem; border: none; background: transparent;
      border-radius: 8px; display: flex; align-items: center;
      color: #475569; transition: all 0.15s;
      font-size: 1.4rem;
    }
    .menu-toggle:hover { background: #F1F5F9; color: #2563EB; }

    .header-breadcrumb {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; color: #94A3B8;
    }
    .breadcrumb-app { font-weight: 600; color: #475569; }

    /* ── HEADER USER ── */
    .header-user { position: relative; }
    .user-toggle {
      cursor: pointer; text-decoration: none; color: inherit;
      display: flex; align-items: center; gap: 10px;
      padding: 6px 10px; border-radius: 10px; transition: background 0.15s;
    }
    .user-toggle:hover { background: #F1F5F9; }
    .user-toggle::after { display: none !important; }

    .user-avatar-sm {
      width: 38px; height: 38px; border-radius: 10px;
      background: linear-gradient(135deg, #2563EB, #60A5FA);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(37,99,235,0.2);
    }

    .user-name { font-weight: 600; font-size: 0.85rem; color: #0F172A; }
    .user-role { font-size: 0.72rem; color: #94A3B8; }
    .dropdown-chevron { color: #94A3B8; margin-left: -2px; }

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
  navLinks: { path: string; label: string }[] = [];
  sidebarMobileOpen = false;

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

  private setNavLinks(role: string): void {
    if (role === 'ROLE_SUPER_ADMIN') {
      this.roleLabel = this.t('super_admin');
      this.navLinks = [
        { path: 'dashboard', label: this.t('dashboard') },
        { path: 'schools', label: this.t('schools') },
        { path: 'admins', label: this.t('administrators') }
      ];
    } else if (role === 'ROLE_ADMIN') {
      this.roleLabel = this.t('administrator');
      this.navLinks = [
        { path: 'dashboard', label: this.t('dashboard') },
        { path: 'teachers', label: this.t('teachers') },
        { path: 'classes', label: this.t('classes') },
        { path: 'subjects', label: this.t('subjects') },
        { path: 'rooms', label: this.t('rooms') },
        { path: 'timetable', label: this.t('timetable') }
      ];
    } else {
      this.roleLabel = this.t('role_teacher');
      this.navLinks = [
        { path: 'dashboard', label: this.t('dashboard') },
        { path: 'schedule', label: this.t('my_schedule') },
        { path: 'availability', label: this.t('availability') }
      ];
    }
  }
}
