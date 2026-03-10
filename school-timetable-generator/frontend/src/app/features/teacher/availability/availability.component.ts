import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CardModule, GridModule, ButtonDirective, FormModule } from '@coreui/angular';
import { Timeslot, TeacherAvailability } from '../../../core/models';
import { environment } from '@env/environment';
import { NotificationService } from '../../../core/services/notification.service';
import { SkeletonComponent } from '../../../shared/ui/skeleton.component';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, GridModule, ButtonDirective, FormModule, SkeletonComponent],
  template: `
    <div class="page-header mb-4">
      <div>
        <h2 class="page-title">My Availability</h2>
        <p class="page-subtitle">Set when you're available to teach</p>
      </div>
      <button cButton color="primary" (click)="save()" [disabled]="!hasChanges">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-1"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
        Save Availability
      </button>
    </div>

    <c-card class="mb-4 info-card">
      <c-card-body class="d-flex align-items-center gap-3 py-3">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#1565C0" class="flex-shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        <p class="mb-0 text-muted" style="font-size: 0.85rem">Check the timeslots when you are available to teach. Your availability will be considered when generating timetables.</p>
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
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="me-2 opacity-75"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
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
                      <svg *ngIf="isAvailable(slot.id)" viewBox="0 0 24 24" width="18" height="18" fill="#2E7D32"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      <svg *ngIf="!isAvailable(slot.id)" viewBox="0 0 24 24" width="18" height="18" fill="#C0C8D4"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
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
          <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor" class="text-info opacity-25 mb-3"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
          <h3 class="fw-bold mb-2">No Timeslots Configured</h3>
          <p class="text-muted mb-0">Please contact your administrator to set up timeslots.</p>
        </c-card-body>
      </c-card>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #1A2236; margin: 0; }
    .page-subtitle { font-size: 0.875rem; color: #8892A4; margin: 4px 0 0; }

    .info-card { border-left: 4px solid #1565C0 !important; }

    .day-header {
      display: flex; align-items: center;
      background: linear-gradient(135deg, #1565C0, #42A5F5);
      color: white; font-weight: 600;
    }
    .slot-row {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; margin: 4px 6px; border-radius: 8px;
      border-left: 3px solid #E2E8F0; cursor: pointer;
      transition: all 0.15s;
      &:hover { background: #F8FAFC; }
      &.available {
        border-left-color: #2E7D32;
        background: rgba(46, 125, 50, 0.06);
      }
    }
    .slot-check { width: 18px; height: 18px; flex-shrink: 0; }
    .slot-time { font-weight: 600; font-size: 0.85rem; color: #1A2236; }
  `]
})
export class AvailabilityComponent implements OnInit {
  timeslots: Timeslot[] = [];
  availabilities: TeacherAvailability[] = [];
  availabilityMap: Record<number, boolean> = {};
  days: string[] = [];
  loading = true;
  hasChanges = false;

  constructor(private http: HttpClient, private notify: NotificationService) {}

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
    return day.charAt(0) + day.slice(1).toLowerCase();
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
