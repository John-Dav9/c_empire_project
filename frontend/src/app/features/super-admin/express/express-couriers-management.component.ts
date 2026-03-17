import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

type Courier = {
  id: string;
  fullName: string;
  phone: string;
  vehicleType: string;
  city?: string;
  country?: string;
  available: boolean;
};

@Component({
  selector: 'app-express-couriers-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page page-enter">
      <header class="head app-shell-card">
        <h1>Admin C'Express - Couriers</h1>
      </header>

      <p class="alert error" *ngIf="error">{{ error }}</p>
      <p class="alert ok" *ngIf="notice">{{ notice }}</p>

      <form class="card app-shell-card" (ngSubmit)="createCourier()">
        <h3>Ajouter un courier</h3>
        <div class="grid">
          <input [(ngModel)]="draft.fullName" name="fullName" placeholder="Nom complet" required />
          <input [(ngModel)]="draft.phone" name="phone" placeholder="Telephone" required />
          <input [(ngModel)]="draft.vehicleType" name="vehicleType" placeholder="Vehicule (moto, van...)" required />
          <input [(ngModel)]="draft.city" name="city" placeholder="Ville" />
          <input [(ngModel)]="draft.country" name="country" placeholder="Pays" />
        </div>
        <button type="submit">Ajouter</button>
      </form>

      <section class="table-wrap app-shell-card">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Telephone</th>
              <th>Vehicule</th>
              <th>Zone</th>
              <th>Disponibilite</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of rows">
              <td>{{ row.fullName }}</td>
              <td>{{ row.phone }}</td>
              <td>{{ row.vehicleType }}</td>
              <td>{{ row.city || '-' }}, {{ row.country || '-' }}</td>
              <td>{{ row.available ? 'Disponible' : 'Indisponible' }}</td>
              <td>
                <button type="button" class="ghost" (click)="toggleAvailability(row)">
                  {{ row.available ? 'Desactiver' : 'Activer' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  `,
  styles: [`
    .page { display:grid; gap:12px; }
    .head, .card, .table-wrap { border:1px solid var(--line); border-radius:12px; padding:12px; }
    .head h1 { margin:0; font-size:1.3rem; }
    .card { display:grid; gap:8px; }
    .card h3 { margin:0; color:var(--ink-0); font-size:1rem; }
    .grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
    input, button { height:38px; border:1px solid var(--line); border-radius:10px; padding:0 10px; font:inherit; }
    button { background:#2f6eb8; color:#fff; border:none; font-weight:700; cursor:pointer; }
    button.ghost { background:#fff; color:#334e6b; border:1px solid #ceddeb; }
    table { width:100%; border-collapse:collapse; min-width:760px; }
    th, td { text-align:left; padding:10px; border-bottom:1px solid #e1ebf4; color:var(--ink-1); }
    th { color:var(--ink-0); font-size:.86rem; text-transform:uppercase; letter-spacing:.04em; }
    .alert { padding:10px 12px; border-radius:10px; }
    .alert.error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; }
    .alert.ok { background:#e8f8f0; border:1px solid #9ad5be; color:#0f6d5f; }
    @media (max-width: 900px) { .grid { grid-template-columns:1fr; } }
  `],
})
export class ExpressCouriersManagementComponent implements OnInit {
  rows: Courier[] = [];
  error: string | null = null;
  notice: string | null = null;

  draft = {
    fullName: '',
    phone: '',
    vehicleType: 'moto',
    city: '',
    country: 'Cameroun',
  };

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.error = null;
    this.api.get<Courier[]>('/admin/c-express/couriers').subscribe({
      next: (rows) => (this.rows = Array.isArray(rows) ? rows : []),
      error: (err) => {
        this.error = this.extractError(err) || 'Impossible de charger les couriers.';
      },
    });
  }

  createCourier(): void {
    this.notice = null;
    this.error = null;
    this.api.post('/admin/c-express/couriers', this.draft).subscribe({
      next: () => {
        this.notice = 'Courier cree.';
        this.draft = { fullName: '', phone: '', vehicleType: 'moto', city: '', country: 'Cameroun' };
        this.load();
      },
      error: (err) => {
        this.error = this.extractError(err) || 'Creation impossible.';
      },
    });
  }

  toggleAvailability(row: Courier): void {
    this.notice = null;
    this.error = null;
    this.api.patch(`/admin/c-express/couriers/${row.id}/availability`, {
      available: !row.available,
    }).subscribe({
      next: () => {
        this.notice = 'Disponibilite mise a jour.';
        this.load();
      },
      error: (err) => {
        this.error = this.extractError(err) || 'Action impossible.';
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

