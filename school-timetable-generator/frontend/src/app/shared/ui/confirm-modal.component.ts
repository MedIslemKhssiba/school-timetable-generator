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
      position: fixed; inset: 0; background: rgba(13, 20, 40,0.4);
      z-index: 1050; backdrop-filter: blur(5px);
      animation: fadeIn 150ms ease;
    }
    .modal-wrapper {
      position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
      z-index: 1051; padding: 24px;
    }
    .modal-box {
      background: #F8FAFF; border-radius: 18px; padding: 36px; max-width: 400px; width: 100%;
      text-align: center; box-shadow: 0 25px 50px -12px rgba(13, 20, 40,0.25);
      animation: scaleIn 200ms cubic-bezier(0.34,1.56,0.64,1);
    }
    .modal-icon {
      width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 16px;
      display: flex; align-items: center; justify-content: center; font-size: 1.4rem;
    }
    .modal-danger .modal-icon { background: #FCF0EE; color: #C44536; }
    .modal-warning .modal-icon { background: #FDF8EC; color: #D4A03C; }
    .modal-success .modal-icon { background: #EEF5F1; color: #6B9080; }
    .modal-info .modal-icon { background: #EDF4F6; color: #4A7C8A; }

    .modal-title { font-family: 'Montserrat', sans-serif; font-size: 1.2rem; font-weight: 700; color: #1A2332; margin: 0 0 8px; }
    .modal-message { font-size: 0.875rem; color: #3E4C5E; margin: 0 0 24px; line-height: 1.6; font-family: 'Montserrat', sans-serif; }

    .modal-actions { display: flex; gap: 12px; justify-content: center; }
    .modal-actions button {
      min-height: 44px;
      padding: 12px 28px; border-radius: 12px; font-weight: 700; font-size: 0.92rem;
      cursor: pointer; transition: all 250ms; border: none; font-family: 'Montserrat', sans-serif;
    }
    .btn-cancel {
      background: #DDE3EE; color: #2A3546;
      &:hover { background: #C4CDD9; }
    }
    .btn-confirm.btn-danger { background: #C44536; color: #F8FAFF; }
    .btn-confirm.btn-danger:hover { box-shadow: 0 4px 16px rgba(196,69,54,0.3); transform: translateY(-1px); }
    .btn-confirm.btn-warning { background: #D4A03C; color: #F8FAFF; }
    .btn-confirm.btn-success { background: #6B9080; color: #F8FAFF; }
    .btn-confirm.btn-info { background: #2563EB; color: #F8FAFF; }
    .btn-confirm.btn-info:hover { box-shadow: 0 4px 16px rgba(37, 99, 235,0.3); transform: translateY(-1px); }

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
