import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CardModule, GridModule, BadgeModule } from '@coreui/angular';
import { Lesson } from '../../../core/models';
import { environment } from '@env/environment';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, CardModule, GridModule, BadgeModule, SkeletonComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">{{ t('my_schedule') }}</h2>
        <p class="page-subtitle">{{ t('weekly_timetable') }}</p>
      </div>
      @if (lessons.length > 0) {
        <span class="badge bg-primary px-3 py-2">{{ lessons.length }} {{ t('lessons_this_week') }}</span>
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
                <span>{{ formatDay(day) }}</span>
                <c-badge color="light" textColor="dark" class="ms-auto">{{ getLessonsForDay(day).length }}</c-badge>
              </c-card-header>
              <c-card-body class="p-2">
                @for (lesson of getLessonsForDay(day); track lesson.id) {
                  <div class="lesson-slot" [style.border-left-color]="getSubjectColor(lesson.subjectName)">
                    <div class="lesson-time">
                      {{ lesson.startTime }} - {{ lesson.endTime }}
                    </div>
                    <div class="lesson-subject">{{ lesson.subjectName }}</div>
                    <div class="lesson-details">
                      <span>{{ lesson.classGroupName }}</span>
                      <span>{{ lesson.roomName }}</span>
                    </div>
                  </div>
                } @empty {
                    <div class="text-center text-muted py-4"><small>{{ t('no_lessons') }}</small></div>
                }
              </c-card-body>
            </c-card>
          </c-col>
        }
      </c-row>
    } @else {
      <c-card>
        <c-card-body class="text-center py-5">
          <h3 class="fw-bold mb-2">{{ t('no_schedule_yet') }}</h3>
          <p class="text-muted mb-0">{{ t('schedule_appear_msg') }}</p>
        </c-card-body>
      </c-card>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #0F172A; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #94A3B8; margin: 4px 0 0; }

    .day-header {
      display: flex; align-items: center;
      background: linear-gradient(135deg, #2563EB, #60A5FA);
      color: white; font-weight: 600;
    }
    .lesson-slot {
      padding: 12px; margin: 6px; background: #f8fafd;
      border-radius: 8px; border-left: 3px solid #2563EB;
      transition: transform 0.15s, box-shadow 0.15s;
      &:hover { transform: translateX(4px); box-shadow: 0 2px 8px rgba(37,99,235,0.1); }
    }
    .lesson-time {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; font-weight: 600; color: #2563EB; margin-bottom: 4px;
    }
    .lesson-subject { font-weight: 700; font-size: 0.95rem; margin-bottom: 6px; color: #0F172A; }
    .lesson-details { display: flex; flex-direction: column; gap: 2px; }
    .lesson-details span { font-size: 0.78rem; color: #94A3B8; }
  `]
})
export class ScheduleComponent implements OnInit {
  lessons: Lesson[] = [];
  loading = true;
  days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  private subjectColors: Record<string, string> = {};
  private colorPalette = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#7C3AED', '#0EA5E9', '#EC4899', '#06B6D4', '#F97316', '#6366F1'];

  constructor(private http: HttpClient, private ts: TranslationService) {}

  t(key: string): string { return this.ts.t(key); }

  ngOnInit(): void {
    this.http.get<Lesson[]>(`${environment.apiUrl}/teacher/schedule`).subscribe({
      next: l => { this.lessons = l; this.loading = false; },
      error: () => this.loading = false
    });
  }

  formatDay(day: string): string {
    return this.ts.t(day);
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
