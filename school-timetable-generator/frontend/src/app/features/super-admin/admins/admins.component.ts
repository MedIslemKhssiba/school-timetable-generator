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
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { User, School } from '../../../core/models';

@Component({
  selector: 'app-admins',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatSelectModule
  ],
  template: `
    <h2>Admins</h2>

    <mat-card class="form-card">
      <mat-card-header>
        <mat-card-title>Add Admin</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="adminForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput formControlName="password" type="password" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>School</mat-label>
            <mat-select formControlName="schoolId">
              @for (school of schools; track school.id) {
                <mat-option [value]="school.id">{{ school.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="adminForm.invalid">
            Create Admin
          </button>
        </form>
      </mat-card-content>
    </mat-card>

    <table mat-table [dataSource]="admins" class="full-width" style="margin-top:16px">
      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let a">{{ a.email }}</td>
      </ng-container>
      <ng-container matColumnDef="firstName">
        <th mat-header-cell *matHeaderCellDef>First Name</th>
        <td mat-cell *matCellDef="let a">{{ a.firstName }}</td>
      </ng-container>
      <ng-container matColumnDef="lastName">
        <th mat-header-cell *matHeaderCellDef>Last Name</th>
        <td mat-cell *matCellDef="let a">{{ a.lastName }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let a">
          <button mat-icon-button color="warn" (click)="delete(a.id)"><mat-icon>delete</mat-icon></button>
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
export class AdminsComponent implements OnInit {
  admins: User[] = [];
  schools: School[] = [];
  adminForm: FormGroup;
  displayedColumns = ['email', 'firstName', 'lastName', 'actions'];

  constructor(private superAdminService: SuperAdminService, private fb: FormBuilder) {
    this.adminForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      schoolId: [null],
      role: ['ROLE_ADMIN']
    });
  }

  ngOnInit(): void {
    this.loadAdmins();
    this.superAdminService.getSchools().subscribe(s => this.schools = s);
  }

  loadAdmins(): void {
    this.superAdminService.getAdmins().subscribe(a => this.admins = a);
  }

  onSubmit(): void {
    if (this.adminForm.invalid) return;
    this.superAdminService.createAdmin(this.adminForm.value).subscribe(() => {
      this.loadAdmins();
      this.adminForm.reset({ role: 'ROLE_ADMIN' });
    });
  }

  delete(id: number): void {
    this.superAdminService.deleteAdmin(id).subscribe(() => this.loadAdmins());
  }
}
