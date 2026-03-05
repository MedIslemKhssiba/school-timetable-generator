import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule } from '@coreui/angular';
import { SuperAdminService } from '../../../core/services/super-admin.service';
import { User, School } from '../../../core/models';

@Component({
  selector: 'app-admins',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, TableModule, ButtonDirective, FormModule, GridModule, BadgeModule],
  template: `
    <div class="page-header">
      <h2>Admins</h2>
    </div>

    <c-card class="mb-4">
      <c-card-header><strong>Add New Admin</strong></c-card-header>
      <c-card-body>
        <form [formGroup]="adminForm" (ngSubmit)="onSubmit()" class="row g-3">
          <c-col md="6">
            <label cLabel for="email">Email</label>
            <input cFormControl id="email" formControlName="email" type="email" placeholder="admin@example.com" />
          </c-col>
          <c-col md="6">
            <label cLabel for="password">Password</label>
            <input cFormControl id="password" formControlName="password" type="password" />
          </c-col>
          <c-col md="4">
            <label cLabel for="firstName">First Name</label>
            <input cFormControl id="firstName" formControlName="firstName" />
          </c-col>
          <c-col md="4">
            <label cLabel for="lastName">Last Name</label>
            <input cFormControl id="lastName" formControlName="lastName" />
          </c-col>
          <c-col md="4">
            <label cLabel for="schoolId">School</label>
            <select cFormControl id="schoolId" formControlName="schoolId">
              <option [ngValue]="null" disabled>Select school...</option>
              @for (school of schools; track school.id) {
                <option [ngValue]="school.id">{{ school.name }}</option>
              }
            </select>
          </c-col>
          <c-col xs="12">
            <button cButton color="primary" type="submit" [disabled]="adminForm.invalid">Create Admin</button>
          </c-col>
        </form>
      </c-card-body>
    </c-card>

    <c-card>
      <c-card-header class="d-flex align-items-center justify-content-between">
        <strong>All Admins</strong>
        <c-badge color="primary">{{ admins.length }} total</c-badge>
      </c-card-header>
      <c-card-body class="p-0">
        <table cTable striped hover>
          <thead>
            <tr>
              <th>Email</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (a of admins; track a.id) {
              <tr>
                <td class="text-body-secondary">{{ a.email }}</td>
                <td>{{ a.firstName }}</td>
                <td>{{ a.lastName }}</td>
                <td>
                  <button cButton color="danger" variant="ghost" size="sm" (click)="delete(a.id)" title="Delete">
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
export class AdminsComponent implements OnInit {
  admins: User[] = [];
  schools: School[] = [];
  adminForm: FormGroup;

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
