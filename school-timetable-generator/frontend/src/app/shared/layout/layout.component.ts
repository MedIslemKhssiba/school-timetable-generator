import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import { ContainerComponent } from '@coreui/angular';
import { ProfileComponent } from '../../features/profile/profile.component';
import { FormsModule } from '@angular/forms';
import { NotificationService, Toast } from '../../core/services/notification.service';
import { Subscription, forkJoin } from 'rxjs';
import { AdminService } from '../../core/services/admin.service';
import { SuperAdminService } from '../../core/services/super-admin.service';
import { Lesson } from '../../core/models';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    ContainerComponent, ProfileComponent, FormsModule
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
        <a class="nav-entry account-entry" (click)="showProfilePanel = true" [class.active]="showProfilePanel" style="cursor:pointer">
          <span class="nav-icon" [innerHTML]="accountIcons.profile"></span>
          <span class="nav-label">{{ t('my_profile') }}</span>
        </a>
        <a class="nav-entry logout-entry" (click)="logout()">
          <span class="nav-icon" [innerHTML]="accountIcons.logout"></span>
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
          <svg class="menu-toggle-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        <div class="header-breadcrumb d-none d-md-flex"></div>

        <div class="header-search d-none d-md-flex">
          <span class="search-ico">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input
            type="text"
            [(ngModel)]="globalSearch"
            [placeholder]="t('search')"
            (focus)="showSearchResults = true"
            (input)="updateSearchResults()"
            (keydown.enter)="openFirstSearchResult()"
          />

          @if (showSearchResults && globalSearch.trim()) {
            <div class="search-panel">
              @if (searchResults.length > 0) {
                @for (item of searchResults; track item.path + item.label) {
                  <button class="search-item" (click)="goToSearch(item)">
                    <span class="search-item-icon" [innerHTML]="item.icon"></span>
                    <span class="search-item-label">{{ item.label }}</span>
                  </button>
                }
              } @else {
                <div class="search-empty">Aucun resultat</div>
              }
            </div>
          }
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
          <button class="panel-close" (click)="showProfilePanel = false" aria-label="Fermer">
            <svg class="panel-close-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="profile-panel-body">
          <app-profile></app-profile>
        </div>
      </div>
    }

    @if (showNotifPanel) {
      <div class="notif-backdrop" (click)="showNotifPanel = false"></div>
      <div class="notif-panel">
        <div class="notif-header">
          <h4>Notifications</h4>
          <button class="mark-read" (click)="markAllRead()">Tout lire</button>
        </div>
        <div class="notif-body">
          @if (headerNotifications.length === 0) {
            <div class="notif-empty">Aucune notification</div>
          } @else {
            @for (item of headerNotifications; track item.id) {
              <div class="notif-item" [class.unread]="!item.read">
                <div class="notif-dot" [class.info]="item.type === 'info'" [class.success]="item.type === 'success'" [class.warning]="item.type === 'warning'" [class.error]="item.type === 'error'"></div>
                <div class="notif-content">
                  <div class="notif-title">{{ item.title }}</div>
                  <div class="notif-message">{{ item.message }}</div>
                </div>
              </div>
            }
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: flex; min-height: 100vh; background: #EEF3FB; }

    /* ── SIDEBAR ── */
    .app-sidebar {
      width: 272px; min-height: 100vh;
      background:
        radial-gradient(circle at 15% 10%, rgba(88, 124, 255, 0.24), transparent 42%),
        linear-gradient(180deg, #0F172A 0%, #111A32 55%, #172554 100%);
      color: white;
      display: flex; flex-direction: column;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: fixed; top: 0; left: 0; z-index: 1030; height: 100vh;
      overflow-y: auto; overflow-x: hidden;
      box-shadow: 8px 0 28px rgba(2, 8, 23, 0.22);
      border-right: 1px solid rgba(148, 163, 184, 0.16);
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .app-sidebar::-webkit-scrollbar {
      width: 0;
      height: 0;
      display: none;
    }

    .sidebar-brand {
      display: flex; align-items: center; justify-content: center;
      padding: 1.2rem 1.25rem; min-height: 72px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    }
    .brand-link {
      display: flex; align-items: center; gap: 12px;
      text-decoration: none; color: white;
    }
    .brand-logo {
      width: 104px; height: 104px; border-radius: 0;
      object-fit: contain; flex-shrink: 0;
      filter: drop-shadow(0 8px 18px rgba(37, 99, 235, 0.25));
    }

    .sidebar-nav { flex: 1; padding: 0.75rem; }
    .nav-section-title {
      padding: 1rem 1rem 0.4rem; font-size: 0.62rem; font-weight: 700;
      font-family: 'Montserrat', sans-serif;
      text-transform: uppercase; letter-spacing: 0.12em; color: rgba(226, 232, 240,0.35);
    }
    .nav-divider { height: 1px; background: rgba(148, 163, 184,0.24); margin: 0.75rem 0; }

    .nav-entry {
      display: flex; align-items: center; gap: 0; padding: 0.7rem 1rem;
      border-radius: 12px; color: rgba(241, 245, 249,0.92); text-decoration: none;
      font-size: 0.875rem; font-weight: 500; cursor: pointer;
      font-family: 'Montserrat', sans-serif;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      margin-bottom: 4px; position: relative;
    }
    .nav-entry.account-entry,
    .nav-entry.logout-entry { gap: 12px; }
    .nav-entry:hover {
      color: #FFFFFF;
      background: linear-gradient(90deg, rgba(99, 102, 241, 0.22), rgba(56, 189, 248, 0.12));
      transform: translateX(2px);
    }
    .nav-entry.active {
      color: #F8FAFC;
      background: linear-gradient(90deg, rgba(59, 130, 246,0.5), rgba(14, 165, 233,0.22));
      font-weight: 600;
      box-shadow: 0 8px 20px rgba(59, 130, 246,0.22);
    }
    .nav-entry.active::before {
      content: ''; position: absolute; left: -12px; top: 50%; transform: translateY(-50%);
      width: 4px; height: 24px; background: #7DD3FC; border-radius: 0 3px 3px 0;
    }
    .nav-entry.logout-entry { color: #FFFFFF; }
    .nav-entry.logout-entry .nav-icon { color: #FFFFFF; }
    .nav-entry.logout-entry:hover { color: #EF4444; background: rgba(239,68,68,0.15); }
    .nav-entry.logout-entry:hover .nav-icon { color: #EF4444; }

    .nav-icon { display: none; flex-shrink: 0; color: #FFFFFF; }
    .nav-entry.account-entry .nav-icon,
    .nav-entry.logout-entry .nav-icon { display: flex; }
    .nav-icon :deep(svg) { fill: currentColor; stroke: none; }

    /* ── SIDEBAR FOOTER ── */
    .sidebar-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid rgba(148, 163, 184,0.24);
    }
    .footer-user {
      display: flex; align-items: center; gap: 10px;
    }
    .footer-avatar {
      width: 38px; height: 38px; border-radius: 10px;
      background: linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%);
      color: #F0F4FA; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
      font-family: 'Montserrat', sans-serif;
      box-shadow: 0 8px 18px rgba(37, 99, 235, 0.25);
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
      position: relative;
    }

    .app-main::before {
      content: '';
      position: fixed;
      top: -120px;
      right: -120px;
      width: 340px;
      height: 340px;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.16), rgba(59, 130, 246, 0));
      pointer-events: none;
      z-index: 0;
    }

    .app-header {
      height: 72px;
      background: rgba(255, 255, 255, 0.76);
      border-bottom: 1px solid rgba(170, 184, 206, 0.32);
      display: flex; align-items: center; padding: 0 1.1rem; gap: 0.75rem;
      position: sticky; top: 0; z-index: 1020;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
      backdrop-filter: blur(10px);
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

    .header-search {
      position: relative;
      width: min(420px, 42vw);
      height: 42px;
      border: 1px solid rgba(191, 209, 236, 0.8);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      padding: 0 10px;
      margin-left: 0.5rem;
    }
    .header-search:focus-within {
      border-color: #5E8FF8;
      box-shadow: 0 0 0 0.2rem rgba(37, 99, 235, 0.12);
    }
    .search-ico {
      color: #8D99A8;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: 8px;
    }
    .header-search input {
      border: none !important;
      background: transparent !important;
      box-shadow: none !important;
      width: 100%;
      font-size: 0.85rem;
      color: #1A2332;
      padding: 0 !important;
    }
    .header-search input:focus {
      border: none !important;
      box-shadow: none !important;
      outline: none !important;
    }
    .search-panel {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      width: 100%;
      background: #FFFFFF;
      border: 1px solid #DDE3EE;
      border-radius: 14px;
      box-shadow: 0 16px 30px rgba(15, 23, 42, 0.13);
      z-index: 1100;
      overflow: hidden;
      max-height: 260px;
      overflow-y: auto;
    }
    .search-item {
      width: 100%;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      gap: 0;
      padding: 10px 12px;
      text-align: left;
      cursor: pointer;
      border-bottom: 1px solid #EEF2F7;
      &:last-child { border-bottom: none; }
      &:hover { background: #F3F7FF; }
    }
    .search-item-icon { color: #2563EB; display: none; }
    .search-item-icon :deep(svg) { width: 16px; height: 16px; fill: currentColor; }
    .search-item-label { font-size: 0.84rem; color: #1A2332; font-weight: 600; }
    .search-empty { padding: 12px; font-size: 0.82rem; color: #8D99A8; }

    .header-action {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      border: 1px solid rgba(191, 209, 236, 0.8);
      background: rgba(255, 255, 255, 0.9);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #3E4C5E;
      position: relative;
      transition: all 0.2s;
    }
    .header-action:hover { background: #F0F4FA; color: #2563EB; }
    .notif-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      min-width: 18px;
      height: 18px;
      border-radius: 999px;
      background: #EF4444;
      color: #fff;
      font-size: 0.68rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      padding: 0 4px;
    }

    /* ── HEADER USER ── */
    .header-user { position: relative; }
    .user-toggle {
      cursor: pointer; text-decoration: none; color: inherit;
      display: flex; align-items: center; gap: 10px;
      padding: 7px 10px; border-radius: 12px; transition: background 0.2s;
      border: 1px solid rgba(191, 209, 236, 0.7);
      background: rgba(255, 255, 255, 0.9);
    }
    .user-toggle:hover { background: #F0F4FA; box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08); }
    .user-toggle::after { display: none !important; }

    .user-avatar-sm {
      width: 40px; height: 40px; border-radius: 12px;
      background: linear-gradient(135deg, #2563EB, #0EA5E9);
      color: #F0F4FA; display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
      font-family: 'Montserrat', sans-serif;
      box-shadow: 0 8px 18px rgba(37, 99, 235,0.2);
    }

    .user-name { font-weight: 600; font-size: 0.85rem; color: #1A2332; font-family: 'Montserrat', sans-serif; }
    .user-role { font-size: 0.72rem; color: #8D99A8; font-family: 'Montserrat', sans-serif; }

    .app-body {
      flex: 1;
      padding: 1.1rem;
      position: relative;
      z-index: 1;
    }

    .app-body :deep(.container-fluid) {
      max-width: 1480px;
      margin: 0 auto;
      border-radius: 24px;
    }
    .cursor-pointer { cursor: pointer; }

    @media (max-width: 991.98px) {
      .app-sidebar { transform: translateX(-100%); }
      .app-sidebar.mobile-open { transform: translateX(0); }
      .app-main { margin-left: 0 !important; }
      .nav-entry,
      .nav-entry.account-entry,
      .nav-entry.logout-entry { gap: 0; }
      .nav-icon,
      .nav-entry.account-entry .nav-icon,
      .nav-entry.logout-entry .nav-icon { display: none !important; }
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
      width: 42px; height: 42px;
      background: none; border: none; cursor: pointer; color: #8D99A8;
      padding: 0; border-radius: 10px; display: inline-flex;
      align-items: center; justify-content: center;
      transition: all 0.15s;
      &:hover { background: #EAEEF6; color: #1A2332; }
    }
    .profile-panel-body {
      flex: 1; overflow-y: auto; padding: 0;
    }

    .notif-backdrop {
      position: fixed;
      inset: 0;
      background: transparent;
      z-index: 1041;
    }
    .notif-panel {
      position: fixed;
      top: 80px;
      right: 18px;
      width: min(360px, calc(100vw - 24px));
      background: #fff;
      border: 1px solid #DDE3EE;
      border-radius: 16px;
      box-shadow: 0 20px 34px rgba(15, 23, 42, 0.16);
      z-index: 1042;
      overflow: hidden;
    }
    .notif-header {
      padding: 12px 14px;
      border-bottom: 1px solid #EEF2F7;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .notif-header h4 {
      margin: 0;
      font-size: 0.92rem;
      font-weight: 700;
      color: #1A2332;
    }
    .mark-read {
      border: none;
      background: transparent;
      color: #2563EB;
      font-size: 0.76rem;
      font-weight: 600;
      cursor: pointer;
    }
    .notif-body {
      max-height: 380px;
      overflow-y: auto;
    }
    .notif-empty {
      padding: 14px;
      color: #8D99A8;
      font-size: 0.82rem;
    }
    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      border-bottom: 1px solid #F3F5FA;
    }
    .notif-item.unread { background: #F8FBFF; }
    .notif-dot {
      width: 8px;
      height: 8px;
      margin-top: 6px;
      border-radius: 999px;
      background: #94A3B8;
      flex-shrink: 0;
    }
    .notif-dot.info { background: #3B82F6; }
    .notif-dot.success { background: #10B981; }
    .notif-dot.warning { background: #F59E0B; }
    .notif-dot.error { background: #EF4444; }
    .notif-title { font-size: 0.82rem; color: #1A2332; font-weight: 700; }
    .notif-message { font-size: 0.77rem; color: #64748B; }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    @media (max-width: 576px) {
      .profile-panel { width: 100vw; }
      .notif-panel {
        top: 70px;
        right: 8px;
      }
    }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  userName = '';
  userInitials = '';
  roleLabel = '';
  navLinks: { path: string; label: string; icon: SafeHtml }[] = [];
  sidebarMobileOpen = false;
  showProfilePanel = false;
  showNotifPanel = false;
  globalSearch = '';
  searchResults: { path: string; label: string; icon: SafeHtml; queryTerm?: string }[] = [];
  showSearchResults = false;
  roleBasePath = '/teacher';
  currentRole = '';
  headerNotifications: Array<{ id: number; title: string; message: string; read: boolean; type: Toast['type'] }> = [];
  searchCatalog: Array<{ path: string; label: string; icon: SafeHtml; queryTerm?: string }> = [];
  private toastSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    public translationService: TranslationService,
    private sanitizer: DomSanitizer,
    private notif: NotificationService,
    private adminService: AdminService,
    private superAdminService: SuperAdminService,
    private http: HttpClient
  ) {}

  t(key: string): string {
    return this.translationService.t(key);
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (!user) return;
      this.userName = `${user.firstName} ${user.lastName}`;
      this.userInitials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
      this.currentRole = user.role;
      this.setNavLinks(user.role);
      this.seedRoleNotifications(user.role);
      this.updateSearchResults();
      this.preloadSearchCatalog();
    });

    this.toastSub = this.notif.toasts$.subscribe(toasts => {
      const mapped = toasts.map(t => ({
        id: 100000 + t.id,
        title: this.toastTitle(t.type),
        message: t.message,
        read: false,
        type: t.type
      }));
      const base = this.headerNotifications.filter(n => n.id < 100000);
      this.headerNotifications = [...mapped, ...base].slice(0, 16);
    });
  }

  ngOnDestroy(): void {
    this.toastSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarMobileOpen = !this.sidebarMobileOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  updateSearchResults(): void {
    const term = this.globalSearch.trim().toLowerCase();
    const catalog = this.searchCatalog.length > 0
      ? this.searchCatalog
      : this.navLinks.map(link => ({ label: link.label, path: `${this.roleBasePath}/${link.path}`, icon: link.icon }));
    this.searchResults = term
      ? catalog.filter(item => item.label.toLowerCase().includes(term)).slice(0, 8)
      : [];
  }

  private preloadSearchCatalog(): void {
    const navItems = this.navLinks.map(link => ({
      label: link.label,
      path: `${this.roleBasePath}/${link.path}`,
      icon: link.icon
    }));

    const merged = [...navItems];
    const addUnique = (item: { path: string; label: string; icon: SafeHtml; queryTerm?: string }) => {
      if (!merged.some(x => x.path === item.path && x.label === item.label)) {
        merged.push(item);
      }
    };

    if (this.currentRole === 'ROLE_SUPER_ADMIN') {
      forkJoin({
        schools: this.superAdminService.getSchools(),
        admins: this.superAdminService.getAdmins()
      }).subscribe({
        next: ({ schools, admins }) => {
          schools.forEach(s => addUnique({ path: '/super-admin/schools', label: `Ecole: ${s.name}`, queryTerm: s.name, icon: this.svg('<path d="M12 3.172 3 10v10a1 1 0 0 0 1 1h5v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6h5a1 1 0 0 0 1-1V10l-9-6.828Z"/>') }));
          admins.forEach(a => addUnique({ path: '/super-admin/admins', label: `Admin: ${a.firstName} ${a.lastName}`, queryTerm: `${a.firstName} ${a.lastName}`, icon: this.svg('<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0v1H2v-1Zm13 1v-1a5 5 0 0 1 7 0v1h-7Z"/>') }));
          this.searchCatalog = merged;
          this.updateSearchResults();
        },
        error: () => { this.searchCatalog = merged; }
      });
      return;
    }

    if (this.currentRole === 'ROLE_ADMIN') {
      const schoolId = this.authService.getSchoolId() || 1;
      forkJoin({
        teachers: this.adminService.getTeachers(schoolId),
        classes: this.adminService.getClasses(schoolId),
        subjects: this.adminService.getSubjects(schoolId),
        rooms: this.adminService.getRooms(schoolId)
      }).subscribe({
        next: ({ teachers, classes, subjects, rooms }) => {
          teachers.forEach(t => addUnique({ path: '/admin/teachers', label: `Prof: ${t.firstName} ${t.lastName}`, queryTerm: `${t.firstName} ${t.lastName}`, icon: this.svg('<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0v1H2v-1Zm13 1v-1a5 5 0 0 1 7 0v1h-7Z"/>') }));
          classes.forEach(c => addUnique({ path: '/admin/classes', label: `Classe: ${c.name}`, queryTerm: c.name, icon: this.svg('<path d="M6 4a3 3 0 0 0-3 3v11a2 2 0 0 0 2 2h14v-2H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h13V4H6Z"/><path d="M19 8H8a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11V8Z"/>') }));
          subjects.forEach(s => addUnique({ path: '/admin/subjects', label: `Matiere: ${s.name}`, queryTerm: s.name, icon: this.svg('<path d="M9 2a2 2 0 0 0-2 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1a2 2 0 0 0-2-2H9Z"/>') }));
          rooms.forEach(r => addUnique({ path: '/admin/rooms', label: `Salle: ${r.name}`, queryTerm: r.name, icon: this.svg('<path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6v-4h-4v4H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/>') }));
          this.searchCatalog = merged;
          this.updateSearchResults();
        },
        error: () => { this.searchCatalog = merged; }
      });
      return;
    }

    this.http.get<Lesson[]>(`${environment.apiUrl}/teacher/schedule`).subscribe({
      next: lessons => {
        lessons.forEach(l => addUnique({ path: '/teacher/schedule', label: `Cours: ${l.subjectName} - ${l.classGroupName}`, queryTerm: `${l.subjectName} ${l.classGroupName}`, icon: this.svg('<path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Z"/>') }));
        this.searchCatalog = merged;
        this.updateSearchResults();
      },
      error: () => { this.searchCatalog = merged; }
    });
  }

  openFirstSearchResult(): void {
    if (this.searchResults.length > 0) {
      this.goToSearch(this.searchResults[0]);
    }
  }

  goToSearch(item: { path: string; label: string; icon: SafeHtml; queryTerm?: string }): void {
    if (item.queryTerm && item.queryTerm.trim()) {
      this.router.navigate([item.path], { queryParams: { q: item.queryTerm.trim() } });
    } else {
      this.router.navigate([item.path]);
    }
    this.showSearchResults = false;
    this.globalSearch = '';
    this.searchResults = [];
  }

  toggleNotifications(): void {
    this.showNotifPanel = !this.showNotifPanel;
    if (this.showNotifPanel) {
      this.showSearchResults = false;
      this.markAllRead();
    }
  }

  markAllRead(): void {
    this.headerNotifications = this.headerNotifications.map(n => ({ ...n, read: true }));
  }

  get unreadCount(): number {
    return this.headerNotifications.filter(n => !n.read).length;
  }

  private toastTitle(type: Toast['type']): string {
    if (type === 'success') return 'Succes';
    if (type === 'error') return 'Alerte';
    if (type === 'warning') return 'Attention';
    return 'Info';
  }

  private seedRoleNotifications(role: string): void {
    const roleMsg = role === 'ROLE_SUPER_ADMIN'
      ? 'Vue globale des ecoles activee.'
      : role === 'ROLE_ADMIN'
        ? 'Vous pouvez gerer les ressources de votre ecole.'
        : 'Consultez votre charge et disponibilites.';
    this.headerNotifications = [
      { id: 1, title: 'Bienvenue', message: roleMsg, read: false, type: 'info' },
      { id: 2, title: 'Rappel', message: 'Utilisez la recherche globale pour naviguer rapidement.', read: false, type: 'success' }
    ];
  }

  private svg(d: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg class="nav-mobile-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">${d}</svg>`
    );
  }

  private accountSvg(cssClass: string, d: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg class="${cssClass}" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">${d}</svg>`
    );
  }

  accountIcons = {
    profile: this.accountSvg('profile-action-icon', '<path d="M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm-8 18a8 8 0 1 1 16 0v1H4v-1Z"/>'),
    logout: this.accountSvg('logout-action-icon', '<path d="M14 3h-4a2 2 0 0 0-2 2v3h2V5h4v14h-4v-3H8v3a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z"/><path d="M20.707 11.293 18.414 9l-1.414 1.414L16.414 11H9v2h7.414l.586.586L18.414 15l2.293-2.293a1 1 0 0 0 0-1.414Z"/>')
  };

  private setNavLinks(role: string): void {
    const icons = {
      dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
      schools: '<path d="M12 3.172 3 10v10a1 1 0 0 0 1 1h5v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6h5a1 1 0 0 0 1-1V10l-9-6.828Z"/>',
      admins: '<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0v1H2v-1Zm13 1v-1a5 5 0 0 1 7 0v1h-7Z"/>',
      teachers: '<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0v1H2v-1Zm13 1v-1a5 5 0 0 1 7 0v1h-7Z"/>',
      classes: '<path d="M6 4a3 3 0 0 0-3 3v11a2 2 0 0 0 2 2h14v-2H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h13V4H6Z"/><path d="M19 8H8a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11V8Z"/>',
      subjects: '<path d="M9 2a2 2 0 0 0-2 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1a2 2 0 0 0-2-2H9Zm1 7h6v2h-6V9Zm0 4h6v2h-6v-2Z"/>',
      rooms: '<path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6v-4h-4v4H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 3v2h2V6H7Zm0 4v2h2v-2H7Zm0 4v2h2v-2H7Zm8-8v2h2V6h-2Zm0 4v2h2v-2h-2Z"/>',
      timetable: '<path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm12 8H5v10h14V10Z"/>',
      timeslots: '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 5a1 1 0 0 0-2 0v5.586l3.707 3.707a1 1 0 0 0 1.414-1.414L13 11.586V7Z"/>',
      schedule: '<path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm12 8H5v10h14V10Z"/>',
      availability: '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4.707 7.293a1 1 0 0 1 0 1.414l-5.5 5.5a1 1 0 0 1-1.414 0l-2.5-2.5a1 1 0 1 1 1.414-1.414l1.793 1.793 4.793-4.793a1 1 0 0 1 1.414 0Z"/>'
    };

    if (role === 'ROLE_SUPER_ADMIN') {
      this.roleBasePath = '/super-admin';
      this.roleLabel = this.t('super_admin');
      this.navLinks = [
        { path: 'dashboard', label: this.t('dashboard'), icon: this.svg(icons.dashboard) },
        { path: 'schools', label: this.t('schools'), icon: this.svg(icons.schools) },
        { path: 'admins', label: this.t('administrators'), icon: this.svg(icons.admins) }
      ];
    } else if (role === 'ROLE_ADMIN') {
      this.roleBasePath = '/admin';
      this.roleLabel = this.t('administrator');
      this.navLinks = [
        { path: 'dashboard', label: this.t('dashboard'), icon: this.svg(icons.dashboard) },
        { path: 'teachers', label: this.t('teachers'), icon: this.svg(icons.teachers) },
        { path: 'classes', label: this.t('classes'), icon: this.svg(icons.classes) },
        { path: 'subjects', label: this.t('subjects'), icon: this.svg(icons.subjects) },
        { path: 'rooms', label: this.t('rooms'), icon: this.svg(icons.rooms) },
        { path: 'timetable', label: this.t('timetable'), icon: this.svg(icons.timetable) }
      ];
    } else {
      this.roleBasePath = '/teacher';
      this.roleLabel = this.t('role_teacher');
      this.navLinks = [
        { path: 'dashboard', label: this.t('dashboard'), icon: this.svg(icons.dashboard) },
        { path: 'schedule', label: this.t('my_schedule'), icon: this.svg(icons.schedule) },
        { path: 'availability', label: this.t('availability'), icon: this.svg(icons.availability) }
      ];
    }
  }
}
