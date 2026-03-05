import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, ChangePasswordRequest, ProfileDTO } from '../models';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(this.getStoredUser());

  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

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
    localStorage.removeItem('auth');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return this.getStoredUser()?.token ?? null;
  }

  getRole(): string | null {
    return this.getStoredUser()?.role ?? null;
  }

  getSchoolId(): number | null {
    return this.getStoredUser()?.schoolId ?? null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
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
    localStorage.setItem('auth', JSON.stringify(response));
    this.currentUserSubject.next(response);
  }

  private getStoredUser(): AuthResponse | null {
    const data = localStorage.getItem('auth');
    return data ? JSON.parse(data) : null;
  }
}
