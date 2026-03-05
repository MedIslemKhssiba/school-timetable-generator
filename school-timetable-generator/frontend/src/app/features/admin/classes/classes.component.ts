import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClassGroup } from '../../../core/models';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule
  ],
  template: `
    <h2>Classes</h2>
    <mat-card class="form-card">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Level</mat-label><input matInput formControlName="level" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Students</mat-label><input matInput formControlName="studentCount" type="number" /></mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">{{ editing ? 'Update' : 'Create' }}</button>
          @if (editing) { <button mat-button type="button" (click)="cancel()">Cancel</button> }
        </form>
      </mat-card-content>
    </mat-card>
    <table mat-table [dataSource]="items" class="full-width" style="margin-top:16px">
      <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let c">{{c.name}}</td></ng-container>
      <ng-container matColumnDef="level"><th mat-header-cell *matHeaderCellDef>Level</th><td mat-cell *matCellDef="let c">{{c.level}}</td></ng-container>
      <ng-container matColumnDef="studentCount"><th mat-header-cell *matHeaderCellDef>Students</th><td mat-cell *matCellDef="let c">{{c.studentCount}}</td></ng-container>
      <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let c">
        <button mat-icon-button color="primary" (click)="edit(c)"><mat-icon>edit</mat-icon></button>
        <button mat-icon-button color="warn" (click)="delete(c.id)"><mat-icon>delete</mat-icon></button>
      </td></ng-container>
      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>
  `,
  styles: [`.form-card{margin-bottom:16px} form{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap}`]
})
export class ClassesComponent implements OnInit {
  items: ClassGroup[] = [];
  form: FormGroup;
  editing = false; editId: number | null = null;
  cols = ['name', 'level', 'studentCount', 'actions'];
  private schoolId = 1;

  constructor(private svc: AdminService, private fb: FormBuilder, private authService: AuthService) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.form = this.fb.group({ name: ['', Validators.required], level: [''], studentCount: [30] });
  }
  ngOnInit() { this.load(); }
  load() { this.svc.getClasses(this.schoolId).subscribe(d => this.items = d); }
  onSubmit() {
    if (this.form.invalid) return;
    const data = { ...this.form.value, school: { id: this.schoolId } };
    if (this.editing && this.editId) { this.svc.updateClass(this.editId, data).subscribe(() => { this.load(); this.cancel(); }); }
    else { this.svc.createClass(data).subscribe(() => { this.load(); this.form.reset({ studentCount: 30 }); }); }
  }
  edit(c: ClassGroup) { this.editing = true; this.editId = c.id; this.form.patchValue(c); }
  cancel() { this.editing = false; this.editId = null; this.form.reset({ studentCount: 30 }); }
  delete(id: number) { this.svc.deleteClass(id).subscribe(() => this.load()); }
}
