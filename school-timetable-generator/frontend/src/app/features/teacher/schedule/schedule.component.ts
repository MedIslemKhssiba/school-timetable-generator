import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CardModule, GridModule, BadgeModule } from '@coreui/angular';
import { Lesson, Timeslot } from '../../../core/models';
import { environment } from '@env/environment';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';
import { TranslationService } from '../../../core/services/translation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

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
      <div class="header-actions">
        @if (lessons.length > 0) {
          <span class="badge bg-primary px-3 py-2">{{ lessons.length }} {{ t('lessons_this_week') }}</span>
          <button class="export-btn" (click)="exportScheduleAsImage()" [disabled]="exportingImage">
            {{ exportingImage ? 'Export...' : 'Exporter' }}
          </button>
        }
      </div>
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
    .header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .export-btn {
      border: 1px solid rgba(37, 99, 235, 0.24);
      background: linear-gradient(135deg, #EEF4FF 0%, #DDF0FF 100%);
      color: #1D4ED8;
      font-family: 'Montserrat', sans-serif;
      font-size: 0.8rem;
      font-weight: 700;
      border-radius: 10px;
      padding: 8px 12px;
      box-shadow: 0 10px 20px rgba(37, 99, 235, 0.16);
    }
    .export-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #E0ECFF 0%, #CFE9FF 100%);
      color: #1E40AF;
      border-color: rgba(37, 99, 235, 0.34);
      box-shadow: 0 14px 24px rgba(37, 99, 235, 0.22);
    }
    .export-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      box-shadow: none;
    }

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
  exportingImage = false;
  exportSchoolName = 'EcoCode School';
  exportAcademicYear = this.getDefaultAcademicYear();
  selectedDay = '';
  days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  timeslots: Timeslot[] = [];
  timeSlots: string[] = [];
  timeSlotEndByStart: Record<string, string> = {};
  lunchBreakLabels: string[] = [];
  private subjectColors: Record<string, string> = {};
  private colorPalette = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#7C3AED', '#0EA5E9', '#EC4899', '#06B6D4', '#F97316', '#6366F1'];

  constructor(private http: HttpClient, private ts: TranslationService, private notif: NotificationService, private authService: AuthService) {}

  t(key: string): string { return this.ts.t(key); }

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        const schoolName = profile?.schoolName || profile?.school?.name;
        if (schoolName && String(schoolName).trim().length > 0) {
          this.exportSchoolName = String(schoolName).trim();
        }
      }
    });

    forkJoin({
      lessons: this.http.get<Lesson[]>(`${environment.apiUrl}/teacher/schedule`),
      timeslots: this.http.get<Timeslot[]>(`${environment.apiUrl}/teacher/timeslots`)
    }).subscribe({
      next: ({ lessons, timeslots }) => {
        this.lessons = lessons;
        this.timeslots = timeslots;
        this.buildMeta();
        this.loading = false;
      },
      error: () => {
        this.http.get<Lesson[]>(`${environment.apiUrl}/teacher/schedule`).subscribe({
          next: l => {
            this.lessons = l;
            this.timeslots = [];
            this.buildMeta();
            this.loading = false;
          },
          error: () => this.loading = false
        });
      }
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

  private getDefaultAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    if (month >= 8) {
      return `${year}-${year + 1}`;
    }
    return `${year - 1}-${year}`;
  }

  private getTimeSlotLabel(startTime: string): string {
    const endTime = this.timeSlotEndByStart[startTime];
    return endTime ? `${startTime}-${endTime}` : startTime;
  }

  private buildMeta(): void {
    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const times = new Set<string>();
    const daysSet = new Set<string>();
    const lunchBreaks = new Set<string>();
    this.timeSlotEndByStart = {};
    this.lunchBreakLabels = [];

    this.timeslots.forEach(ts => {
      if (ts.startTime) {
        const normalizedStart = this.normalizeTime(ts.startTime);
        times.add(normalizedStart);
        if (ts.endTime) {
          this.timeSlotEndByStart[normalizedStart] = this.normalizeTime(ts.endTime);
        }
      }
      if (ts.dayOfWeek) {
        daysSet.add(ts.dayOfWeek);
      }
      if (ts.breakStartTime && ts.breakEndTime) {
        lunchBreaks.add(`${this.normalizeTime(ts.breakStartTime)}-${this.normalizeTime(ts.breakEndTime)}`);
      }
    });

    this.lessons.forEach(l => {
      const normalizedStart = this.normalizeTime(l.startTime);
      times.add(normalizedStart);
      if (l.endTime) {
        this.timeSlotEndByStart[normalizedStart] = this.normalizeTime(l.endTime);
      }
      if (l.dayOfWeek) {
        daysSet.add(l.dayOfWeek);
      }
    });

    if (daysSet.size > 0) {
      this.days = [...daysSet].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
    }
    this.timeSlots = [...times].sort((a, b) => a.localeCompare(b));
    this.lunchBreakLabels = [...lunchBreaks].sort((a, b) => a.localeCompare(b));
  }

  exportScheduleAsImage(): void {
    if (this.lessons.length === 0 || this.exportingImage) {
      return;
    }

    this.exportingImage = true;
    this.renderProfessionalTeacherImage().then((blob) => {
      this.downloadBlob(blob, this.buildProfessionalExportFileName());
      this.notif.success('Export image terminé');
      this.exportingImage = false;
    }).catch(() => {
      this.exportingImage = false;
      this.notif.error('Échec de l export image');
    });
  }

  private truncateCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (!text) {
      return '';
    }
    if (ctx.measureText(text).width <= maxWidth) {
      return text;
    }
    const ellipsis = '...';
    let low = 0;
    let high = text.length;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      const candidate = `${text.slice(0, mid)}${ellipsis}`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }
    return `${text.slice(0, low)}${ellipsis}`;
  }

  private normalizeTime(value?: string | null): string {
    if (!value) {
      return '';
    }
    const parts = value.split(':');
    if (parts.length < 2) {
      return value;
    }
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }

  private hexToRgba(hex: string, alpha: number): string {
    const value = (hex || '').replace('#', '').trim();
    const normalized = value.length === 3
      ? value.split('').map((c) => `${c}${c}`).join('')
      : value.padEnd(6, '0').slice(0, 6);
    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private async renderProfessionalTeacherImage(): Promise<Blob> {
    const days = this.days.length > 0 ? this.days : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const configuredStarts = new Set<string>();
    const endByStart: Record<string, string> = {};

    this.timeSlots.forEach(start => {
      configuredStarts.add(start);
      const end = this.timeSlotEndByStart[start];
      if (end) {
        endByStart[start] = end;
      }
    });

    this.lessons.forEach(l => {
      const start = this.normalizeTime(l.startTime);
      if (!start) {
        return;
      }
      configuredStarts.add(start);
      if (l.endTime && !endByStart[start]) {
        endByStart[start] = this.normalizeTime(l.endTime);
      }
    });

    const slots = configuredStarts.size > 0
      ? Array.from(configuredStarts).sort((a, b) => a.localeCompare(b))
      : (this.timeSlots.length > 0 ? this.timeSlots : Array.from(new Set(this.lessons.map(l => this.normalizeTime(l.startTime)))).sort((a, b) => a.localeCompare(b)));

    const breakRows = this.lunchBreakLabels
      .map(label => {
        const [rawStart, rawEnd] = label.split('-');
        const start = this.normalizeTime(rawStart || '');
        const end = this.normalizeTime(rawEnd || '');
        return { kind: 'break' as const, start, end, label: start && end ? `${start}-${end}` : label };
      })
      .filter(row => !!row.start)
      .sort((a, b) => a.start.localeCompare(b.start));

    const timeRows: Array<{ kind: 'lesson' | 'break'; start: string; label: string }> = [
      ...slots.map(slot => ({
        kind: 'lesson' as const,
        start: slot,
        label: endByStart[slot] ? `${slot}-${endByStart[slot]}` : this.getTimeSlotLabel(slot)
      })),
      ...breakRows.map(row => ({ kind: 'break' as const, start: row.start, label: row.label }))
    ].sort((a, b) => {
      const byStart = a.start.localeCompare(b.start);
      if (byStart !== 0) return byStart;
      if (a.kind === b.kind) return 0;
      return a.kind === 'break' ? -1 : 1;
    });

    const teacherName = this.lessons.find(l => !!l.teacherName)?.teacherName || 'Enseignant';
    const schoolName = this.exportSchoolName?.trim() || 'École';
    const academicYear = this.exportAcademicYear || this.getDefaultAcademicYear();

    const scale = 2;
    const headerHeight = 180;
    const leftCol = 170;
    const dayCol = 290;
    const rowHeight = 128;
    const width = leftCol + dayCol * days.length;
    const slotRowCount = Math.max(1, timeRows.length);
    const tableRowCount = slotRowCount + 1;
    const gridHeight = tableRowCount * rowHeight;
    const height = headerHeight + gridHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas indisponible');
    }
    ctx.scale(scale, scale);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const headerGradient = ctx.createLinearGradient(0, 0, width, 0);
    headerGradient.addColorStop(0, '#0f4c81');
    headerGradient.addColorStop(1, '#1e88e5');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, width, headerHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 30px Montserrat, Arial, sans-serif';
    ctx.fillText(schoolName, 36, 56);
    ctx.font = '700 22px Montserrat, Arial, sans-serif';
    const scopeLabel = this.truncateCanvasText(ctx, `Enseignant : ${teacherName}`, width * 0.68);
    ctx.fillText(scopeLabel, 36, 100);
    ctx.font = '600 18px Montserrat, Arial, sans-serif';
    ctx.fillText(`Année scolaire : ${academicYear}`, 36, 132);

    ctx.textAlign = 'right';
    ctx.font = '500 16px Montserrat, Arial, sans-serif';
    ctx.fillText(`Emploi valable à partir du ${new Date().toLocaleDateString('fr-FR')}`, width - 24, 40);
    ctx.textAlign = 'left';

    const gridTop = headerHeight;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, gridTop, width, rowHeight);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    for (let i = 0; i <= days.length; i++) {
      const x = leftCol + i * dayCol;
      ctx.beginPath();
      ctx.moveTo(x, gridTop);
      ctx.lineTo(x, gridTop + gridHeight);
      ctx.stroke();
    }
    for (let r = 0; r <= tableRowCount; r++) {
      const y = gridTop + r * rowHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#0f172a';
    ctx.font = '700 15px Montserrat, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Créneau', leftCol / 2, gridTop + (rowHeight / 2));
    days.forEach((day, index) => {
      const x = leftCol + index * dayCol + (dayCol / 2);
      ctx.fillText(this.formatDay(day), x, gridTop + (rowHeight / 2));
    });
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    const lessonMap = new Map<string, Lesson[]>();
    this.lessons.forEach(l => {
      const key = `${l.dayOfWeek}|${this.normalizeTime(l.startTime)}`;
      const arr = lessonMap.get(key) || [];
      arr.push(l);
      lessonMap.set(key, arr);
    });

    timeRows.forEach((rowInfo, row) => {
      const y = gridTop + rowHeight * (row + 1);
      ctx.fillStyle = '#1e3a8a';
      ctx.font = '600 14px Montserrat, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(rowInfo.label, leftCol / 2, y + (rowHeight / 2));
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      if (rowInfo.kind === 'break') {
        days.forEach((day, col) => {
          const x = leftCol + col * dayCol;
          const blockPadding = 8;
          const blockY = y + 8;
          const blockH = rowHeight - 16;
          const dayHasBreak = this.timeslots.some(ts =>
            ts.dayOfWeek === day
            && ts.breakStartTime
            && ts.breakEndTime
            && this.normalizeTime(ts.breakStartTime) === rowInfo.start
          );

          ctx.fillStyle = dayHasBreak ? '#fff7ed' : '#f8fafc';
          ctx.fillRect(x + blockPadding, blockY, dayCol - blockPadding * 2, blockH);
          ctx.strokeStyle = dayHasBreak ? '#fdba74' : '#e2e8f0';
          ctx.strokeRect(x + blockPadding, blockY, dayCol - blockPadding * 2, blockH);
          ctx.fillStyle = dayHasBreak ? '#9a3412' : '#94a3b8';
          ctx.font = '700 12px Montserrat, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(dayHasBreak ? 'Pause déjeuner' : '-', x + (dayCol / 2), blockY + (blockH / 2) + 4);
          ctx.textAlign = 'left';
        });
        return;
      }

      days.forEach((day, col) => {
        const x = leftCol + col * dayCol;
        const items = lessonMap.get(`${day}|${rowInfo.start}`) || [];
        const blockPadding = 8;
        const blockY = y + 8;
        const blockH = rowHeight - 16;
        if (items.length === 0) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(x + blockPadding, blockY, dayCol - blockPadding * 2, blockH);
          ctx.strokeStyle = '#e2e8f0';
          ctx.strokeRect(x + blockPadding, blockY, dayCol - blockPadding * 2, blockH);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '500 11px Montserrat, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Aucun cours', x + (dayCol / 2), blockY + (blockH / 2) + 4);
          ctx.textAlign = 'left';
          return;
        }

        const first = items[0];
        const cardColor = this.getSubjectColor(first.subjectName);
        const contentWidth = dayCol - 34;
        const badgeText = rowInfo.label;
        const badgeX = x + dayCol - 18;
        const badgeY = blockY + 18;
        ctx.font = '700 10px Montserrat, Arial, sans-serif';
        const badgeW = Math.min(120, Math.max(54, ctx.measureText(badgeText).width + 16));

        ctx.fillStyle = this.hexToRgba(cardColor, 0.12);
        ctx.fillRect(x + blockPadding, blockY, dayCol - blockPadding * 2, blockH);
        ctx.fillStyle = cardColor;
        ctx.fillRect(x + blockPadding, blockY, 4, blockH);

        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(badgeX - badgeW, badgeY - 10, badgeW, 18);
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(this.truncateCanvasText(ctx, badgeText, badgeW - 10), badgeX - (badgeW / 2), badgeY + 3);
        ctx.textAlign = 'left';

        ctx.fillStyle = '#0f172a';
        ctx.font = '700 14px Montserrat, Arial, sans-serif';
        ctx.fillText(this.truncateCanvasText(ctx, first.subjectName, contentWidth - badgeW - 8), x + 18, blockY + 24);
        ctx.font = '500 12px Montserrat, Arial, sans-serif';
        ctx.fillStyle = '#334155';
        ctx.fillText(this.truncateCanvasText(ctx, `Enseignant : ${first.teacherName}`, contentWidth), x + 18, blockY + 54);
        ctx.fillText(this.truncateCanvasText(ctx, `Salle : ${first.roomName}`, contentWidth), x + 18, blockY + 78);
        if (items.length > 1) {
          ctx.fillStyle = '#7c2d12';
          ctx.font = '700 11px Montserrat, Arial, sans-serif';
          ctx.fillText(`+${items.length - 1} autre(s) cours`, x + 18, blockY + 100);
        }
      });
    });

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Impossible de générer l image'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    });
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  private buildProfessionalExportFileName(): string {
    const teacherName = this.lessons.find(l => !!l.teacherName)?.teacherName || 'enseignant';
    const date = new Date();
    const dateToken = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return `emploi-du-temps-enseignant-${this.slugify(teacherName)}-${dateToken}.png`;
  }

  private slugify(value: string): string {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
