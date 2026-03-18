export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: number;
  schoolName?: string;
  school?: School;
}

export interface AuthResponse {
  token: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  schoolId?: number;
  expiresIn: number;
}

export interface AuthSession {
  token: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  schoolId?: number;
  expiresAt: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: number;
}

export interface School {
  id: number;
  name: string;
  address: string;
  phone: string;
  active: boolean;
  createdAt?: string;
}

export interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  schoolId: number;
  subjectIds: number[];
  maxHoursPerWeek: number;
  subjects?: Subject[];
}

export interface ClassGroup {
  id: number;
  name: string;
  level: string;
  studentCount: number;
  totalHoursPerWeek?: number;
}

export interface Subject {
  id: number;
  name: string;
  level: string;
  color: string;
  hoursPerWeek: number;
  sessionDuration: number;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  type: string;
}

export interface Lesson {
  id: number;
  subjectId: number;
  subjectName: string;
  teacherId: number;
  teacherName: string;
  classGroupId: number;
  classGroupName: string;
  roomId: number;
  roomName: string;
  timeslotId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface Timeslot {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  orderInDay: number;
}

export interface TeacherAvailability {
  id?: number;
  teacherId: number;
  timeslotId: number;
  available: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileDTO {
  firstName: string;
  lastName: string;
  email: string;
}
