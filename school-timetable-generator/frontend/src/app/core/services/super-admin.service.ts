import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { School, User, RegisterRequest } from '../models';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class SuperAdminService {
  private readonly apiUrl = `${environment.apiUrl}/super-admin`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/dashboard`);
  }

  // Schools
  getSchools(): Observable<School[]> {
    return this.http.get<School[]>(`${this.apiUrl}/schools`);
  }

  getSchool(id: number): Observable<School> {
    return this.http.get<School>(`${this.apiUrl}/schools/${id}`);
  }

  createSchool(school: Partial<School>): Observable<School> {
    return this.http.post<School>(`${this.apiUrl}/schools`, school);
  }

  updateSchool(id: number, school: Partial<School>): Observable<School> {
    return this.http.put<School>(`${this.apiUrl}/schools/${id}`, school);
  }

  deleteSchool(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/schools/${id}`);
  }

  // Admins
  getAdmins(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admins`);
  }

  createAdmin(request: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/admins`, request);
  }

  deleteAdmin(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admins/${id}`);
  }

  // Toggle school active
  toggleSchoolActive(id: number): Observable<School> {
    return this.http.patch<School>(`${this.apiUrl}/schools/${id}/toggle-active`, null);
  }

  // School statistics
  getSchoolStatistics(schoolId: number): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/schools/${schoolId}/statistics`);
  }

  // Change user password
  changeUserPassword(userId: number, newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${userId}/password`, { newPassword }, { responseType: 'text' });
  }
}
