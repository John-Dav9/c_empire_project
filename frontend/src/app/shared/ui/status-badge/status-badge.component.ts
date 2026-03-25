import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { StatusLabelPipe } from '../../pipes/status-label.pipe';

type StatusColor = 'green' | 'orange' | 'red' | 'blue' | 'grey' | 'purple';

const STATUS_COLORS: Record<string, StatusColor> = {
  // Vert
  confirmed: 'green',
  paid: 'green',
  completed: 'green',
  delivered: 'green',
  success: 'green',
  active: 'green',
  booked: 'green',
  accepted: 'green',

  // Orange
  pending: 'orange',
  processing: 'orange',
  in_progress: 'orange',
  in_transit: 'orange',
  quoted: 'orange',
  requested: 'orange',
  initiated: 'orange',
  assigned: 'orange',
  shipped: 'orange',

  // Rouge
  cancelled: 'red',
  canceled: 'red',
  rejected: 'red',
  failed: 'red',
  inactive: 'red',

  // Bleu
  refunded: 'blue',

  // Violet
  super_admin: 'purple',
  admin: 'purple',

  // Gris
  employee: 'grey',
  client: 'grey',
};

/**
 * Badge coloré pour afficher un statut.
 * Usage : <app-status-badge [status]="order.status" />
 * Optionnel: <app-status-badge [status]="order.status" size="sm" />
 */
@Component({
  selector: 'app-status-badge',
  imports: [StatusLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="badge"
      [class]="'badge badge--' + color() + ' badge--' + size()"
      [attr.aria-label]="'Statut : ' + (status() | statusLabel)"
    >
      {{ status() | statusLabel }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 100px;
      font-weight: 600;
      line-height: 1;
      white-space: nowrap;
    }
    .badge--md {
      font-size: 0.75rem;
      padding: 0.3rem 0.75rem;
    }
    .badge--sm {
      font-size: 0.65rem;
      padding: 0.2rem 0.55rem;
    }
    .badge--lg {
      font-size: 0.85rem;
      padding: 0.4rem 1rem;
    }
    /* Couleurs */
    .badge--green  { background: #e8f5e9; color: #2e7d32; }
    .badge--orange { background: #fff3e0; color: #e65100; }
    .badge--red    { background: #fce4ec; color: #c62828; }
    .badge--blue   { background: #e3f2fd; color: #1565c0; }
    .badge--purple { background: #f3e5f5; color: #6a1b9a; }
    .badge--grey   { background: #f5f5f5; color: #616161; }
  `]
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly color = computed<StatusColor>(() =>
    STATUS_COLORS[this.status()?.toLowerCase()] ?? 'grey'
  );
}
