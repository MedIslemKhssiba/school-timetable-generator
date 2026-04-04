import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-message">{{ message }}</p>
      @if (actionLabel) {
        <button class="empty-action" (click)="action.emit()">
          + {{ actionLabel }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 48px 24px; text-align: center;
    }
    .empty-icon { color: #8D99A8; margin-bottom: 16px; }
    .empty-title { font-family: 'Montserrat', sans-serif; font-size: 1.2rem; font-weight: 700; color: #1A2332; margin: 0 0 8px; }
    .empty-message { font-size: 0.875rem; color: #3E4C5E; margin: 0 0 24px; max-width: 360px; line-height: 1.6; font-family: 'Montserrat', sans-serif; }
    .empty-action {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 22px; border-radius: 10px; border: none;
      background: #2563EB;
      color: #F0F4FA; font-weight: 600; font-size: 0.875rem;
      cursor: pointer; transition: all 250ms;
      font-family: 'Montserrat', sans-serif;
      box-shadow: 0 2px 8px rgba(37, 99, 235,0.22);
      &:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37, 99, 235,0.3); background: #1D4ED8; }
    }
  `]
})
export class EmptyStateComponent {
  @Input() title = 'Aucune donnée pour le moment';
  @Input() message = 'Get started by creating your first item.';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
