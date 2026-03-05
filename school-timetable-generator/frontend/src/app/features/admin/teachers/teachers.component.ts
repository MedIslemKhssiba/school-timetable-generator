import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Teacher, Subject } from '../../../core/models';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatSelectModule
  ],
  template: `
    <h2>Teachers</h2>

    <mat-card class="form-card">
      <mat-card-header>
        <mat-card-title>{{ editing ? 'Edit Teacher' : 'Add Teacher' }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Max Hours/Week</mat-label>
            <input matInput formControlName="maxHoursPerWeek" type="number" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Subjects</mat-label>
            <mat-select formControlName="subjectIds" multiple>
              @for (s of subjects; track s.id) {
                <mat-option [value]="s.id">{{ s.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
            {{ editing ? 'Update' : 'Create' }}
          </button>
          @if (editing) {
            <button mat-button type="button" (click)="cancelEdit()">Cancel</button>
          }
        </form>
      </mat-card-content>
    </mat-card>

    <table mat-table [dataSource]="teachers" class="full-width" style="margin-top:16px">
      <ng-container matColumnDef="firstName">
        <th mat-header-cell *matHeaderCellDef>First Name</th>
        <td mat-cell *matCellDef="let t">{{ t.firstName }}</td>
      </ng-container>
      <ng-container matColumnDef="lastName">
        <th mat-header-cell *matHeaderCellDef>Last Name</th>
        <td mat-cell *matCellDef="let t">{{ t.lastName }}</td>
      </ng-container>
      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let t">{{ t.email }}</td>
      </ng-container>
      <ng-container matColumnDef="maxHoursPerWeek">
        <th mat-header-cell *matHeaderCellDef>Max Hours</th>
        <td mat-cell *matCellDef="let t">{{ t.maxHoursPerWeek }}</td>
      </ng-container>
      <ng-container matColumnDef="subjects">
        <th mat-header-cell *matHeaderCellDef>Subjects</th>
        <td mat-cell *matCellDef="let t">{{ getSubjectNames(t) }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let t">
          <button mat-icon-button color="primary" (click)="edit(t)"><mat-icon>edit</mat-icon></button>
          <button mat-icon-button color="warn" (click)="delete(t.id)"><mat-icon>delete</mat-icon></button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>
  `,
  styles: [`
    .form-card { margin-bottom: 16px; }
    form { display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap; }
  `]
})
export class TeachersComponent implements OnInit {
  teachers: Teacher[] = [];
  subjects: Subject[] = [];
  form: FormGroup;
  editing = false;
  editId: number | null = null;
  displayedColumns = ['firstName', 'lastName', 'email', 'maxHoursPerWeek', 'subjects', 'actions'];
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
    this.form.patchValue({ ...t, subjectIds: t.subjectIds || [] });
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
