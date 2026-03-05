import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClassGroup } from '../../../core/models';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule],
  template: `
    <div class="page-header">
      <h2>Classes</h2>
    </div>

    <c-card class="mb-4">
      <c-card-header><strong>{{ editing ? 'Edit Class' : 'Add New Class' }}</strong></c-card-header>
      <c-card-body>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="row g-3">
          <c-col md="4">
            <label cLabel for="name">Name</label>
            <input cFormControl id="name" formControlName="name" placeholder="e.g. 3A" />
          </c-col>
          <c-col md="4">
            <label cLabel for="level">Level</label>
            <input cFormControl id="level" formControlName="level" placeholder="e.g. 3rd Year" />
          </c-col>
          <c-col md="4">
            <label cLabel for="studentCount">Students</label>
            <input cFormControl id="studentCount" formControlName="studentCount" type="number" />
          </c-col>
          <c-col xs="12">
            <button cButton color="primary" type="submit" [disabled]="form.invalid" class="me-2">
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
        <strong>All Classes</strong>
        <c-badge color="primary">{{ items.length }} total</c-badge>
      </c-card-header>
      <c-card-body class="p-0">
        <table cTable striped hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Level</th>
              <th>Students</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (c of items; track c.id) {
              <tr>
                <td>{{ c.name }}</td>
                <td>{{ c.level }}</td>
                <td><c-badge color="light" textColor="dark">{{ c.studentCount }}</c-badge></td>
                <td>
                  <button cButton color="info" variant="ghost" size="sm" (click)="edit(c)" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  </button>
                  <button cButton color="danger" variant="ghost" size="sm" (click)="delete(c.id)" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </c-card-body>
    </c-card>
  `
})
export class ClassesComponent implements OnInit {
  items: ClassGroup[] = [];
  form: FormGroup;
  editing = false; editId: number | null = null;
  private schoolId = 1;

  constructor(private svc: AdminService, private fb: FormBuilder, private authService: AuthService) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.form = this.fb.group({ name: ['', Validators.required], level: [''], studentCount: [30] });
  }
  ngOnInit() { this.load(); }
  load() { this.svc.getClasses(this.schoolId).subscribe(d => this.items = d); }
  onSubmit() {
    if (this.form.invalid) return;
    const data = { ...this.form.value, schoolId: this.schoolId };
    if (this.editing && this.editId) { this.svc.updateClass(this.editId, data).subscribe(() => { this.load(); this.cancel(); }); }
    else { this.svc.createClass(data).subscribe(() => { this.load(); this.form.reset({ studentCount: 30 }); }); }
  }
  edit(c: ClassGroup) { this.editing = true; this.editId = c.id; this.form.patchValue(c); }
  cancel() { this.editing = false; this.editId = null; this.form.reset({ studentCount: 30 }); }
  delete(id: number) { this.svc.deleteClass(id).subscribe(() => this.load()); }
}
