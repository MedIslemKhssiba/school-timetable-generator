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
      <c-card class="schedule-shell mb-4">
        <c-card-body class="p-0">
          <div class="week-layout">
            <aside class="week-rail">
              <button class="day-pill all" [class.active]="!selectedDay" (click)="clearSelectedDay()">
                <span class="day-pill-label">Semaine complète</span>
                <span class="day-pill-count">{{ lessons.length }}</span>
              </button>
              @for (day of days; track day) {
                <button class="day-pill" [class.active]="selectedDay === day" (click)="setSelectedDay(day)">
                  <span class="day-pill-label">{{ formatDay(day) }}</span>
                  <span class="day-pill-count">{{ getLessonsForDay(day).length }}</span>
                </button>
              }
            </aside>

            <section class="week-stage">
              <div class="week-stage-header">
                <h3>{{ selectedDay ? formatDay(selectedDay) : 'Vue hebdomadaire des cours' }}</h3>
                <p><span class="teaching-hours-value">{{ selectedDay ? dailyTeachingHours(selectedDay) : weeklyTeachingHours() }}h</span> d'enseignement planifiées</p>
              </div>

              <div class="timeline-grid" [class.single-day]="!!selectedDay">
                @for (day of visibleDays(); track day) {
                  <section class="timeline-day">
                    <header class="timeline-day-header">
                      <span class="day-name">{{ formatDay(day) }}</span>
                      <c-badge color="light" textColor="dark">{{ getLessonsForDay(day).length }}</c-badge>
                    </header>
                    @for (lesson of getLessonsForDay(day); track lesson.id) {
                      <article class="timeline-slot">
                        <div class="slot-start">{{ lesson.startTime }}</div>
                        <div class="slot-track"></div>
                        <div class="slot-content" [style.border-left-color]="getSubjectColor(lesson.subjectName)">
                          <div class="lesson-time">{{ lesson.startTime }} - {{ lesson.endTime }}</div>
                          <div class="lesson-subject">{{ lesson.subjectName }}</div>
                          <div class="lesson-details">
                            <span>{{ lesson.classGroupName }}</span>
                            <span>{{ lesson.roomName }}</span>
                          </div>
                        </div>
                      </article>
                    } @empty {
                      <div class="day-empty">{{ t('no_lessons') }}</div>
                    }
                  </section>
                }
              </div>
            </section>
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

    .schedule-shell {
      border: 1px solid rgba(151, 176, 218, 0.45) !important;
      background: linear-gradient(180deg, rgba(255,255,255,0.97), rgba(245,250,255,0.98)) !important;
      box-shadow: 0 20px 36px rgba(15, 23, 42, 0.1) !important;
      overflow: hidden;
    }
    .week-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 18px;
      padding: 18px;
      background:
        radial-gradient(circle at 10% 10%, rgba(14, 165, 233, 0.12), transparent 28%),
        radial-gradient(circle at 90% 90%, rgba(37, 99, 235, 0.1), transparent 30%),
        linear-gradient(180deg, #f8fbff 0%, #f1f6ff 100%);
    }
    .week-rail {
      border: 1px solid rgba(187, 206, 235, 0.7);
      border-radius: 16px;
      background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(244,248,255,0.95));
      box-shadow: 0 12px 24px rgba(13, 27, 62, 0.09);
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-self: start;
      position: sticky;
      top: 12px;
    }
    .day-pill {
      border: 1px solid #D8E5FA;
      border-radius: 12px;
      background: #FFFFFF;
      min-height: 46px;
      padding: 8px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      transition: all 180ms ease;
      font-family: 'Montserrat', sans-serif;
    }
    .day-pill.active {
      background: linear-gradient(135deg, #2563EB, #0EA5E9);
      border-color: transparent;
    }
    .day-pill.active .day-pill-label { color: #FFFFFF; }
    .day-pill-label { font-size: 0.8rem; font-weight: 700; color: #25354D; }
    .day-pill-count {
      min-width: 26px;
      height: 26px;
      border-radius: 999px;
      background: #DBEAFE;
      color: #2563EB;
      border: 1px solid #BFDBFE;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .day-pill:hover .day-pill-count,
    .day-pill:focus .day-pill-count,
    .day-pill:focus-visible .day-pill-count,
    .day-pill.active .day-pill-count {
      color: #2563EB;
    }

    .week-stage {
      border: 1px solid rgba(190, 209, 238, 0.7);
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(247,250,255,0.95));
      box-shadow: 0 14px 26px rgba(13, 27, 62, 0.1);
      overflow: hidden;
    }
    .week-stage-header {
      padding: 14px 16px;
      border-bottom: 1px solid #E5ECF8;
      background: linear-gradient(180deg, #F8FBFF, #EFF5FF);
    }
    .week-stage-header h3 { margin: 0; font-size: 1rem; font-weight: 700; color: #1A2332; font-family: 'Montserrat', sans-serif; }
    .week-stage-header p { margin: 4px 0 0; font-size: 0.78rem; color: #6C7D94; font-family: 'Montserrat', sans-serif; }
    .teaching-hours-value { color: #2563EB; font-weight: 800; }
    .week-stage-header:hover .teaching-hours-value,
    .week-stage:hover .teaching-hours-value { color: #2563EB; }

    .timeline-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 14px;
      padding: 14px;
    }
    .timeline-grid.single-day { grid-template-columns: 1fr; }
    .timeline-day {
      border: 1px solid rgba(197, 214, 240, 0.72);
      border-radius: 14px;
      background: linear-gradient(180deg, #FFFFFF, #F8FBFF);
      box-shadow: 0 10px 20px rgba(13, 27, 62, 0.07);
      min-height: 180px;
      overflow: hidden;
    }
    .timeline-day-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid #ECF1F9;
      background: linear-gradient(180deg, #FCFDFF, #F2F7FF);
    }
    .day-name { font-size: 0.85rem; font-weight: 700; color: #25354D; font-family: 'Montserrat', sans-serif; }

    .timeline-slot {
      display: grid;
      grid-template-columns: 54px 14px 1fr;
      gap: 8px;
      align-items: start;
      padding: 10px 12px 0;
    }
    .slot-start {
      font-size: 0.72rem;
      color: #6C7D94;
      font-weight: 700;
      line-height: 1.3;
      font-family: 'Montserrat', sans-serif;
      padding-top: 6px;
    }
    .slot-track { position: relative; min-height: 78px; }
    .slot-track::before {
      content: '';
      position: absolute;
      left: 6px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(180deg, #BFDBFE, #93C5FD);
      border-radius: 999px;
    }
    .slot-track::after {
      content: '';
      position: absolute;
      left: 1px;
      top: 10px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: linear-gradient(180deg, #2563EB, #0EA5E9);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    .slot-content {
      padding: 10px 11px;
      border-radius: 12px;
      border-left: 4px solid #2563EB;
      border-top: 1px solid #DCE7F7;
      border-right: 1px solid #DCE7F7;
      border-bottom: 1px solid #DCE7F7;
      background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
      box-shadow: 0 8px 18px rgba(13, 27, 62, 0.08);
      margin-bottom: 2px;
    }
    .lesson-time {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; font-weight: 600; color: #2563EB; margin-bottom: 4px;
      font-family: 'Montserrat', sans-serif;
    }
    .lesson-subject { font-weight: 700; font-size: 0.95rem; margin-bottom: 6px; color: #1A2332; font-family: 'Montserrat', sans-serif; }
    .lesson-details { display: flex; flex-direction: column; gap: 2px; }
    .lesson-details span { font-size: 0.78rem; color: #8D99A8; font-family: 'Montserrat', sans-serif; }
    .day-empty { padding: 16px 12px; color: #8D99A8; font-size: 0.82rem; font-family: 'Montserrat', sans-serif; }

    @media (max-width: 576px) {
      .week-layout { grid-template-columns: 1fr; }
      .week-rail { position: static; }
      .timeline-slot { grid-template-columns: 1fr; }
      .slot-track, .slot-start { display: none; }
    }
  `]
})
export class ScheduleComponent implements OnInit {
  lessons: Lesson[] = [];
  loading = true;
  selectedDay = '';
  days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
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

  setSelectedDay(day: string): void {
    this.selectedDay = day;
  }

  clearSelectedDay(): void {
    this.selectedDay = '';
  }

  visibleDays(): string[] {
    return this.selectedDay ? [this.selectedDay] : this.days;
  }

  getLessonsForDay(day: string): Lesson[] {
    return this.lessons.filter(l => l.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  dailyTeachingHours(day: string): string {
    return this.totalHours(this.getLessonsForDay(day)).toFixed(1);
  }

  weeklyTeachingHours(): string {
    return this.totalHours(this.lessons).toFixed(1);
  }

  private totalHours(list: Lesson[]): number {
    let total = 0;
    for (const lesson of list) {
      const start = this.timeToMinutes(lesson.startTime);
      const end = this.timeToMinutes(lesson.endTime);
      if (start !== null && end !== null && end > start) {
        total += (end - start) / 60;
      }
    }
    return total;
  }

  private timeToMinutes(value: string | null | undefined): number | null {
    if (!value) return null;
    const [h, m] = value.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }

  getSubjectColor(name: string): string {
    if (!this.subjectColors[name]) {
      const idx = Object.keys(this.subjectColors).length % this.colorPalette.length;
      this.subjectColors[name] = this.colorPalette[idx];
    }
    return this.subjectColors[name];
  }
}
