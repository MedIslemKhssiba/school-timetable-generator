import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container">
      @switch (type) {
        @case ('table') {
          <div class="skel-row skel-header">
            @for (i of cols; track i) { <div class="skel-cell"></div> }
          </div>
          @for (r of rows; track r) {
            <div class="skel-row">
              @for (i of cols; track i) { <div class="skel-cell"></div> }
            </div>
          }
        }
        @case ('cards') {
          <div class="skel-cards">
            @for (r of rows; track r) {
              <div class="skel-card">
                <div class="skel-card-icon"></div>
                <div class="skel-card-lines">
                  <div class="skel-line skel-line-lg"></div>
                  <div class="skel-line skel-line-sm"></div>
                </div>
              </div>
            }
          </div>
        }
        @default {
          @for (r of rows; track r) {
            <div class="skel-line" [style.width]="getLineWidth(r)"></div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .skeleton-container { padding: 4px 0; }

    .skel-row {
      display: flex; gap: 16px; padding: 14px 16px;
      border-bottom: 1px solid #DDE3EE;
    }
    .skel-header .skel-cell { height: 12px; background: #DDE3EE; }
    .skel-cell {
      flex: 1; height: 16px; border-radius: 6px;
      background: linear-gradient(90deg, #DDE3EE 25%, #EAEEF6 50%, #DDE3EE 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skel-cards { display: flex; gap: 16px; flex-wrap: wrap; }
    .skel-card {
      flex: 1; min-width: 200px; padding: 20px;
      border-radius: 14px; border: 1px solid #DDE3EE;
      display: flex; align-items: center; gap: 16px;
    }
    .skel-card-icon {
      width: 56px; height: 56px; border-radius: 14px;
      background: linear-gradient(90deg, #DDE3EE 25%, #EAEEF6 50%, #DDE3EE 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      flex-shrink: 0;
    }
    .skel-card-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; }

    .skel-line {
      height: 14px; border-radius: 6px;
      background: linear-gradient(90deg, #DDE3EE 25%, #EAEEF6 50%, #DDE3EE 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      margin-bottom: 10px;
    }
    .skel-line-lg { width: 60%; height: 20px; }
    .skel-line-sm { width: 40%; height: 12px; }

    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `]
})
export class SkeletonComponent {
  @Input() type: 'text' | 'table' | 'cards' = 'text';
  @Input() count = 5;

  get rows() { return Array.from({ length: this.count }, (_, i) => i); }
  get cols() { return Array.from({ length: 5 }, (_, i) => i); }

  getLineWidth(i: number): string {
    const widths = ['90%', '75%', '85%', '60%', '70%'];
    return widths[i % widths.length];
  }
}
