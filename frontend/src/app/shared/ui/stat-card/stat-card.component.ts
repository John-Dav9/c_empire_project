import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Carte KPI réutilisable pour les dashboards.
 *
 * Usage :
 * <app-stat-card
 *   title="Revenus du mois"
 *   [value]="125000"
 *   format="currency"
 *   icon="payments"
 *   color="green"
 *   trend="+12%"
 *   trendUp
 * />
 */
@Component({
  selector: 'app-stat-card',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stat-card" [class]="'stat-card stat-card--' + color()">
      <div class="card-icon-wrapper" aria-hidden="true">
        <mat-icon class="card-icon">{{ icon() }}</mat-icon>
      </div>
      <div class="card-body">
        <p class="card-title">{{ title() }}</p>
        <p class="card-value" [attr.aria-label]="title() + ' : ' + formattedValue()">
          {{ formattedValue() }}
        </p>
        @if (trend()) {
          <p class="card-trend" [class.trend-up]="trendUp()" [class.trend-down]="!trendUp()">
            <mat-icon class="trend-icon">{{ trendUp() ? 'trending_up' : 'trending_down' }}</mat-icon>
            {{ trend() }}
          </p>
        }
        @if (subtitle()) {
          <p class="card-subtitle">{{ subtitle() }}</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      border-left: 4px solid transparent;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .stat-card:hover {
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transform: translateY(-1px);
    }
    .card-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .card-icon {
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
    }
    .card-body {
      flex: 1;
      min-width: 0;
    }
    .card-title {
      font-size: 0.8rem;
      font-weight: 500;
      color: #888;
      margin: 0 0 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .card-value {
      font-size: 1.6rem;
      font-weight: 800;
      color: #1a1a2e;
      margin: 0 0 0.25rem;
      line-height: 1.1;
    }
    .card-trend {
      display: flex;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.78rem;
      font-weight: 600;
      margin: 0 0 0.1rem;
    }
    .trend-icon {
      font-size: 0.9rem;
      width: 0.9rem;
      height: 0.9rem;
    }
    .trend-up  { color: #2e7d32; }
    .trend-down { color: #c62828; }
    .card-subtitle {
      font-size: 0.75rem;
      color: #aaa;
      margin: 0;
    }

    /* Variantes couleurs */
    .stat-card--green  { border-left-color: #2e7d32; }
    .stat-card--green  .card-icon-wrapper { background: #e8f5e9; }
    .stat-card--green  .card-icon { color: #2e7d32; }

    .stat-card--red    { border-left-color: #c62828; }
    .stat-card--red    .card-icon-wrapper { background: #fce4ec; }
    .stat-card--red    .card-icon { color: #c62828; }

    .stat-card--blue   { border-left-color: #1565c0; }
    .stat-card--blue   .card-icon-wrapper { background: #e3f2fd; }
    .stat-card--blue   .card-icon { color: #1565c0; }

    .stat-card--orange { border-left-color: #e65100; }
    .stat-card--orange .card-icon-wrapper { background: #fff3e0; }
    .stat-card--orange .card-icon { color: #e65100; }

    .stat-card--purple { border-left-color: #6a1b9a; }
    .stat-card--purple .card-icon-wrapper { background: #f3e5f5; }
    .stat-card--purple .card-icon { color: #6a1b9a; }

    .stat-card--grey   { border-left-color: #616161; }
    .stat-card--grey   .card-icon-wrapper { background: #f5f5f5; }
    .stat-card--grey   .card-icon { color: #616161; }
  `]
})
export class StatCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<number | string>();
  readonly icon = input<string>('analytics');
  readonly color = input<'green' | 'red' | 'blue' | 'orange' | 'purple' | 'grey'>('blue');
  readonly format = input<'number' | 'currency' | 'percent' | 'raw'>('number');
  readonly trend = input<string>('');
  readonly trendUp = input<boolean>(true);
  readonly subtitle = input<string>('');

  readonly formattedValue = computed(() => {
    const v = this.value();
    if (v === null || v === undefined || v === '') return '—';
    const num = Number(v);
    if (isNaN(num)) return String(v);

    switch (this.format()) {
      case 'currency':
        return num.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' XAF';
      case 'percent':
        return num.toFixed(1) + ' %';
      case 'raw':
        return String(v);
      default:
        return num.toLocaleString('fr-FR');
    }
  });
}
