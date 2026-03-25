import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface Breadcrumb {
  label: string;
  link?: string;
}

/**
 * En-tête de page réutilisable avec titre, sous-titre, breadcrumb et slot actions.
 *
 * Usage :
 * <app-page-header
 *   title="Gestion des commandes"
 *   subtitle="45 commandes au total"
 *   [breadcrumbs]="[{ label: 'Dashboard', link: '/admin/dashboard' }, { label: 'Commandes' }]"
 * >
 *   <button mat-flat-button slot="actions">Exporter</button>
 * </app-page-header>
 */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      @if (breadcrumbs().length > 0) {
        <nav class="breadcrumb" aria-label="Fil d'Ariane">
          @for (crumb of breadcrumbs(); track crumb.label; let last = $last) {
            @if (crumb.link && !last) {
              <a [routerLink]="crumb.link" class="crumb-link">{{ crumb.label }}</a>
              <mat-icon class="crumb-sep" aria-hidden="true">chevron_right</mat-icon>
            } @else {
              <span class="crumb-current" [attr.aria-current]="last ? 'page' : null">
                {{ crumb.label }}
              </span>
            }
          }
        </nav>
      }

      <div class="header-row">
        <div class="header-text">
          <h1 class="page-title">{{ title() }}</h1>
          @if (subtitle()) {
            <p class="page-subtitle">{{ subtitle() }}</p>
          }
        </div>

        <div class="header-actions" aria-label="Actions de la page">
          <ng-content select="[slot=actions]" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 1.75rem;
    }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.1rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }
    .crumb-link {
      font-size: 0.8rem;
      color: #888;
      text-decoration: none;
      transition: color 0.15s;
    }
    .crumb-link:hover {
      color: #c62828;
      text-decoration: underline;
    }
    .crumb-sep {
      font-size: 0.9rem;
      width: 0.9rem;
      height: 0.9rem;
      color: #bbb;
    }
    .crumb-current {
      font-size: 0.8rem;
      color: #555;
      font-weight: 500;
    }
    .header-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 0.25rem;
      line-height: 1.2;
    }
    .page-subtitle {
      color: #888;
      margin: 0;
      font-size: 0.9rem;
    }
    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-shrink: 0;
    }
  `]
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly breadcrumbs = input<Breadcrumb[]>([]);
}
