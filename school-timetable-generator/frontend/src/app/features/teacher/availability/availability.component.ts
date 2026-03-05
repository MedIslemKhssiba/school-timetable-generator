import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CardModule, GridModule, ButtonDirective, AlertComponent, FormModule } from '@coreui/angular';
import { Timeslot, TeacherAvailability } from '../../../core/models';
import { environment } from '@env/environment';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, GridModule, ButtonDirective, AlertComponent, FormModule],
  template: `
    <div class="page-header">
      <h2>My Availability</h2>
    </div>

    @if (msg) {
      <c-alert color="success" [dismissible]="true" (visibleChange)="msg=''">{{ msg }}</c-alert>
    }
    @if (errMsg) {
      <c-alert color="danger" [dismissible]="true" (visibleChange)="errMsg=''">{{ errMsg }}</c-alert>
    }

    <c-card class="mb-4">
      <c-card-body class="d-flex align-items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" class="text-primary flex-shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        <p class="mb-0 text-muted">Check the timeslots when you are available to teach. Your availability will be used when generating timetables.</p>
      </c-card-body>
    </c-card>

    @if (days.length > 0) {
      <c-row>
        @for (day of days; track day) {
          <c-col lg md="6" class="mb-4">
            <c-card class="h-100">
              <c-card-header class="day-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="me-2 opacity-75"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
                <span>{{ formatDay(day) }}</span>
              </c-card-header>
              <c-card-body class="p-2">
                @for (slot of getTimeslotsForDay(day); track slot.id) {
                  <div class="slot-row" [class.available]="isAvailable(slot.id)">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" [id]="'slot-' + slot.id"
                             [checked]="isAvailable(slot.id)"
                             (change)="toggle(slot.id, $any($event.target).checked)" />
                      <label class="form-check-label fw-medium" [for]="'slot-' + slot.id">
                        {{ slot.startTime }} - {{ slot.endTime }}
                      </label>
                    </div>
                  </div>
                }
              </c-card-body>
            </c-card>
          </c-col>
        }
      </c-row>
      <div class="mt-3">
        <button cButton color="primary" (click)="save()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" class="me-1"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
          Save Availability
        </button>
      </div>
    } @else {
      <c-card>
        <c-card-body class="text-center py-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="currentColor" class="text-info opacity-25 mb-3"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
          <h3>No Timeslots Configured</h3>
          <p class="text-muted">Please contact your administrator to set up timeslots.</p>
        </c-card-body>
      </c-card>
    }
  `,
  styles: [`
    .day-header {
      display: flex; align-items: center;
      background: linear-gradient(135deg, var(--cui-info, #3399ff), #6d28d9);
      color: white; font-weight: 600;
    }
    .slot-row {
      padding: 8px 12px; margin: 4px 6px; border-radius: 6px;
      border-left: 3px solid transparent; transition: all 0.15s;
    }
    .slot-row.available {
      border-left-color: var(--cui-success, #2eb85c);
      background: rgba(46, 184, 92, 0.08);
    }
    .slot-row:hover { background: var(--cui-tertiary-bg, #f8f9fa); }
  `]
})
export class AvailabilityComponent implements OnInit {
  timeslots: Timeslot[] = [];
  availabilities: TeacherAvailability[] = [];
  availabilityMap: Record<number, boolean> = {};
  days: string[] = [];
  msg = ''; errMsg = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<TeacherAvailability[]>(`${environment.apiUrl}/teacher/availabilities`).subscribe(avails => {
      this.availabilities = avails;
      avails.forEach(a => this.availabilityMap[a.timeslotId] = a.available);
    });
    this.http.get<Timeslot[]>(`${environment.apiUrl}/admin/timetable/timeslots`).subscribe({
      next: slots => {
        this.timeslots = slots;
        this.days = [...new Set(slots.map(s => s.dayOfWeek))];
      },
      error: () => {}
    });
  }

  getTimeslotsForDay(day: string): Timeslot[] {
    return this.timeslots.filter(t => t.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  formatDay(day: string): string {
    return day.charAt(0) + day.slice(1).toLowerCase();
  }

  isAvailable(timeslotId: number): boolean {
    return this.availabilityMap[timeslotId] !== false;
  }

  toggle(timeslotId: number, checked: boolean): void {
    this.availabilityMap[timeslotId] = checked;
  }

  save(): void {
    const data = Object.entries(this.availabilityMap).map(([timeslotId, available]) => ({
      timeslotId: +timeslotId,
      available
    }));
    this.http.put<TeacherAvailability[]>(`${environment.apiUrl}/teacher/availabilities`, data).subscribe({
      next: () => this.msg = 'Availability saved!',
      error: () => this.errMsg = 'Failed to save availability'
    });
  }
}
