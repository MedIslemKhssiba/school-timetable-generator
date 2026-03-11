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
          <button class="toast-close" (click)="notif.dismiss(toast.id); $event.stopPropagation()">&times;</button>
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
      padding: 14px 16px; border-radius: 12px;
      background: white; color: #0F172A;
      box-shadow: 0 10px 30px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06);
      cursor: pointer; animation: slideIn 250ms cubic-bezier(0.34,1.56,0.64,1);
      border-left: 4px solid transparent;
    }
    .toast-success { border-left-color: #22C55E; }
    .toast-error   { border-left-color: #EF4444; }
    .toast-warning { border-left-color: #F59E0B; }
    .toast-info    { border-left-color: #0EA5E9; }

    .toast-icon { flex-shrink: 0; width: 22px; height: 22px; }
    .toast-success .toast-icon { color: #22C55E; }
    .toast-error   .toast-icon { color: #EF4444; }
    .toast-warning .toast-icon { color: #F59E0B; }
    .toast-info    .toast-icon { color: #0EA5E9; }

    .toast-message { flex: 1; font-size: 0.875rem; font-weight: 500; line-height: 1.4; }
    .toast-close {
      background: none; border: none; cursor: pointer; padding: 2px;
      color: #94A3B8; border-radius: 4px;
      &:hover { color: #0F172A; background: #F1F5F9; }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(40px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ToastContainerComponent {
  constructor(public notif: NotificationService) {}
}
