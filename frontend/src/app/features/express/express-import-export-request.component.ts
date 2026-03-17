import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-express-import-export-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page page-enter">
      <header class="head app-shell-card">
        <h1>Nouvelle demande Import / Export</h1>
        <a [routerLink]="['/express/import-export/my']">Mes demandes</a>
      </header>

      <p class="alert error" *ngIf="error">{{ error }}</p>
      <p class="alert ok" *ngIf="success">{{ success }}</p>

      <form class="card app-shell-card" (ngSubmit)="submit()">
        <div class="row">
          <div>
            <label>Pays d'origine *</label>
            <input [(ngModel)]="model.originCountry" name="originCountry" required />
          </div>
          <div>
            <label>Pays de destination *</label>
            <input [(ngModel)]="model.destinationCountry" name="destinationCountry" required />
          </div>
        </div>

        <label>Description *</label>
        <textarea rows="4" [(ngModel)]="model.description" name="description" required></textarea>

        <div class="row">
          <div>
            <label>Poids (kg)</label>
            <input type="number" min="0" [(ngModel)]="model.weightKg" name="weightKg" />
          </div>
          <div>
            <label>Volume (m3)</label>
            <input type="number" min="0" [(ngModel)]="model.volumeM3" name="volumeM3" />
          </div>
        </div>

        <label>Note</label>
        <textarea rows="3" [(ngModel)]="model.customerNote" name="customerNote"></textarea>

        <button type="submit" [disabled]="loading">{{ loading ? 'Envoi...' : 'Envoyer la demande' }}</button>
      </form>
    </section>
  `,
  styles: [`
    .page { display:grid; gap:12px; }
    .head { display:flex; justify-content:space-between; align-items:center; gap:10px; border:1px solid var(--line); border-radius:14px; padding:12px; }
    .head h1 { margin:0; font-size:1.35rem; }
    .head a { text-decoration:none; border:1px solid #cfe0f2; border-radius:999px; padding:9px 12px; color:#245f99; background:#f4f9ff; font-weight:800; }
    .card { border:1px solid var(--line); border-radius:14px; padding:14px; display:grid; gap:8px; }
    .row { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    input, textarea { width:100%; border:1px solid var(--line); border-radius:10px; padding:10px; font:inherit; }
    label { font-weight:700; color:var(--ink-1); font-size:.9rem; }
    button { height:44px; border:none; border-radius:999px; background:#2f6eb8; color:#fff; font-weight:800; cursor:pointer; }
    .alert { padding:10px 12px; border-radius:10px; }
    .alert.error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; }
    .alert.ok { background:#e8f8f0; border:1px solid #9ad5be; color:#0f6d5f; }
    @media (max-width: 860px) { .row { grid-template-columns:1fr; } }
  `],
})
export class ExpressImportExportRequestComponent {
  loading = false;
  error: string | null = null;
  success: string | null = null;

  model = {
    originCountry: 'Cameroun',
    destinationCountry: '',
    description: '',
    weightKg: 1,
    volumeM3: 0,
    customerNote: '',
  };

  constructor(private readonly api: ApiService, private readonly router: Router) {}

  submit(): void {
    this.loading = true;
    this.error = null;
    this.success = null;

    this.api.post<any>('/c-express/import-export', this.model).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Demande envoyée.';
        this.router.navigate(['/express/import-export/my']);
      },
      error: (err) => {
        this.loading = false;
        this.error = this.extractError(err) || 'Impossible de créer la demande import/export.';
      },
    });
  }

  private extractError(err: any): string {
    const raw = err?.error;
    if (!raw) return '';
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw?.message)) return raw.message.join(', ');
    return raw?.message || '';
  }
}

