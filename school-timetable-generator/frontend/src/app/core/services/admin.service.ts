import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClassGroup, Subject, Room, Teacher, Lesson, TeacherAvailability, Timeslot, TimetableSolveStatus } from '../models';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getDashboard(schoolId: number): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/dashboard/${schoolId}`);
  }

  // Teachers
  getTeachers(schoolId: number): Observable<Teacher[]> {
    return this.http.get<Teacher[]>(`${environment.apiUrl}/admin/teachers/school/${schoolId}`);
  }

  createTeacher(teacher: Partial<Teacher>): Observable<Teacher> {
    return this.http.post<Teacher>(`${environment.apiUrl}/admin/teachers`, teacher);
  }

  updateTeacher(id: number, teacher: Partial<Teacher>): Observable<Teacher> {
    return this.http.put<Teacher>(`${environment.apiUrl}/admin/teachers/${id}`, teacher);
  }

  deleteTeacher(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/teachers/${id}`);
  }

  // Classes
  getClasses(schoolId: number): Observable<ClassGroup[]> {
    return this.http.get<ClassGroup[]>(`${this.apiUrl}/classes/${schoolId}`);
  }

  createClass(classGroup: Partial<ClassGroup>): Observable<ClassGroup> {
    return this.http.post<ClassGroup>(`${this.apiUrl}/classes`, classGroup);
  }

  updateClass(id: number, classGroup: Partial<ClassGroup>): Observable<ClassGroup> {
    return this.http.put<ClassGroup>(`${this.apiUrl}/classes/${id}`, classGroup);
  }

  deleteClass(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/classes/${id}`);
  }

  // Subjects
  getSubjects(schoolId: number): Observable<Subject[]> {
    return this.http.get<Subject[]>(`${this.apiUrl}/subjects/${schoolId}`);
  }

  createSubject(subject: Partial<Subject>): Observable<Subject> {
    return this.http.post<Subject>(`${this.apiUrl}/subjects`, subject);
  }

  updateSubject(id: number, subject: Partial<Subject>): Observable<Subject> {
    return this.http.put<Subject>(`${this.apiUrl}/subjects/${id}`, subject);
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subjects/${id}`);
  }

  // Rooms
  getRooms(schoolId: number): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/rooms/${schoolId}`);
  }

  createRoom(room: Partial<Room>): Observable<Room> {
    return this.http.post<Room>(`${this.apiUrl}/rooms`, room);
  }

  updateRoom(id: number, room: Partial<Room>): Observable<Room> {
    return this.http.put<Room>(`${this.apiUrl}/rooms/${id}`, room);
  }

  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/rooms/${id}`);
  }

  // Timeslots
  getTimeslots(): Observable<Timeslot[]> {
    return this.http.get<Timeslot[]>(`${this.apiUrl}/timetable/timeslots`);
  }

  createTimeslot(timeslot: { dayOfWeek: string; startTime: string; endTime: string; breakStartTime?: string; breakEndTime?: string; orderInDay?: number }): Observable<Timeslot> {
    return this.http.post<Timeslot>(`${this.apiUrl}/timetable/timeslots`, timeslot);
  }

  generateDayTimeslots(payload: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    breakStartTime?: string | null;
    breakEndTime?: string | null;
    schoolId?: number | null;
  }): Observable<Timeslot[]> {
    return this.http.post<Timeslot[]>(`${this.apiUrl}/timetable/timeslots/generate-day`, payload);
  }

  updateTimeslot(id: number, timeslot: { dayOfWeek: string; startTime: string; endTime: string; breakStartTime?: string; breakEndTime?: string; orderInDay?: number }): Observable<Timeslot> {
    return this.http.put<Timeslot>(`${this.apiUrl}/timetable/timeslots/${id}`, timeslot);
  }

  deleteTimeslot(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/timetable/timeslots/${id}`);
  }

  // Timetable
  solveTimetable(schoolId: number, problem: any): Observable<string> {
    return this.http.post(`${this.apiUrl}/timetable/solve/${schoolId}`, problem, { responseType: 'text' });
  }

  getSolution(schoolId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/timetable/solution/${schoolId}`);
  }

  getSolveStatus(schoolId: number): Observable<TimetableSolveStatus> {
    return this.http.get<TimetableSolveStatus>(`${this.apiUrl}/timetable/status/${schoolId}`);
  }

  stopSolving(schoolId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/timetable/stop/${schoolId}`, null, { responseType: 'text' });
  }

  saveTimetable(schoolId: number): Observable<Lesson[]> {
    return this.http.post<Lesson[]>(`${this.apiUrl}/timetable/save/${schoolId}`, null);
  }

  // Lessons
  getLessons(schoolId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/timetable/lessons/${schoolId}`);
  }

  getLessonsByClass(classGroupId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/timetable/lessons/class/${classGroupId}`);
  }

  getLessonsByTeacher(teacherId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/timetable/lessons/teacher/${teacherId}`);
  }

  exportTimetable(schoolId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/timetable/export/${schoolId}`, { responseType: 'blob' });
  }

  // Teacher Availability
  getTeacherAvailabilities(teacherId: number): Observable<TeacherAvailability[]> {
    return this.http.get<TeacherAvailability[]>(`${this.apiUrl}/teachers/${teacherId}/availabilities`);
  }

  updateTeacherAvailabilities(teacherId: number, availabilities: { timeslotId: number; available: boolean }[]): Observable<TeacherAvailability[]> {
    return this.http.put<TeacherAvailability[]>(`${this.apiUrl}/teachers/${teacherId}/availabilities`, availabilities);
  }

  syncTeachersWithTimeslots(schoolId: number): Observable<{ created: number; schoolId: number }> {
    return this.http.post<{ created: number; schoolId: number }>(`${this.apiUrl}/timetable/timeslots/sync-teachers/${schoolId}`, null);
  }

  // Import
  importData(schoolId: number, file: File): Observable<string[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<string[]>(`${this.apiUrl}/import/${schoolId}`, formData);
  }
}
