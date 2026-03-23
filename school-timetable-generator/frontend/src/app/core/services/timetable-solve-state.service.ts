import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { AdminService } from './admin.service';
import { Lesson, TimetableSolveStatus } from '../models';

export interface TimetableSolveState {
  solving: boolean;
  status: string;
  progressPercent: number;
  totalAssignments: number;
  assignedAssignments: number;
  lessons: Lesson[];
}

@Injectable({ providedIn: 'root' })
export class TimetableSolveStateService {
  private readonly stateSubject = new BehaviorSubject<TimetableSolveState>({
    solving: false,
    status: 'NOT_SOLVING',
    progressPercent: 0,
    totalAssignments: 0,
    assignedAssignments: 0,
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
      progressPercent: this.stateSubject.value.lessons.length > 0 ? this.stateSubject.value.progressPercent : 0
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
      status: this.adminService.getSolveStatus(this.schoolId),
      solution: this.adminService.getSolution(this.schoolId).pipe(catchError(() => of(null)))
    }).pipe(
      finalize(() => {
        this.requestInFlight = false;
      })
    ).subscribe({
      next: ({ status, solution }) => {
        const lessons = this.mapSolutionToLessons(solution);
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
      totalAssignments: status.totalAssignments,
      assignedAssignments: status.assignedAssignments,
      lessons
    });

    if (solving) {
      this.ensurePolling();
    } else {
      this.stopPolling();
    }
  }

  private mapSolutionToLessons(solution: any): Lesson[] {
    if (!solution || !solution.lessonAssignments) {
      return this.stateSubject.value.lessons;
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
        endTime: la.timeslot?.endTime || ''
      }));
  }

  private updateState(patch: Partial<TimetableSolveState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...patch
    });
  }
}
