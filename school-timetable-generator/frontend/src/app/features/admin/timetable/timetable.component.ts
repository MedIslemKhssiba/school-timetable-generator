import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Lesson } from '../../../core/models';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatSnackBarModule, MatProgressBarModule],
  template: `
    <h2>Timetable</h2>
    <div style="margin-bottom:16px; display:flex; gap:12px; flex-wrap:wrap">
      <button mat-raised-button color="primary" (click)="solve()" [disabled]="solving">
        <mat-icon>play_arrow</mat-icon> {{ solving ? 'Solving...' : 'Generate Timetable' }}
      </button>
      <button mat-raised-button color="warn" (click)="stop()" [disabled]="!solving">
        <mat-icon>stop</mat-icon> Stop
      </button>
      <button mat-raised-button (click)="save()" [disabled]="solving || lessons.length === 0">
        <mat-icon>save</mat-icon> Save Timetable
      </button>
      <button mat-raised-button (click)="refresh()">
        <mat-icon>refresh</mat-icon> Refresh
      </button>
      <button mat-raised-button color="accent" (click)="exportExcel()" [disabled]="lessons.length === 0">
        <mat-icon>download</mat-icon> Export Excel
      </button>
    </div>

    @if (solving) {
      <mat-progress-bar mode="indeterminate" style="margin-bottom:16px"></mat-progress-bar>
    }

    @if (lessons.length > 0) {
      <div class="timetable-grid">
        @for (day of days; track day) {
          <mat-card>
            <mat-card-header><mat-card-title>{{ day }}</mat-card-title></mat-card-header>
            <mat-card-content>
              @for (lesson of getLessonsForDay(day); track lesson.id) {
                <div class="lesson-slot">
                  <strong>{{ lesson.startTime }} - {{ lesson.endTime }}</strong><br/>
                  {{ lesson.subjectName }}<br/>
                  <small>{{ lesson.teacherName }} &bull; {{ lesson.roomName }} &bull; {{ lesson.classGroupName }}</small>
                </div>
              } @empty {
                <p style="color:#999">No lessons</p>
              }
            </mat-card-content>
          </mat-card>
        }
      </div>
    } @else {
      <p>No timetable generated yet. Click "Generate Timetable" to start.</p>
    }
  `,
  styles: [`
    .timetable-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .lesson-slot { padding: 8px; margin: 4px 0; background: #e3f2fd; border-radius: 4px; font-size: 0.9em; }
  `]
})
export class TimetableComponent implements OnInit {
  lessons: Lesson[] = [];
  solving = false;
  days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  private schoolId = 1;

  constructor(private adminService: AdminService, private authService: AuthService, private snackBar: MatSnackBar) {
    this.schoolId = this.authService.getSchoolId() || 1;
  }

  ngOnInit(): void { this.refresh(); }

  solve(): void {
    this.solving = true;
    this.adminService.solveTimetable(this.schoolId, {}).subscribe({
      next: () => this.snackBar.open('Solving started! This may take a few minutes.', 'OK', { duration: 5000 }),
      error: () => { this.solving = false; this.snackBar.open('Failed to start solving', 'Close', { duration: 3000 }); }
    });
  }

  stop(): void {
    this.adminService.stopSolving(this.schoolId).subscribe(() => {
      this.solving = false;
      this.snackBar.open('Solving stopped', 'OK', { duration: 3000 });
      this.refresh();
    });
  }

  save(): void {
    this.adminService.saveTimetable(this.schoolId).subscribe({
      next: (lessons) => {
        this.lessons = lessons as any;
        this.snackBar.open('Timetable saved successfully!', 'OK', { duration: 3000 });
        this.refresh();
      },
      error: () => this.snackBar.open('Failed to save timetable', 'Close', { duration: 3000 })
    });
  }

  refresh(): void {
    this.adminService.getLessons(this.schoolId).subscribe(l => this.lessons = l);
  }

  exportExcel(): void {
    this.adminService.exportTimetable(this.schoolId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetable-school-${this.schoolId}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  getLessonsForDay(day: string): Lesson[] {
    return this.lessons.filter(l => l.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
}
