import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subject } from '../../../core/models';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule],
  template: `
    <div class="page-header">
      <h2>Subjects</h2>
    </div>

    <c-card class="mb-4">
      <c-card-header><strong>{{ editing ? 'Edit Subject' : 'Add New Subject' }}</strong></c-card-header>
      <c-card-body>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="row g-3">
          <c-col md="3">
            <label cLabel for="name">Name</label>
            <input cFormControl id="name" formControlName="name" placeholder="e.g. Mathematics" />
          </c-col>
          <c-col md="2">
            <label cLabel for="color">Color</label>
            <input cFormControl id="color" formControlName="color" type="color" style="height:38px;padding:4px" />
          </c-col>
          <c-col md="3">
            <label cLabel for="hoursPerWeek">Hours/Week</label>
            <input cFormControl id="hoursPerWeek" formControlName="hoursPerWeek" type="number" />
          </c-col>
          <c-col md="2">
            <label cLabel for="sessionDuration">Session (h)</label>
            <input cFormControl id="sessionDuration" formControlName="sessionDuration" type="number" />
          </c-col>
          <c-col md="2" class="d-flex align-items-end gap-2">
            <button cButton color="primary" type="submit" [disabled]="form.invalid">
              {{ editing ? 'Update' : 'Create' }}
            </button>
            @if (editing) {
              <button cButton color="secondary" variant="outline" type="button" (click)="cancel()">Cancel</button>
            }
          </c-col>
        </form>
      </c-card-body>
    </c-card>

    <c-card>
      <c-card-header class="d-flex align-items-center justify-content-between">
        <strong>All Subjects</strong>
        <c-badge color="primary">{{ items.length }} total</c-badge>
      </c-card-header>
      <c-card-body class="p-0">
        <table cTable striped hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Color</th>
              <th>Hours/Week</th>
              <th>Session</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (s of items; track s.id) {
              <tr>
                <td>{{ s.name }}</td>
                <td><span class="color-dot" [style.background]="s.color"></span></td>
                <td><c-badge color="light" textColor="dark">{{ s.hoursPerWeek }}h</c-badge></td>
                <td>{{ s.sessionDuration }}h</td>
                <td>
                  <button cButton color="info" variant="ghost" size="sm" (click)="edit(s)" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  </button>
                  <button cButton color="danger" variant="ghost" size="sm" (click)="delete(s.id)" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </c-card-body>
    </c-card>
  `,
  styles: [`
    .color-dot {
      display: inline-block; width: 24px; height: 24px;
      border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
  `]
})
export class SubjectsComponent implements OnInit {
  items: Subject[] = [];
  form: FormGroup;
  editing = false; editId: number | null = null;
  private schoolId = 1;

  constructor(private svc: AdminService, private fb: FormBuilder, private authService: AuthService) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.form = this.fb.group({ name: ['', Validators.required], color: ['#3f51b5'], hoursPerWeek: [2], sessionDuration: [1] });
  }
  ngOnInit() { this.load(); }
  load() { this.svc.getSubjects(this.schoolId).subscribe(d => this.items = d); }
  onSubmit() {
    if (this.form.invalid) return;
    const data = { ...this.form.value, schoolId: this.schoolId };
    if (this.editing && this.editId) { this.svc.updateSubject(this.editId, data).subscribe(() => { this.load(); this.cancel(); }); }
    else { this.svc.createSubject(data).subscribe(() => { this.load(); this.form.reset({ color: '#3f51b5', hoursPerWeek: 2, sessionDuration: 1 }); }); }
  }
  edit(s: Subject) { this.editing = true; this.editId = s.id; this.form.patchValue(s); }
  cancel() { this.editing = false; this.editId = null; this.form.reset({ color: '#3f51b5', hoursPerWeek: 2, sessionDuration: 1 }); }
  delete(id: number) { this.svc.deleteSubject(id).subscribe(() => this.load()); }
}
