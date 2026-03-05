import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule } from '@coreui/angular';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Teacher, Subject } from '../../../core/models';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule],
  template: `
    <div class="page-header">
      <h2>Teachers</h2>
    </div>

    <c-card class="mb-4">
      <c-card-header><strong>{{ editing ? 'Edit Teacher' : 'Add New Teacher' }}</strong></c-card-header>
      <c-card-body>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="row g-3">
          <c-col md="4">
            <label cLabel for="firstName">First Name</label>
            <input cFormControl id="firstName" formControlName="firstName" />
          </c-col>
          <c-col md="4">
            <label cLabel for="lastName">Last Name</label>
            <input cFormControl id="lastName" formControlName="lastName" />
          </c-col>
          <c-col md="4">
            <label cLabel for="email">Email</label>
            <input cFormControl id="email" formControlName="email" type="email" />
          </c-col>
          <c-col md="4">
            <label cLabel for="maxHours">Max Hours/Week</label>
            <input cFormControl id="maxHours" formControlName="maxHoursPerWeek" type="number" />
          </c-col>
          <c-col md="8">
            <label cLabel for="subjects">Subjects</label>
            <select cFormControl id="subjects" formControlName="subjectIds" multiple>
              @for (s of subjects; track s.id) {
                <option [ngValue]="s.id">{{ s.name }}</option>
              }
            </select>
          </c-col>
          <c-col xs="12">
            <button cButton color="primary" type="submit" [disabled]="form.invalid" class="me-2">
              {{ editing ? 'Update' : 'Create' }}
            </button>
            @if (editing) {
              <button cButton color="secondary" variant="outline" type="button" (click)="cancelEdit()">Cancel</button>
            }
          </c-col>
        </form>
      </c-card-body>
    </c-card>

    <c-card>
      <c-card-header class="d-flex align-items-center justify-content-between">
        <strong>All Teachers</strong>
        <c-badge color="primary">{{ teachers.length }} total</c-badge>
      </c-card-header>
      <c-card-body class="p-0">
        <table cTable striped hover>
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Max Hours</th>
              <th>Subjects</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (t of teachers; track t.id) {
              <tr>
                <td>{{ t.firstName }}</td>
                <td>{{ t.lastName }}</td>
                <td class="text-body-secondary">{{ t.email }}</td>
                <td><c-badge color="light" textColor="dark">{{ t.maxHoursPerWeek }}h</c-badge></td>
                <td class="text-body-secondary small">{{ getSubjectNames(t) }}</td>
                <td>
                  <button cButton color="info" variant="ghost" size="sm" (click)="edit(t)" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  </button>
                  <button cButton color="danger" variant="ghost" size="sm" (click)="delete(t.id)" title="Delete">
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
export class TeachersComponent implements OnInit {
  teachers: Teacher[] = [];
  subjects: Subject[] = [];
  form: FormGroup;
  editing = false;
  editId: number | null = null;
  private schoolId = 1;

  constructor(private adminService: AdminService, private fb: FormBuilder, private authService: AuthService) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      maxHoursPerWeek: [20],
      subjectIds: [[]],
      schoolId: [this.schoolId]
    });
  }

  ngOnInit(): void {
    this.load();
    this.adminService.getSubjects(this.schoolId).subscribe(s => this.subjects = s);
  }

  load(): void { this.adminService.getTeachers(this.schoolId).subscribe(t => this.teachers = t); }

  onSubmit(): void {
    if (this.form.invalid) return;
    if (this.editing && this.editId) {
      this.adminService.updateTeacher(this.editId, this.form.value).subscribe(() => { this.load(); this.cancelEdit(); });
    } else {
      this.adminService.createTeacher(this.form.value).subscribe(() => { this.load(); this.form.reset({ schoolId: this.schoolId, maxHoursPerWeek: 20, subjectIds: [] }); });
    }
  }

  edit(t: Teacher): void {
    this.editing = true;
    this.editId = t.id;
    this.form.patchValue({ ...t, subjectIds: t.subjectIds?.length ? t.subjectIds : (t.subjects?.map(s => s.id) || []) });
  }

  cancelEdit(): void {
    this.editing = false;
    this.editId = null;
    this.form.reset({ schoolId: this.schoolId, maxHoursPerWeek: 20, subjectIds: [] });
  }

  delete(id: number): void { this.adminService.deleteTeacher(id).subscribe(() => this.load()); }

  getSubjectNames(t: Teacher): string {
    if (!t.subjects?.length) return '-';
    return t.subjects.map(s => s.name).join(', ');
  }
}
