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
import { Subject } from '../../../core/models';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule
  ],
  template: `
    <h2>Subjects</h2>
    <mat-card class="form-card">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Color</mat-label><input matInput formControlName="color" type="color" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Hours/Week</mat-label><input matInput formControlName="hoursPerWeek" type="number" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Session Duration (h)</mat-label><input matInput formControlName="sessionDuration" type="number" /></mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">{{ editing ? 'Update' : 'Create' }}</button>
          @if (editing) { <button mat-button type="button" (click)="cancel()">Cancel</button> }
        </form>
      </mat-card-content>
    </mat-card>
    <table mat-table [dataSource]="items" class="full-width" style="margin-top:16px">
      <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let s">{{s.name}}</td></ng-container>
      <ng-container matColumnDef="color"><th mat-header-cell *matHeaderCellDef>Color</th><td mat-cell *matCellDef="let s"><span [style.background]="s.color" style="display:inline-block;width:24px;height:24px;border-radius:4px"></span></td></ng-container>
      <ng-container matColumnDef="hoursPerWeek"><th mat-header-cell *matHeaderCellDef>Hours/Week</th><td mat-cell *matCellDef="let s">{{s.hoursPerWeek}}</td></ng-container>
      <ng-container matColumnDef="sessionDuration"><th mat-header-cell *matHeaderCellDef>Session (h)</th><td mat-cell *matCellDef="let s">{{s.sessionDuration}}</td></ng-container>
      <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let s">
        <button mat-icon-button color="primary" (click)="edit(s)"><mat-icon>edit</mat-icon></button>
        <button mat-icon-button color="warn" (click)="delete(s.id)"><mat-icon>delete</mat-icon></button>
      </td></ng-container>
      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>
  `,
  styles: [`.form-card{margin-bottom:16px} form{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap}`]
})
export class SubjectsComponent implements OnInit {
  items: Subject[] = [];
  form: FormGroup;
  editing = false; editId: number | null = null;
  cols = ['name', 'color', 'hoursPerWeek', 'sessionDuration', 'actions'];
  private schoolId = 1;

  constructor(private svc: AdminService, private fb: FormBuilder, private authService: AuthService) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.form = this.fb.group({ name: ['', Validators.required], color: ['#3f51b5'], hoursPerWeek: [2], sessionDuration: [1] });
  }
  ngOnInit() { this.load(); }
  load() { this.svc.getSubjects(this.schoolId).subscribe(d => this.items = d); }
  onSubmit() {
    if (this.form.invalid) return;
    const data = { ...this.form.value, school: { id: this.schoolId } };
    if (this.editing && this.editId) { this.svc.updateSubject(this.editId, data).subscribe(() => { this.load(); this.cancel(); }); }
    else { this.svc.createSubject(data).subscribe(() => { this.load(); this.form.reset({ color: '#3f51b5', hoursPerWeek: 2, sessionDuration: 1 }); }); }
  }
  edit(s: Subject) { this.editing = true; this.editId = s.id; this.form.patchValue(s); }
  cancel() { this.editing = false; this.editId = null; this.form.reset({ color: '#3f51b5', hoursPerWeek: 2, sessionDuration: 1 }); }
  delete(id: number) { this.svc.deleteSubject(id).subscribe(() => this.load()); }
}
