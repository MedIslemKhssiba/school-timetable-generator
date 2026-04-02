import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Toast } from '../../core/services/notification.service';

@Component({
  selector: 'ui-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of (notif.toasts$ | async); track toast.id) {
        <div class="toast-item" [class]="'toast-' + toast.type" (click)="notif.dismiss(toast.id)">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { &#10003; }
              @case ('error') { &#10007; }
              @case ('warning') { &#9888; }
              @default { &#8505; }
            }
          </div>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; top: 20px; right: 20px; z-index: 1060;
      display: flex; flex-direction: column; gap: 10px;
      max-width: 380px; width: 100%;
    }
    .toast-item {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; border-radius: 14px;
      background: #F8FAFF; color: #1A2332;
      box-shadow: 0 10px 30px rgba(13, 27, 62,0.1), 0 2px 8px rgba(13, 27, 62,0.05);
      cursor: pointer; animation: slideIn 250ms cubic-bezier(0.34,1.56,0.64,1);
      border-left: 4px solid transparent;
      font-family: 'Montserrat', sans-serif;
    }
    .toast-success { border-left-color: #6B9080; }
    .toast-error   { border-left-color: #C44536; }
    .toast-warning { border-left-color: #D4A03C; }
    .toast-info    { border-left-color: #4A7C8A; }

    .toast-icon { flex-shrink: 0; width: 22px; height: 22px; }
    .toast-success .toast-icon { color: #6B9080; }
    .toast-error   .toast-icon { color: #C44536; }
    .toast-warning .toast-icon { color: #D4A03C; }
    .toast-info    .toast-icon { color: #4A7C8A; }

    .toast-message { flex: 1; font-size: 0.875rem; font-weight: 500; line-height: 1.4; }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(40px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ToastContainerComponent {
  constructor(public notif: NotificationService) {}
}
