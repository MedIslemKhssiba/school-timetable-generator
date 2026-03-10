import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CardModule, GridModule, BadgeModule } from '@coreui/angular';
import { Lesson } from '../../../core/models';
import { environment } from '@env/environment';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, CardModule, GridModule, BadgeModule, SkeletonComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">My Schedule</h2>
        <p class="page-subtitle">Your weekly teaching timetable</p>
      </div>
      @if (lessons.length > 0) {
        <span class="badge bg-primary px-3 py-2">{{ lessons.length }} lessons this week</span>
      }
    </div>

    @if (loading) {
      <ui-skeleton type="cards" [count]="5" />
    } @else if (lessons.length > 0) {
      <c-row>
        @for (day of days; track day) {
          <c-col lg="4" md="6" class="mb-4">
            <c-card class="h-100">
              <c-card-header class="day-header">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-2 opacity-75"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
                <span>{{ formatDay(day) }}</span>
                <c-badge color="light" textColor="dark" class="ms-auto">{{ getLessonsForDay(day).length }}</c-badge>
              </c-card-header>
              <c-card-body class="p-2">
                @for (lesson of getLessonsForDay(day); track lesson.id) {
                  <div class="lesson-slot" [style.border-left-color]="getSubjectColor(lesson.subjectName)">
                    <div class="lesson-time">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
                      {{ lesson.startTime }} - {{ lesson.endTime }}
                    </div>
                    <div class="lesson-subject">{{ lesson.subjectName }}</div>
                    <div class="lesson-details">
                      <span>{{ lesson.classGroupName }}</span>
                      <span>{{ lesson.roomName }}</span>
                    </div>
                  </div>
                } @empty {
                  <div class="text-center text-muted py-4"><small>No lessons</small></div>
                }
              </c-card-body>
            </c-card>
          </c-col>
        }
      </c-row>
    } @else {
      <c-card>
        <c-card-body class="text-center py-5">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" class="text-primary opacity-25 mb-3"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
          <h3 class="fw-bold mb-2">No Schedule Yet</h3>
          <p class="text-muted mb-0">Your schedule will appear here once the timetable has been generated.</p>
        </c-card-body>
      </c-card>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #1A2236; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8892A4; margin: 4px 0 0; }

    .day-header {
      display: flex; align-items: center;
      background: linear-gradient(135deg, #1565C0, #42A5F5);
      color: white; font-weight: 600;
    }
    .lesson-slot {
      padding: 12px; margin: 6px; background: #f8fafd;
      border-radius: 8px; border-left: 3px solid #1565C0;
      transition: transform 0.15s, box-shadow 0.15s;
      &:hover { transform: translateX(4px); box-shadow: 0 2px 8px rgba(21,101,192,0.1); }
    }
    .lesson-time {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; font-weight: 600; color: #1565C0; margin-bottom: 4px;
    }
    .lesson-subject { font-weight: 700; font-size: 0.95rem; margin-bottom: 6px; color: #1A2236; }
    .lesson-details { display: flex; flex-direction: column; gap: 2px; }
    .lesson-details span { font-size: 0.78rem; color: #8892A4; }
  `]
})
export class ScheduleComponent implements OnInit {
  lessons: Lesson[] = [];
  loading = true;
  days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  private subjectColors: Record<string, string> = {};
  private colorPalette = ['#1565C0', '#2E7D32', '#F57F17', '#D32F2F', '#7B1FA2', '#0277BD', '#C2185B', '#00838F', '#FF6F00', '#3f51b5'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Lesson[]>(`${environment.apiUrl}/teacher/schedule`).subscribe({
      next: l => { this.lessons = l; this.loading = false; },
      error: () => this.loading = false
    });
  }

  formatDay(day: string): string {
    return day.charAt(0) + day.slice(1).toLowerCase();
  }

  getLessonsForDay(day: string): Lesson[] {
    return this.lessons.filter(l => l.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  getSubjectColor(name: string): string {
    if (!this.subjectColors[name]) {
      const idx = Object.keys(this.subjectColors).length % this.colorPalette.length;
      this.subjectColors[name] = this.colorPalette[idx];
    }
    return this.subjectColors[name];
  }
}
