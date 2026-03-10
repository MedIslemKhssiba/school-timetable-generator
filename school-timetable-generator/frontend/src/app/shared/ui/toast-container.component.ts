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
              @case ('success') { <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> }
              @case ('error') { <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> }
              @case ('warning') { <svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg> }
              @default { <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg> }
            }
          </div>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="notif.dismiss(toast.id); $event.stopPropagation()">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
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
      background: white; color: #1A2236;
      box-shadow: 0 10px 30px rgba(16,42,67,0.12), 0 2px 8px rgba(16,42,67,0.06);
      cursor: pointer; animation: slideIn 250ms cubic-bezier(0.34,1.56,0.64,1);
      border-left: 4px solid transparent;
    }
    .toast-success { border-left-color: #2E7D32; }
    .toast-error   { border-left-color: #C62828; }
    .toast-warning { border-left-color: #F57F17; }
    .toast-info    { border-left-color: #0277BD; }

    .toast-icon { flex-shrink: 0; width: 22px; height: 22px; }
    .toast-success .toast-icon { color: #2E7D32; }
    .toast-error   .toast-icon { color: #C62828; }
    .toast-warning .toast-icon { color: #F57F17; }
    .toast-info    .toast-icon { color: #0277BD; }

    .toast-message { flex: 1; font-size: 0.875rem; font-weight: 500; line-height: 1.4; }
    .toast-close {
      background: none; border: none; cursor: pointer; padding: 2px;
      color: #8892A4; border-radius: 4px;
      &:hover { color: #1A2236; background: #F0F4F8; }
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
