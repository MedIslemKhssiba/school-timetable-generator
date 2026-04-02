import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { AdminService } from './admin.service';
import { Lesson, TimetableSolveStatus } from '../models';

export interface TimetableSolveState {
  solving: boolean;
  status: string;
  progressPercent: number;
  completionPercent: number;
  qualityPercent: number;
  totalAssignments: number;
  assignedAssignments: number;
  solverCompleted: boolean;
  solverFeasible: boolean;
  solverOptimal: boolean;
  hardScore: number;
  softScore: number;
  scoreLabel: string;
  conflicts: Record<string, number>;
  solvingTimeMs: number;
  scoreHistory: Array<{ timestampMs: number; hardScore: number; softScore: number; score: string }>;
  roomUsage: Record<string, number>;
  teacherLoad: Record<string, number>;
  classLoad: Record<string, number>;
  expectedClassHours: Record<string, number>;
  classHourDiff: Record<string, number>;
  lessons: Lesson[];
}

@Injectable({ providedIn: 'root' })
export class TimetableSolveStateService {
  private readonly stateSubject = new BehaviorSubject<TimetableSolveState>({
    solving: false,
    status: 'NOT_SOLVING',
    progressPercent: 0,
    completionPercent: 0,
    qualityPercent: 0,
    totalAssignments: 0,
    assignedAssignments: 0,
    solverCompleted: false,
    solverFeasible: false,
    solverOptimal: false,
    hardScore: 0,
    softScore: 0,
    scoreLabel: '',
    conflicts: {},
    solvingTimeMs: 0,
    scoreHistory: [],
    roomUsage: {},
    teacherLoad: {},
    classLoad: {},
    expectedClassHours: {},
    classHourDiff: {},
    lessons: []
  });

  readonly state$ = this.stateSubject.asObservable();

  private schoolId: number | null = null;
  private pollInterval: any = null;
  private requestInFlight = false;

  constructor(private adminService: AdminService) {}

  init(schoolId: number): void {
    this.schoolId = schoolId;
    this.refreshFromServer();
  }

  startSolve(schoolId: number): Observable<string> {
    this.schoolId = schoolId;
    this.updateState({
      solving: true,
      status: 'SOLVING_ACTIVE',
      progressPercent: 0,
      completionPercent: 0,
      qualityPercent: 0,
      totalAssignments: 0,
      assignedAssignments: 0,
      hardScore: 0,
      softScore: 0,
      scoreLabel: '',
      conflicts: {},
      lessons: [],
      solverCompleted: false,
      solverOptimal: false
    });
    this.ensurePolling();

    return this.adminService.solveTimetable(schoolId, {}).pipe(
      tap(() => this.ensurePolling()),
      catchError(error => {
        this.updateState({ solving: false, status: 'NOT_SOLVING' });
        this.stopPolling();
        return throwError(() => error);
      })
    );
  }

  stopSolve(): Observable<string> {
    if (this.schoolId == null) {
      return of('No active solver');
    }

    return this.adminService.stopSolving(this.schoolId).pipe(
      tap(() => {
        this.updateState({ solving: false, status: 'NOT_SOLVING' });
        this.stopPolling();
        this.refreshFromServer();
      })
    );
  }

  refreshFromServer(): void {
    if (this.schoolId == null || this.requestInFlight) {
      return;
    }

    this.requestInFlight = true;
    forkJoin({
      status: this.adminService.getSolveStatistics(this.schoolId),
      solution: this.adminService.getSolution(this.schoolId).pipe(catchError(() => of(null))),
      lessons: this.adminService.getLessons(this.schoolId).pipe(catchError(() => of([])))
    }).pipe(
      finalize(() => {
        this.requestInFlight = false;
      })
    ).subscribe({
      next: ({ status, solution, lessons: persistedLessons }) => {
        const lessons = this.mapSolutionToLessons(solution, persistedLessons as Lesson[]);
        this.updateFromStatus(status, lessons);
      },
      error: () => {
        this.requestInFlight = false;
      }
    });
  }

  private ensurePolling(): void {
    if (this.pollInterval) {
      return;
    }

    this.refreshFromServer();
    this.pollInterval = setInterval(() => this.refreshFromServer(), 3000);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private updateFromStatus(status: TimetableSolveStatus, lessons: Lesson[]): void {
    const solving = status.solving;

    this.updateState({
      solving,
      status: status.status,
      progressPercent: status.progressPercent,
      completionPercent: status.completionPercent ?? status.progressPercent,
      qualityPercent: status.qualityPercent ?? status.progressPercent,
      totalAssignments: status.totalAssignments,
      assignedAssignments: status.assignedAssignments,
      solverCompleted: !!status.solverCompleted,
      solverFeasible: !!status.solverFeasible,
      solverOptimal: !!status.solverOptimal,
      hardScore: status.hardScore ?? 0,
      softScore: status.softScore ?? 0,
      scoreLabel: status.score ?? '',
      conflicts: status.conflicts ?? {},
      solvingTimeMs: status.solvingTimeMs ?? 0,
      scoreHistory: status.scoreHistory ?? [],
      roomUsage: status.roomUsage ?? {},
      teacherLoad: status.teacherLoad ?? {},
      classLoad: status.classLoad ?? {},
      expectedClassHours: status.expectedClassHours ?? {},
      classHourDiff: status.classHourDiff ?? {},
      lessons
    });

    if (solving) {
      this.ensurePolling();
    } else {
      this.stopPolling();
    }
  }

  private mapSolutionToLessons(solution: any, persistedLessons: Lesson[]): Lesson[] {
    if (!solution || !solution.lessonAssignments) {
      return persistedLessons;
    }

    return solution.lessonAssignments
      .filter((la: any) => la.timeslot && la.room)
      .map((la: any, index: number) => ({
        id: la.id || index,
        subjectId: la.subject?.id || 0,
        subjectName: la.subject?.name || '',
        teacherId: la.teacher?.id || 0,
        teacherName: la.teacher ? `${la.teacher.firstName} ${la.teacher.lastName}` : '',
        classGroupId: la.classGroup?.id || 0,
        classGroupName: la.classGroup?.name || '',
        roomId: la.room?.id || 0,
        roomName: la.room?.name || '',
        timeslotId: la.timeslot?.id || 0,
        dayOfWeek: la.timeslot?.dayOfWeek || '',
        startTime: la.timeslot?.startTime || '',
        endTime: la.timeslot?.endTime || '',
        sessionDurationMinutes: la.subject?.sessionDuration || undefined,
        timeslotDurationMinutes: (la.timeslot?.startTime && la.timeslot?.endTime)
          ? this.computeDurationMinutes(la.timeslot.startTime, la.timeslot.endTime)
          : undefined
      }));
  }

  private computeDurationMinutes(startTime: string, endTime: string): number | undefined {
    const start = this.parseMinutes(startTime);
    const end = this.parseMinutes(endTime);
    if (start === undefined || end === undefined || end <= start) {
      return undefined;
    }
    return end - start;
  }

  private parseMinutes(value: string): number | undefined {
    if (!value) {
      return undefined;
    }
    const parts = value.split(':');
    if (parts.length < 2) {
      return undefined;
    }
    const h = Number.parseInt(parts[0], 10);
    const m = Number.parseInt(parts[1], 10);
    if (Number.isNaN(h) || Number.isNaN(m)) {
      return undefined;
    }
    return h * 60 + m;
  }

  private updateState(patch: Partial<TimetableSolveState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...patch
    });
  }
}
