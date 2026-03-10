import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>
      </div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-message">{{ message }}</p>
      @if (actionLabel) {
        <button class="empty-action" (click)="action.emit()">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 48px 24px; text-align: center;
    }
    .empty-icon { color: #B0B8C9; margin-bottom: 16px; }
    .empty-title { font-size: 1.125rem; font-weight: 700; color: #1A2236; margin: 0 0 8px; }
    .empty-message { font-size: 0.875rem; color: #636E80; margin: 0 0 24px; max-width: 360px; line-height: 1.5; }
    .empty-action {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 20px; border-radius: 10px; border: none;
      background: linear-gradient(135deg, #1565C0, #1E88E5);
      color: white; font-weight: 600; font-size: 0.875rem;
      cursor: pointer; transition: all 200ms;
      box-shadow: 0 2px 8px rgba(21,101,192,0.25);
      &:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(21,101,192,0.35); }
    }
  `]
})
export class EmptyStateComponent {
  @Input() title = 'No data yet';
  @Input() message = 'Get started by creating your first item.';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
