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
      <c-card class="schedule-card">
        <c-card-body class="p-0">
          <div class="schedule-table-wrapper">
            <table class="schedule-table">
              <thead>
                <tr>
                  <th class="time-col">Time</th>
                  @for (day of displayDays; track day) {
                    <th>{{ formatDay(day) }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (slot of timeSlots; track slot) {
                  <tr>
                    <td class="time-col fw-semibold">{{ slot }}</td>
                    @for (day of displayDays; track day) {
                      <td>
                        @for (lesson of getLessonsAt(day, slot); track lesson.id) {
                          <div class="lesson-block" [style.border-left-color]="getSubjectColor(lesson.subjectName)">
                            <div class="lesson-subject">{{ lesson.subjectName }}</div>
                            <div class="lesson-meta">{{ lesson.classGroupName }} · {{ lesson.roomName }}</div>
                            <div class="lesson-meta">{{ lesson.startTime }} - {{ lesson.endTime }}</div>
                          </div>
                        } @empty {
                          <span class="cell-empty">—</span>
                        }
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </c-card-body>
      </c-card>
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
    .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8D99A8; margin: 4px 0 0; font-family: 'Montserrat', sans-serif; }

    .schedule-card { border: 1px solid #DDE3EE; }
    .schedule-table-wrapper { overflow-x: auto; }
    .schedule-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      min-width: 900px;
      font-family: 'Montserrat', sans-serif;
    }
    .schedule-table thead th {
      position: sticky;
      top: 0;
      z-index: 1;
      background: #1E3A8A;
      color: #F8FAFF;
      font-size: 0.82rem;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      padding: 12px;
      border-right: 1px solid rgba(255,255,255,0.14);
    }
    .schedule-table th:last-child { border-right: none; }
    .schedule-table td {
      vertical-align: top;
      padding: 10px;
      border-right: 1px solid #E7ECF5;
      border-bottom: 1px solid #E7ECF5;
      background: #FFFFFF;
      min-height: 84px;
    }
    .schedule-table tbody tr:nth-child(even) td { background: #F9FBFF; }
    .schedule-table td:last-child { border-right: none; }
    .time-col {
      width: 120px;
      min-width: 120px;
      text-align: center;
      color: #334155;
      background: #F1F5F9 !important;
    }
    .lesson-block {
      border-left: 4px solid #2563EB;
      border-radius: 8px;
      padding: 8px 10px;
      background: #EEF4FF;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
      margin-bottom: 6px;
    }
    .lesson-subject {
      font-size: 0.88rem;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 4px;
    }
    .lesson-meta {
      font-size: 0.76rem;
      color: #475569;
      line-height: 1.35;
    }
    .cell-empty {
      color: #94A3B8;
      font-size: 0.9rem;
      display: inline-block;
      padding-top: 8px;
    }
  `]
})
export class ScheduleComponent implements OnInit {
  lessons: Lesson[] = [];
  loading = true;
  readonly days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  displayDays: string[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  timeSlots: string[] = [];
  private subjectColors: Record<string, string> = {};
  private colorPalette = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#7C3AED', '#0EA5E9', '#EC4899', '#06B6D4', '#F97316', '#6366F1'];

  constructor(private http: HttpClient, private ts: TranslationService) {}

  t(key: string): string { return this.ts.t(key); }

  ngOnInit(): void {
    this.http.get<Lesson[]>(`${environment.apiUrl}/teacher/schedule`).subscribe({
      next: l => {
        this.lessons = l;
        this.buildGridMeta();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  formatDay(day: string): string {
    return this.ts.t(day);
  }

  getLessonsAt(day: string, slot: string): Lesson[] {
    return this.lessons
      .filter(l => l.dayOfWeek === day && l.startTime === slot)
      .sort((a, b) => a.endTime.localeCompare(b.endTime));
  }

  getSubjectColor(name: string): string {
    if (!this.subjectColors[name]) {
      const idx = Object.keys(this.subjectColors).length % this.colorPalette.length;
      this.subjectColors[name] = this.colorPalette[idx];
    }
    return this.subjectColors[name];
  }

  private buildGridMeta(): void {
    const daySet = new Set(this.lessons.map(lesson => lesson.dayOfWeek).filter(Boolean));
    this.displayDays = this.days.filter(day => daySet.has(day));
    if (this.displayDays.length === 0) {
      this.displayDays = [...this.days];
    }

    const slotSet = new Set(this.lessons.map(lesson => lesson.startTime).filter(Boolean));
    this.timeSlots = [...slotSet].sort((a, b) => a.localeCompare(b));
  }
}
