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
import { Room } from '../../../core/models';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule
  ],
  template: `
    <h2>Rooms</h2>
    <mat-card class="form-card">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Capacity</mat-label><input matInput formControlName="capacity" type="number" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Type</mat-label><input matInput formControlName="type" /></mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">{{ editing ? 'Update' : 'Create' }}</button>
          @if (editing) { <button mat-button type="button" (click)="cancel()">Cancel</button> }
        </form>
      </mat-card-content>
    </mat-card>
    <table mat-table [dataSource]="items" class="full-width" style="margin-top:16px">
      <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let r">{{r.name}}</td></ng-container>
      <ng-container matColumnDef="capacity"><th mat-header-cell *matHeaderCellDef>Capacity</th><td mat-cell *matCellDef="let r">{{r.capacity}}</td></ng-container>
      <ng-container matColumnDef="type"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let r">{{r.type}}</td></ng-container>
      <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Actions</th><td mat-cell *matCellDef="let r">
        <button mat-icon-button color="primary" (click)="edit(r)"><mat-icon>edit</mat-icon></button>
        <button mat-icon-button color="warn" (click)="delete(r.id)"><mat-icon>delete</mat-icon></button>
      </td></ng-container>
      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;"></tr>
    </table>
  `,
  styles: [`.form-card{margin-bottom:16px} form{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap}`]
})
export class RoomsComponent implements OnInit {
  items: Room[] = [];
  form: FormGroup;
  editing = false; editId: number | null = null;
  cols = ['name', 'capacity', 'type', 'actions'];
  private schoolId = 1;

  constructor(private svc: AdminService, private fb: FormBuilder, private authService: AuthService) {
    this.schoolId = this.authService.getSchoolId() || 1;
    this.form = this.fb.group({ name: ['', Validators.required], capacity: [30], type: [''] });
  }
  ngOnInit() { this.load(); }
  load() { this.svc.getRooms(this.schoolId).subscribe(d => this.items = d); }
  onSubmit() {
    if (this.form.invalid) return;
    const data = { ...this.form.value, school: { id: this.schoolId } };
    if (this.editing && this.editId) { this.svc.updateRoom(this.editId, data).subscribe(() => { this.load(); this.cancel(); }); }
    else { this.svc.createRoom(data).subscribe(() => { this.load(); this.form.reset({ capacity: 30 }); }); }
  }
  edit(r: Room) { this.editing = true; this.editId = r.id; this.form.patchValue(r); }
  cancel() { this.editing = false; this.editId = null; this.form.reset({ capacity: 30 }); }
  delete(id: number) { this.svc.deleteRoom(id).subscribe(() => this.load()); }
}
