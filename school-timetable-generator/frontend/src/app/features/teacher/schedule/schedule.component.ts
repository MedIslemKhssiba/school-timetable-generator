import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CardModule, GridModule, BadgeModule } from '@coreui/angular';
import { Lesson } from '../../../core/models';
import { environment } from '@env/environment';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, CardModule, GridModule, BadgeModule],
  template: `
    <div class="page-header">
      <h2>My Schedule</h2>
    </div>

    @if (lessons.length > 0) {
      <c-row>
        @for (day of days; track day) {
          <c-col lg="4" md="6" class="mb-4">
            <c-card class="h-100">
              <c-card-header class="day-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="me-2 opacity-75"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
                <span>{{ formatDay(day) }}</span>
                <c-badge color="light" textColor="dark" class="ms-auto">{{ getLessonsForDay(day).length }}</c-badge>
              </c-card-header>
              <c-card-body class="p-2">
                @for (lesson of getLessonsForDay(day); track lesson.id) {
                  <div class="lesson-slot">
                    <div class="lesson-time">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
                      {{ lesson.startTime }} - {{ lesson.endTime }}
                    </div>
                    <div class="lesson-subject">{{ lesson.subjectName }}</div>
                    <div class="lesson-details">
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                        {{ lesson.classGroupName }}
                      </span>
                      <span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
                        {{ lesson.roomName }}
                      </span>
                    </div>
                  </div>
                } @empty {
                  <div class="text-center text-muted py-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" class="opacity-25 d-block mx-auto mb-1"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
                    <small>No lessons</small>
                  </div>
                }
              </c-card-body>
            </c-card>
          </c-col>
        }
      </c-row>
    } @else {
      <c-card>
        <c-card-body class="text-center py-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="currentColor" class="text-success opacity-25 mb-3"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
          <h3>No Schedule Yet</h3>
          <p class="text-muted">Your schedule will appear here once the timetable has been generated.</p>
        </c-card-body>
      </c-card>
    }
  `,
  styles: [`
    .day-header {
      display: flex; align-items: center;
      background: linear-gradient(135deg, var(--cui-success, #2eb85c), #059669);
      color: white; font-weight: 600;
    }
    .lesson-slot {
      padding: 12px; margin: 6px; background: var(--cui-tertiary-bg, #f8f9fa);
      border-radius: 6px; border-left: 3px solid var(--cui-success, #2eb85c);
      transition: transform 0.15s;
    }
    .lesson-slot:hover { transform: translateX(4px); }
    .lesson-time {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; font-weight: 600;
      color: var(--cui-success, #2eb85c); margin-bottom: 4px;
    }
    .lesson-subject { font-weight: 600; font-size: 0.95rem; margin-bottom: 6px; }
    .lesson-details { display: flex; flex-direction: column; gap: 2px; }
    .lesson-details span { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: var(--cui-text-secondary); }
  `]
})
export class ScheduleComponent implements OnInit {
  lessons: Lesson[] = [];
  days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Lesson[]>(`${environment.apiUrl}/teacher/schedule`).subscribe(l => this.lessons = l);
  }

  formatDay(day: string): string {
    return day.charAt(0) + day.slice(1).toLowerCase();
  }

  getLessonsForDay(day: string): Lesson[] {
    return this.lessons.filter(l => l.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
}
