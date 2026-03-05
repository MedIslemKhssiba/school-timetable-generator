import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { Lesson } from '../../../core/models';
import { environment } from '@env/environment';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <h2>My Schedule</h2>
    @if (lessons.length > 0) {
      <div class="schedule-grid">
        @for (day of days; track day) {
          <mat-card>
            <mat-card-header><mat-card-title>{{ day }}</mat-card-title></mat-card-header>
            <mat-card-content>
              @for (lesson of getLessonsForDay(day); track lesson.id) {
                <div class="lesson-slot">
                  <strong>{{ lesson.startTime }} - {{ lesson.endTime }}</strong><br/>
                  {{ lesson.subjectName }}<br/>
                  <small>{{ lesson.classGroupName }} • {{ lesson.roomName }}</small>
                </div>
              } @empty {
                <p style="color:#999">No lessons</p>
              }
            </mat-card-content>
          </mat-card>
        }
      </div>
    } @else {
      <p>No schedule available yet.</p>
    }
  `,
  styles: [`
    .schedule-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .lesson-slot { padding: 8px; margin: 4px 0; background: #e8f5e9; border-radius: 4px; font-size: 0.9em; }
  `]
})
export class ScheduleComponent implements OnInit {
  lessons: Lesson[] = [];
  days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Lesson[]>(`${environment.apiUrl}/teacher/schedule`).subscribe(l => this.lessons = l);
  }

  getLessonsForDay(day: string): Lesson[] {
    return this.lessons.filter(l => l.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
}
