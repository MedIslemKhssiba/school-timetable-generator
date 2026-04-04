import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CardModule, GridModule, ButtonDirective, FormModule } from '@coreui/angular';
import { Timeslot, TeacherAvailability } from '../../../core/models';
import { environment } from '@env/environment';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, GridModule, ButtonDirective, FormModule, SkeletonComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">{{ t('my_availability') }}</h2>
        <p class="page-subtitle">{{ t('set_when_available') }}</p>
      </div>
      <button cButton color="primary" (click)="save()" [disabled]="!hasChanges">
        {{ t('save_availability') }}
      </button>
    </div>

    <c-card class="mb-4 info-card">
      <c-card-body class="d-flex align-items-center gap-3 py-3">
        <p class="mb-0 text-muted" style="font-size: 0.85rem">{{ t('check_timeslots') }}</p>
      </c-card-body>
    </c-card>

    @if (loading) {
      <ui-skeleton type="cards" [count]="5" />
    } @else if (days.length > 0) {
      <c-card class="availability-shell mb-4">
        <c-card-body class="p-0">
          <div class="week-layout">
            <aside class="week-rail">
              <button class="day-pill all" [class.active]="!selectedDay" (click)="clearSelectedDay()">
                <span class="day-pill-label">Semaine complète</span>
                <span class="day-pill-count">{{ timeslots.length }}</span>
              </button>
              @for (day of days; track day) {
                <button class="day-pill" [class.active]="selectedDay === day" (click)="setSelectedDay(day)">
                  <span class="day-pill-label">{{ formatDay(day) }}</span>
                  <span class="day-pill-count">{{ getAvailableCount(day) }}/{{ getTimeslotsForDay(day).length }}</span>
                </button>
              }
            </aside>

            <section class="week-stage">
              <div class="week-stage-header">
                <h3>{{ selectedDay ? formatDay(selectedDay) : 'Disponibilités hebdomadaires' }}</h3>
                <p>{{ selectedDay ? getAvailableCount(selectedDay) : availableTotal() }} créneau{{ (selectedDay ? getAvailableCount(selectedDay) : availableTotal()) > 1 ? 'x' : '' }} disponible{{ (selectedDay ? getAvailableCount(selectedDay) : availableTotal()) > 1 ? 's' : '' }}</p>
              </div>

              <div class="timeline-grid" [class.single-day]="!!selectedDay">
                @for (day of visibleDays(); track day) {
                  <section class="timeline-day">
                    <header class="timeline-day-header">
                      <span class="day-name">{{ formatDay(day) }}</span>
                      <span class="availability-chip">{{ getAvailableCount(day) }}/{{ getTimeslotsForDay(day).length }}</span>
                    </header>
                    @for (slot of getTimeslotsForDay(day); track slot.id) {
                      <article class="timeline-slot" [class.available]="isAvailable(slot.id)" (click)="toggle(slot.id, !isAvailable(slot.id))">
                        <div class="slot-start">{{ slot.startTime }}</div>
                        <div class="slot-track"></div>
                        <div class="slot-content">
                          <div class="slot-time">{{ slot.startTime }} - {{ slot.endTime }}</div>
                          <div class="slot-state">{{ isAvailable(slot.id) ? 'Disponible' : 'Indisponible' }}</div>
                        </div>
                      </article>
                    } @empty {
                      <div class="day-empty">{{ t('no_timeslots') }}</div>
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
          <h3 class="fw-bold mb-2">{{ t('no_timeslots') }}</h3>
          <p class="text-muted mb-0">{{ t('contact_admin_timeslots') }}</p>
        </c-card-body>
      </c-card>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .page-title { font-family: 'Montserrat', sans-serif; font-size: 1.875rem; font-weight: 700; color: #1A2332; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8D99A8; margin: 4px 0 0; font-family: 'Montserrat', sans-serif; }

    .info-card { border-left: 4px solid #2563EB !important; }
    .availability-shell {
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
      background: transparent;
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
    .day-pill.active .day-pill-label,
    .day-pill.active .day-pill-count { color: #FFFFFF; }
    .day-pill-label { font-size: 0.8rem; font-weight: 700; color: #25354D; }
    .day-pill-count { font-size: 0.72rem; font-weight: 700; color: #344861; }

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
    .availability-chip {
      font-size: 0.72rem;
      font-weight: 700;
      color: #155E75;
      background: #E6F8FF;
      border: 1px solid #BDEBFF;
      border-radius: 999px;
      padding: 3px 9px;
    }

    .timeline-slot {
      display: grid;
      grid-template-columns: 54px 14px 1fr;
      gap: 8px;
      align-items: start;
      padding: 10px 12px 0;
      cursor: pointer;
    }
    .slot-start {
      font-size: 0.72rem;
      color: #6C7D94;
      font-weight: 700;
      line-height: 1.3;
      font-family: 'Montserrat', sans-serif;
      padding-top: 6px;
    }
    .slot-track { position: relative; min-height: 68px; }
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
      background: linear-gradient(180deg, #9CA3AF, #94A3B8);
      box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.18);
    }
    .timeline-slot.available .slot-track::after {
      background: linear-gradient(180deg, #16A34A, #22C55E);
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
    }
    .slot-content {
      padding: 10px 11px;
      border-radius: 12px;
      border: 1px solid #DCE7F7;
      background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
      box-shadow: 0 8px 18px rgba(13, 27, 62, 0.08);
      margin-bottom: 2px;
      transition: all 180ms ease;
    }
    .timeline-slot.available .slot-content {
      border-color: #BBE6C9;
      background: linear-gradient(180deg, #F7FFF9 0%, #ECFDF1 100%);
    }
    .slot-time { font-weight: 700; font-size: 0.86rem; color: #1A2332; font-family: 'Montserrat', sans-serif; }
    .slot-state { margin-top: 4px; font-size: 0.76rem; color: #B91C1C; font-family: 'Montserrat', sans-serif; }
    .timeline-slot.available .slot-state { color: #166534; }
    .day-empty { padding: 16px 12px; color: #8D99A8; font-size: 0.82rem; font-family: 'Montserrat', sans-serif; }

    @media (max-width: 576px) {
      .week-layout { grid-template-columns: 1fr; }
      .week-rail { position: static; }
      .timeline-slot { grid-template-columns: 1fr; }
      .slot-track, .slot-start { display: none; }
    }
  `]
})
export class AvailabilityComponent implements OnInit {
  timeslots: Timeslot[] = [];
  availabilities: TeacherAvailability[] = [];
  availabilityMap: Record<number, boolean> = {};
  days: string[] = [];
  readonly orderedDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  selectedDay = '';
  loading = true;
  hasChanges = false;

  constructor(private http: HttpClient, private notify: NotificationService, private ts: TranslationService) {}

  t(key: string): string { return this.ts.t(key); }

  ngOnInit(): void {
    this.http.get<TeacherAvailability[]>(`${environment.apiUrl}/teacher/availabilities`).subscribe({
      next: avails => {
        this.availabilities = avails;
        avails.forEach(a => this.availabilityMap[a.timeslotId] = a.available);
      },
      error: () => this.notify.error('Impossible de charger les disponibilites enseignant')
    });
    this.http.get<Timeslot[]>(`${environment.apiUrl}/teacher/timeslots`).subscribe({
      next: slots => {
        this.timeslots = slots;
        this.days = [...new Set(slots.map(s => s.dayOfWeek))]
          .sort((a, b) => this.dayRank(a) - this.dayRank(b));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notify.error('Impossible de charger les creneaux horaires');
      }
    });
  }

  getTimeslotsForDay(day: string): Timeslot[] {
    return this.timeslots.filter(t => t.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  getAvailableCount(day: string): number {
    return this.getTimeslotsForDay(day).filter(s => this.isAvailable(s.id)).length;
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

  private dayRank(day: string): number {
    const idx = this.orderedDays.indexOf(day);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  }

  availableTotal(): number {
    return this.timeslots.filter(t => this.isAvailable(t.id)).length;
  }

  isAvailable(timeslotId: number): boolean {
    return this.availabilityMap[timeslotId] !== false;
  }

  toggle(timeslotId: number, checked: boolean): void {
    this.availabilityMap[timeslotId] = checked;
    this.hasChanges = true;
  }

  save(): void {
    const data = Object.entries(this.availabilityMap).map(([timeslotId, available]) => ({
      timeslotId: +timeslotId,
      available
    }));
    this.http.put<TeacherAvailability[]>(`${environment.apiUrl}/teacher/availabilities`, data).subscribe({
      next: () => { this.notify.success('Availability saved!'); this.hasChanges = false; },
      error: () => this.notify.error('Échec de l enregistrement des disponibilités')
    });
  }
}
