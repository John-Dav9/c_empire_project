import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

type ImportExportRequest = {
  id: string;
  originCountry: string;
  destinationCountry: string;
  description: string;
  finalPrice?: number;
  status: string;
  createdAt?: string;
};

@Component({
  selector: 'app-express-import-export-my',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page page-enter">
      <header class="head app-shell-card">
        <h1>Mes demandes Import / Export</h1>
        <a [routerLink]="['/express/import-export/request']">+ Nouvelle demande</a>
      </header>

      <p class="alert error" *ngIf="error">{{ error }}</p>
      <p class="alert ok" *ngIf="notice">{{ notice }}</p>

      <div class="loading" *ngIf="loading">Chargement des demandes...</div>

      <section class="grid" *ngIf="!loading">
        <article class="card app-shell-card" *ngFor="let row of rows">
          <div class="top">
            <h3>{{ row.originCountry }} -> {{ row.destinationCountry }}</h3>
            <span class="status">{{ row.status }}</span>
          </div>
          <p>{{ row.description }}</p>
          <p *ngIf="row.finalPrice">Devis: <strong>{{ row.finalPrice | number:'1.0-0' }} F CFA</strong></p>
          <p class="date" *ngIf="row.createdAt">{{ row.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
          <div class="actions">
            <button type="button" class="btn" *ngIf="row.status === 'quoted'" (click)="acceptQuote(row.id)">Accepter le devis</button>
          </div>
        </article>
      </section>
    </section>
  `,
  styles: [`
    .page { display:grid; gap:12px; }
    .head { display:flex; justify-content:space-between; align-items:center; gap:10px; border:1px solid var(--line); border-radius:14px; padding:12px; }
    .head h1 { margin:0; font-size:1.35rem; }
    .head a { text-decoration:none; border:1px solid #cfe0f2; border-radius:999px; padding:9px 12px; color:#245f99; background:#f4f9ff; font-weight:800; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:10px; }
    .card { border:1px solid var(--line); border-radius:12px; padding:12px; display:grid; gap:6px; }
    .top { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }
    .top h3 { margin:0; font-size:1rem; color:var(--ink-0); }
    .status { border:1px solid #d3e0ed; background:#f6f9fd; border-radius:999px; padding:4px 8px; font-size:.78rem; font-weight:700; text-transform:uppercase; color:#48617d; }
    .card p { margin:0; color:var(--ink-1); }
    .date { font-size:.82rem; color:var(--ink-2); }
    .actions { display:flex; gap:8px; margin-top:4px; }
    .btn { border:none; border-radius:999px; padding:9px 12px; background:#2f6eb8; color:#fff; font-weight:800; cursor:pointer; }
    .alert { padding:10px 12px; border-radius:10px; }
    .alert.error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; }
    .alert.ok { background:#e8f8f0; border:1px solid #9ad5be; color:#0f6d5f; }
    .loading { color:var(--ink-2); font-weight:700; }
  `],
})
export class ExpressImportExportMyComponent implements OnInit {
  rows: ImportExportRequest[] = [];
  loading = true;
  error: string | null = null;
  notice: string | null = null;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.get<ImportExportRequest[]>('/c-express/import-export/my').subscribe({
      next: (rows) => {
        this.rows = Array.isArray(rows) ? rows : [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = this.extractError(err) || 'Impossible de charger vos demandes import/export.';
      },
    });
  }

  acceptQuote(id: string): void {
    this.notice = null;
    this.error = null;
    this.api.patch(`/c-express/import-export/${id}/accept-quote`, {}).subscribe({
      next: () => {
        this.notice = 'Devis accepté.';
        this.load();
      },
      error: (err) => {
        this.error = this.extractError(err) || 'Impossible d’accepter le devis.';
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

