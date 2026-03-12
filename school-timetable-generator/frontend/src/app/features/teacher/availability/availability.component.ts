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
      <c-row>
        @for (day of days; track day) {
          <c-col lg md="6" class="mb-4">
            <c-card class="h-100">
              <c-card-header class="day-header">
                <span>{{ formatDay(day) }}</span>
                <span class="ms-auto" style="font-size: 0.75rem; opacity: 0.85">
                  {{ getAvailableCount(day) }}/{{ getTimeslotsForDay(day).length }}
                </span>
              </c-card-header>
              <c-card-body class="p-2">
                @for (slot of getTimeslotsForDay(day); track slot.id) {
                  <div class="slot-row" [class.available]="isAvailable(slot.id)"
                       (click)="toggle(slot.id, !isAvailable(slot.id))">
                    <div class="slot-check">
                      <span *ngIf="isAvailable(slot.id)" style="color:#22C55E; font-weight:bold">&#10003;</span>
                      <span *ngIf="!isAvailable(slot.id)" style="color:#C0C8D4">&#9744;</span>
                    </div>
                    <span class="slot-time">{{ slot.startTime }} - {{ slot.endTime }}</span>
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

    .day-header {
      display: flex; align-items: center;
      background: #2563EB;
      color: #F8FAFF; font-weight: 600; font-family: 'Montserrat', sans-serif;
    }
    .slot-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; margin: 4px 6px; border-radius: 8px;
      border-left: 3px solid #DDE3EE; cursor: pointer;
      transition: all 0.15s;
      &:hover { background: #F0F4FA; }
      &.available {
        border-left-color: #6B9080;
        background: rgba(107, 144, 128, 0.06);
      }
    }
    .slot-check { width: 18px; height: 18px; flex-shrink: 0; }
    .slot-time { font-weight: 600; font-size: 0.85rem; color: #1A2332; font-family: 'Montserrat', sans-serif; }
  `]
})
export class AvailabilityComponent implements OnInit {
  timeslots: Timeslot[] = [];
  availabilities: TeacherAvailability[] = [];
  availabilityMap: Record<number, boolean> = {};
  days: string[] = [];
  loading = true;
  hasChanges = false;

  constructor(private http: HttpClient, private notify: NotificationService, private ts: TranslationService) {}

  t(key: string): string { return this.ts.t(key); }

  ngOnInit(): void {
    this.http.get<TeacherAvailability[]>(`${environment.apiUrl}/teacher/availabilities`).subscribe({
      next: avails => {
        this.availabilities = avails;
        avails.forEach(a => this.availabilityMap[a.timeslotId] = a.available);
      }
    });
    this.http.get<Timeslot[]>(`${environment.apiUrl}/admin/timetable/timeslots`).subscribe({
      next: slots => {
        this.timeslots = slots;
        this.days = [...new Set(slots.map(s => s.dayOfWeek))];
        this.loading = false;
      },
      error: () => this.loading = false
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
      error: () => this.notify.error('Failed to save availability')
    });
  }
}
