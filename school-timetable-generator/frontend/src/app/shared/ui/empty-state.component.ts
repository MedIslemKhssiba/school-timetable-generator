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
    .empty-icon { color: #94A3B8; margin-bottom: 16px; }
    .empty-title { font-size: 1.125rem; font-weight: 700; color: #0F172A; margin: 0 0 8px; }
    .empty-message { font-size: 0.875rem; color: #475569; margin: 0 0 24px; max-width: 360px; line-height: 1.5; }
    .empty-action {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 20px; border-radius: 10px; border: none;
      background: linear-gradient(135deg, #2563EB, #3B82F6);
      color: white; font-weight: 600; font-size: 0.875rem;
      cursor: pointer; transition: all 200ms;
      box-shadow: 0 2px 8px rgba(37,99,235,0.25);
      &:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(37,99,235,0.35); }
    }
  `]
})
export class EmptyStateComponent {
  @Input() title = 'No data yet';
  @Input() message = 'Get started by creating your first item.';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
