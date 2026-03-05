import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule, AlertComponent } from '@coreui/angular';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { School } from '../../../core/models';

@Component({
  selector: 'app-schools',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule, AlertComponent],
  template: `
    <div class="page-header">
      <h2>Schools</h2>
    </div>

    <c-card class="mb-4">
      <c-card-header>
        <strong>{{ editing ? 'Edit School' : 'Add New School' }}</strong>
      </c-card-header>
      <c-card-body>
        <form [formGroup]="schoolForm" (ngSubmit)="onSubmit()" class="row g-3">
          <c-col md="4">
            <label cLabel for="name">Name</label>
            <input cFormControl id="name" formControlName="name" placeholder="School name" />
          </c-col>
          <c-col md="4">
            <label cLabel for="address">Address</label>
            <input cFormControl id="address" formControlName="address" placeholder="Address" />
          </c-col>
          <c-col md="4">
            <label cLabel for="phone">Phone</label>
            <input cFormControl id="phone" formControlName="phone" placeholder="Phone" />
          </c-col>
          <c-col xs="12">
            <button cButton color="primary" type="submit" [disabled]="schoolForm.invalid" class="me-2">
              {{ editing ? 'Update' : 'Create' }}
            </button>
            @if (editing) {
              <button cButton color="secondary" variant="outline" type="button" (click)="cancelEdit()">Cancel</button>
            }
          </c-col>
        </form>
      </c-card-body>
    </c-card>

    @if (successMsg) {
      <c-alert color="success" [dismissible]="true" (visibleChange)="successMsg = ''">{{ successMsg }}</c-alert>
    }

    <c-card>
      <c-card-header class="d-flex align-items-center justify-content-between">
        <strong>All Schools</strong>
        <c-badge color="primary">{{ schools.length }} total</c-badge>
      </c-card-header>
      <c-card-body class="p-0">
        <table cTable striped hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (s of schools; track s.id) {
              <tr>
                <td><strong>{{ s.name }}</strong></td>
                <td>{{ s.address || '-' }}</td>
                <td>{{ s.phone || '-' }}</td>
                <td>
                  <c-badge [color]="s.active ? 'success' : 'danger'">
                    {{ s.active ? 'Active' : 'Inactive' }}
                  </c-badge>
                </td>
                <td>
                  <button cButton color="info" variant="ghost" size="sm" (click)="edit(s)" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  </button>
                  <button cButton [color]="s.active ? 'warning' : 'success'" variant="ghost" size="sm" (click)="toggleActive(s)" [title]="s.active ? 'Deactivate' : 'Activate'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      @if (s.active) {
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9A7.902 7.902 0 0 1 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1A7.902 7.902 0 0 1 20 12c0 4.42-3.58 8-8 8z"/>
                      } @else {
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      }
                    </svg>
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
  `
})
export class SchoolsComponent implements OnInit {
  schools: School[] = [];
  schoolForm: FormGroup;
  editing = false;
  editId: number | null = null;
  successMsg = '';

  constructor(private superAdminService: SuperAdminService, private fb: FormBuilder) {
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
      this.successMsg = `School ${updated.active ? 'activated' : 'deactivated'}`;
    });
  }
}
