import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="modal-backdrop" (click)="onCancel()"></div>
      <div class="modal-wrapper">
        <div class="modal-box" [class]="'modal-' + type">
          <div class="modal-icon">
            @switch (type) {
              @case ('danger') { &#9888; }
              @case ('warning') { &#9888; }
              @default { &#10003; }
            }
          </div>
          <h3 class="modal-title">{{ title }}</h3>
          <p class="modal-message">{{ message }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="onCancel()">Cancel</button>
            <button class="btn-confirm" [class]="'btn-' + type" (click)="onConfirm()">{{ confirmText }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15,23,42,0.5);
      z-index: 1050; backdrop-filter: blur(4px);
      animation: fadeIn 150ms ease;
    }
    .modal-wrapper {
      position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
      z-index: 1051; padding: 24px;
    }
    .modal-box {
      background: white; border-radius: 16px; padding: 32px; max-width: 400px; width: 100%;
      text-align: center; box-shadow: 0 25px 50px -12px rgba(15,23,42,0.25);
      animation: scaleIn 200ms cubic-bezier(0.34,1.56,0.64,1);
    }
    .modal-icon {
      width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 16px;
      display: flex; align-items: center; justify-content: center;
      svg { width: 28px; height: 28px; }
    }
    .modal-danger .modal-icon { background: #FEF2F2; color: #EF4444; }
    .modal-warning .modal-icon { background: #FFFBEB; color: #F59E0B; }
    .modal-success .modal-icon { background: #F0FDF4; color: #22C55E; }
    .modal-info .modal-icon { background: #F0F9FF; color: #0EA5E9; }

    .modal-title { font-size: 1.125rem; font-weight: 700; color: #0F172A; margin: 0 0 8px; }
    .modal-message { font-size: 0.875rem; color: #475569; margin: 0 0 24px; line-height: 1.5; }

    .modal-actions { display: flex; gap: 12px; justify-content: center; }
    .modal-actions button {
      padding: 10px 24px; border-radius: 10px; font-weight: 600; font-size: 0.875rem;
      cursor: pointer; transition: all 200ms; border: none;
    }
    .btn-cancel {
      background: #E2E8F0; color: #334155;
      &:hover { background: #CBD5E1; }
    }
    .btn-confirm.btn-danger { background: linear-gradient(135deg, #EF4444, #F87171); color: white; }
    .btn-confirm.btn-danger:hover { box-shadow: 0 4px 16px rgba(239,68,68,0.3); transform: translateY(-1px); }
    .btn-confirm.btn-warning { background: linear-gradient(135deg, #F59E0B, #FBBF24); color: white; }
    .btn-confirm.btn-success { background: linear-gradient(135deg, #22C55E, #4ADE80); color: white; }
    .btn-confirm.btn-info { background: linear-gradient(135deg, #2563EB, #60A5FA); color: white; }
    .btn-confirm.btn-info:hover { box-shadow: 0 4px 16px rgba(37,99,235,0.3); transform: translateY(-1px); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class ConfirmModalComponent {
  @Input() visible = false;
  @Input() title = 'Are you sure?';
  @Input() message = 'This action cannot be undone.';
  @Input() confirmText = 'Confirm';
  @Input() type: 'danger' | 'warning' | 'success' | 'info' = 'danger';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() { this.confirmed.emit(); }
  onCancel() { this.cancelled.emit(); }
}
