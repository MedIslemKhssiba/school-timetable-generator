import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthResponse, AuthSession, LoginRequest, RegisterRequest, ChangePasswordRequest, ProfileDTO } from '../models';
import { environment } from '@env/environment';

const AUTH_STORAGE_KEY = 'auth_session';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<AuthSession | null>(null);
  private expirationTimer: ReturnType<typeof setTimeout> | null = null;
  private loggingOut = false;

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    localStorage.removeItem('auth');
    this.restoreSession();
  }

  ngOnDestroy(): void {
    this.clearExpirationTimer();
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => this.setSession(response))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => this.setSession(response))
    );
  }

  logout(): void {
    this.clearExpirationTimer();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.currentUserSubject.next(null);
  }

  forceLogout(): void {
    if (this.loggingOut) return;
    this.loggingOut = true;
    this.logout();
    this.router.navigate(['/login']).finally(() => this.loggingOut = false);
  }

  getToken(): string | null {
    const session = this.currentUserSubject.value;
    if (!session || this.isTokenExpired(session)) return null;
    return session.token;
  }

  getRole(): string | null {
    return this.currentUserSubject.value?.role ?? null;
  }

  getSchoolId(): number | null {
    return this.currentUserSubject.value?.schoolId ?? null;
  }

  isAuthenticated(): boolean {
    const session = this.currentUserSubject.value;
    return !!session && !this.isTokenExpired(session);
  }

  hasRole(roles: string[]): boolean {
    const role = this.getRole();
    return role != null && roles.includes(role);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/profile`);
  }

  updateProfile(dto: ProfileDTO): Observable<any> {
    return this.http.put(`${environment.apiUrl}/profile`, dto);
  }

  changePassword(request: ChangePasswordRequest): Observable<string> {
    return this.http.post(`${environment.apiUrl}/profile/change-password`, request, { responseType: 'text' });
  }

  private setSession(response: AuthResponse): void {
    const session: AuthSession = {
      token: response.token,
      email: response.email,
      role: response.role,
      firstName: response.firstName,
      lastName: response.lastName,
      schoolId: response.schoolId,
      expiresAt: Date.now() + response.expiresIn
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    this.currentUserSubject.next(session);
    this.scheduleAutoLogout(response.expiresIn);
  }

  private restoreSession(): void {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!data) return;

      const session: AuthSession = JSON.parse(data);
      if (this.isTokenExpired(session)) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }

      this.currentUserSubject.next(session);
      const remainingMs = session.expiresAt - Date.now();
      this.scheduleAutoLogout(remainingMs);
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  private isTokenExpired(session: AuthSession): boolean {
    return Date.now() >= session.expiresAt;
  }

  private scheduleAutoLogout(delayMs: number): void {
    this.clearExpirationTimer();
    this.expirationTimer = setTimeout(() => this.forceLogout(), delayMs);
  }

  private clearExpirationTimer(): void {
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
  }
}
