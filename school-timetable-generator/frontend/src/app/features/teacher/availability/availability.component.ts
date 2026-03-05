import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Timeslot, TeacherAvailability } from '../../../core/models';
import { environment } from '@env/environment';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatCheckboxModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <h2>My Availability</h2>
    <p>Check the timeslots when you are available to teach.</p>

    @if (days.length > 0) {
      <div class="availability-grid">
        @for (day of days; track day) {
          <mat-card>
            <mat-card-header><mat-card-title>{{ day }}</mat-card-title></mat-card-header>
            <mat-card-content>
              @for (slot of getTimeslotsForDay(day); track slot.id) {
                <div class="slot-row">
                  <mat-checkbox
                    [checked]="isAvailable(slot.id)"
                    (change)="toggle(slot.id, $event.checked)">
                    {{ slot.startTime }} - {{ slot.endTime }}
                  </mat-checkbox>
                </div>
              }
            </mat-card-content>
          </mat-card>
        }
      </div>
      <div style="margin-top:16px">
        <button mat-raised-button color="primary" (click)="save()">
          <mat-icon>save</mat-icon> Save Availability
        </button>
      </div>
    } @else {
      <p>No timeslots configured yet. Please contact your administrator.</p>
    }
  `,
  styles: [`
    .availability-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .slot-row { padding: 4px 0; }
  `]
})
export class AvailabilityComponent implements OnInit {
  timeslots: Timeslot[] = [];
  availabilities: TeacherAvailability[] = [];
  availabilityMap: Record<number, boolean> = {};
  days: string[] = [];

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

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
      error: () => {
        // Timeslots might not be available via a dedicated endpoint — build from availabilities
      }
    });
  }

  getTimeslotsForDay(day: string): Timeslot[] {
    return this.timeslots.filter(t => t.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
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
      next: () => this.snackBar.open('Availability saved!', 'OK', { duration: 3000 }),
      error: () => this.snackBar.open('Failed to save availability', 'Close', { duration: 3000 })
    });
  }
}
