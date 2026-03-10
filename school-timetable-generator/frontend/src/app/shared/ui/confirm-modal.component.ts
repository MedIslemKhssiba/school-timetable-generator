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
              @case ('danger') {
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              }
              @case ('warning') {
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
              }
              @default {
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              }
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
      position: fixed; inset: 0; background: rgba(16,42,67,0.5);
      z-index: 1050; backdrop-filter: blur(4px);
      animation: fadeIn 150ms ease;
    }
    .modal-wrapper {
      position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
      z-index: 1051; padding: 24px;
    }
    .modal-box {
      background: white; border-radius: 16px; padding: 32px; max-width: 400px; width: 100%;
      text-align: center; box-shadow: 0 25px 50px -12px rgba(16,42,67,0.25);
      animation: scaleIn 200ms cubic-bezier(0.34,1.56,0.64,1);
    }
    .modal-icon {
      width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 16px;
      display: flex; align-items: center; justify-content: center;
      svg { width: 28px; height: 28px; }
    }
    .modal-danger .modal-icon { background: #FFEBEE; color: #C62828; }
    .modal-warning .modal-icon { background: #FFF8E1; color: #F57F17; }
    .modal-success .modal-icon { background: #E8F5E9; color: #2E7D32; }
    .modal-info .modal-icon { background: #E1F5FE; color: #0277BD; }

    .modal-title { font-size: 1.125rem; font-weight: 700; color: #1A2236; margin: 0 0 8px; }
    .modal-message { font-size: 0.875rem; color: #636E80; margin: 0 0 24px; line-height: 1.5; }

    .modal-actions { display: flex; gap: 12px; justify-content: center; }
    .modal-actions button {
      padding: 10px 24px; border-radius: 10px; font-weight: 600; font-size: 0.875rem;
      cursor: pointer; transition: all 200ms; border: none;
    }
    .btn-cancel {
      background: #EDF0F5; color: #4A5468;
      &:hover { background: #DDE2EA; }
    }
    .btn-confirm.btn-danger { background: linear-gradient(135deg, #C62828, #E53935); color: white; }
    .btn-confirm.btn-danger:hover { box-shadow: 0 4px 16px rgba(198,40,40,0.3); transform: translateY(-1px); }
    .btn-confirm.btn-warning { background: linear-gradient(135deg, #F57F17, #FF8F00); color: white; }
    .btn-confirm.btn-success { background: linear-gradient(135deg, #2E7D32, #43A047); color: white; }
    .btn-confirm.btn-info { background: linear-gradient(135deg, #1565C0, #42A5F5); color: white; }
    .btn-confirm.btn-info:hover { box-shadow: 0 4px 16px rgba(21,101,192,0.3); transform: translateY(-1px); }

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
