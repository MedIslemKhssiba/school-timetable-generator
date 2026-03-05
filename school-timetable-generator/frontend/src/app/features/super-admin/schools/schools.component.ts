import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { School } from '../../../core/models';

@Component({
  selector: 'app-schools',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatSnackBarModule, MatTooltipModule
  ],
  template: `
    <h2>Schools</h2>

    <mat-card class="form-card">
      <mat-card-header>
        <mat-card-title>{{ editing ? 'Edit School' : 'Add School' }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="schoolForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Address</mat-label>
            <input matInput formControlName="address" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Phone</mat-label>
            <input matInput formControlName="phone" />
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="schoolForm.invalid">
            {{ editing ? 'Update' : 'Create' }}
          </button>
          @if (editing) {
            <button mat-button type="button" (click)="cancelEdit()">Cancel</button>
          }
        </form>
      </mat-card-content>
    </mat-card>

    <table mat-table [dataSource]="schools" class="full-width" style="margin-top:16px">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let s">{{ s.name }}</td>
      </ng-container>
      <ng-container matColumnDef="address">
        <th mat-header-cell *matHeaderCellDef>Address</th>
        <td mat-cell *matCellDef="let s">{{ s.address }}</td>
      </ng-container>
      <ng-container matColumnDef="phone">
        <th mat-header-cell *matHeaderCellDef>Phone</th>
        <td mat-cell *matCellDef="let s">{{ s.phone }}</td>
      </ng-container>
      <ng-container matColumnDef="active">
        <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let s">
          <span [style.color]="s.active ? '#4caf50' : '#f44336'">{{ s.active ? 'Active' : 'Inactive' }}</span>
        </td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let s">
          <button mat-icon-button color="primary" (click)="edit(s)"><mat-icon>edit</mat-icon></button>
          <button mat-icon-button [color]="s.active ? 'warn' : 'primary'" (click)="toggleActive(s)"
            [matTooltip]="s.active ? 'Deactivate' : 'Activate'">
            <mat-icon>{{ s.active ? 'block' : 'check_circle' }}</mat-icon>
          </button>
          <button mat-icon-button color="warn" (click)="delete(s.id)"><mat-icon>delete</mat-icon></button>
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
export class SchoolsComponent implements OnInit {
  schools: School[] = [];
  schoolForm: FormGroup;
  editing = false;
  editId: number | null = null;
  displayedColumns = ['name', 'address', 'phone', 'active', 'actions'];

  constructor(private superAdminService: SuperAdminService, private fb: FormBuilder, private snackBar: MatSnackBar) {
    this.schoolForm = this.fb.group({
      name: ['', Validators.required],
      address: [''],
      phone: ['']
    });
  }

  ngOnInit(): void {
    this.loadSchools();
  }

  loadSchools(): void {
    this.superAdminService.getSchools().subscribe(s => this.schools = s);
  }

  onSubmit(): void {
    if (this.schoolForm.invalid) return;
    const data = this.schoolForm.value;

    if (this.editing && this.editId) {
      this.superAdminService.updateSchool(this.editId, data).subscribe(() => {
        this.loadSchools();
        this.cancelEdit();
      });
    } else {
      this.superAdminService.createSchool(data).subscribe(() => {
        this.loadSchools();
        this.schoolForm.reset();
      });
    }
  }

  edit(school: School): void {
    this.editing = true;
    this.editId = school.id;
    this.schoolForm.patchValue(school);
  }

  cancelEdit(): void {
    this.editing = false;
    this.editId = null;
    this.schoolForm.reset();
  }

  delete(id: number): void {
    this.superAdminService.deleteSchool(id).subscribe(() => this.loadSchools());
  }

  toggleActive(school: School): void {
    this.superAdminService.toggleSchoolActive(school.id).subscribe(updated => {
      const idx = this.schools.findIndex(s => s.id === school.id);
      if (idx >= 0) this.schools[idx] = updated;
      this.schools = [...this.schools];
      this.snackBar.open(`School ${updated.active ? 'activated' : 'deactivated'}`, 'OK', { duration: 3000 });
    });
  }
}
