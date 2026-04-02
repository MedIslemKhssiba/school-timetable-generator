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
}

export interface Subject {
  id: number;
  name: string;
  level: string;
  requiredRoomType?: string;
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
  sessionDurationMinutes?: number;
  timeslotDurationMinutes?: number;
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

export interface TimetableSolveStatus {
  status: string;
  solving: boolean;
  totalAssignments: number;
  assignedAssignments: number;
  progressPercent: number;
  completionPercent?: number;
  qualityPercent?: number;
  solverCompleted?: boolean;
  solverFeasible?: boolean;
  solverOptimal?: boolean;
  hardScore?: number;
  softScore?: number;
  score?: string | null;
  conflicts?: Record<string, number>;
  solvingTimeMs?: number;
  scoreHistory?: Array<{ timestampMs: number; hardScore: number; softScore: number; score: string }>;
  roomUsage?: Record<string, number>;
  teacherLoad?: Record<string, number>;
  classLoad?: Record<string, number>;
  expectedClassHours?: Record<string, number>;
  classHourDiff?: Record<string, number>;
  teacherLoadRatio?: Record<string, { planned: number; maxHours: number; ratioPercent: number }>;
  subjectDistribution?: Record<string, number>;
  levelDistribution?: Record<string, number>;
  topSoftConstraints?: Array<{ constraint: string; softScore: number; impact: number }>;
  iterationComparison?: Record<string, any>;
  softBreakdown?: Record<string, { hard: number; soft: number }>;
  classWeaknesses?: Array<Record<string, any>>;
  teacherWeaknesses?: Array<Record<string, any>>;
}

export interface TimetablePreSolveDiagnostics {
  schoolId: number;
  ready: boolean;
  blockingIssues: string[];
  warnings: string[];
  suggestions: string[];
  summary: Record<string, number>;
}

export interface TeacherDispatchSummary {
  teacherId: number;
  teacherName: string;
  lessonCount: number;
  status: string;
  dispatchedAt: string;
}

export interface TimetableHistoryItem {
  id: number;
  generatedAt: string;
  totalLessons: number;
  hardScore?: number;
  softScore?: number;
  score?: string;
  teacherDispatchCount: number;
  teachers: TeacherDispatchSummary[];
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
