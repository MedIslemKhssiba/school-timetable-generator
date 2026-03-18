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
        <div class="header-icon mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><rect x="5" y="12" width="4" height="4"/><rect x="11" y="12" width="4" height="4"/><rect x="17" y="12" width="4" height="4"/></svg>
        </div>
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
      <div class="day-summary mb-3">
        @for (day of days; track day) {
          <div class="day-chip">
            <span class="day-name">{{ formatDay(day) }}</span>
            <span class="day-count">{{ getDayCount(day) }}</span>
          </div>
        }
      </div>

      <c-card>
        <c-card-body class="p-0">
          <div class="table-wrap">
            <table class="schedule-table">
              <thead>
                <tr>
                  <th>{{ t('day') }}</th>
                  <th>{{ t('time') }}</th>
                  <th>{{ t('subject') }}</th>
                  <th>{{ t('class') }}</th>
                  <th>{{ t('room') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (lesson of sortedLessons; track lesson.id) {
                  <tr>
                    <td><span class="day-badge">{{ formatDay(lesson.dayOfWeek) }}</span></td>
                    <td class="time-cell">{{ lesson.startTime }} - {{ lesson.endTime }}</td>
                    <td class="subject-cell">{{ lesson.subjectName }}</td>
                    <td>{{ lesson.classGroupName }}</td>
                    <td>{{ lesson.roomName }}</td>
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
    .header-icon {
      width: 34px; height: 34px; border-radius: 10px;
      background: #EAEEF6; color: #2563EB;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8D99A8; margin: 4px 0 0; font-family: 'Montserrat', sans-serif; }

    .day-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
    }
    .day-chip {
      background: #F8FAFF;
      border: 1px solid #DDE3EE;
      border-radius: 10px;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .day-name { font-size: 0.8rem; font-weight: 600; color: #1A2332; font-family: 'Montserrat', sans-serif; }
    .day-count {
      background: #2563EB;
      color: #F8FAFF;
      border-radius: 999px;
      min-width: 24px;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      font-family: 'Montserrat', sans-serif;
    }

    .table-wrap { overflow-x: auto; }
    .schedule-table {
      width: 100%;
      min-width: 680px;
      border-collapse: collapse;
    }
    .schedule-table th,
    .schedule-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #DDE3EE;
      font-size: 0.85rem;
      color: #1A2332;
      font-family: 'Montserrat', sans-serif;
    }
    .schedule-table thead th {
      background: #F0F4FA;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #8D99A8;
      font-weight: 700;
      border-bottom: 1px solid #DDE3EE;
    }
    .schedule-table tbody tr:hover { background: #F8FAFF; }
    .day-badge {
      background: #E8F0FF;
      color: #2563EB;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 0.72rem;
      font-weight: 700;
      display: inline-block;
    }
    .time-cell { color: #2563EB !important; font-weight: 600; white-space: nowrap; }
    .subject-cell { font-weight: 700; }
  `]
})
export class ScheduleComponent implements OnInit {
  lessons: Lesson[] = [];
  loading = true;
  days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  private dayOrder: Record<string, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7
  };

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

  getDayCount(day: string): number {
    return this.lessons.filter(l => l.dayOfWeek === day).length;
  }

  get sortedLessons(): Lesson[] {
    return [...this.lessons].sort((a, b) => {
      const dayCompare = (this.dayOrder[a.dayOfWeek] ?? 99) - (this.dayOrder[b.dayOfWeek] ?? 99);
      if (dayCompare !== 0) return dayCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }
}
