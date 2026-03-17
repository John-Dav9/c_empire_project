import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

type DeliveryRow = {
  id: string;
  userId: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: string;
  paid: boolean;
  courierId?: string | null;
  price: number;
};

@Component({
  selector: 'app-express-deliveries-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page page-enter">
      <header class="head app-shell-card">
        <h1>Admin C'Express - Livraisons</h1>
      </header>

      <p class="alert error" *ngIf="error">{{ error }}</p>
      <p class="alert ok" *ngIf="notice">{{ notice }}</p>

      <section class="toolbar app-shell-card">
        <select [(ngModel)]="statusFilter">
          <option value="">Tous les statuts</option>
          <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
        </select>
        <button type="button" (click)="load()">Filtrer</button>
      </section>

      <div class="table-wrap app-shell-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Utilisateur</th>
              <th>Trajet</th>
              <th>Statut</th>
              <th>Payee</th>
              <th>Prix</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of rows">
              <td>{{ row.id }}</td>
              <td>{{ row.userId }}</td>
              <td>{{ row.pickupAddress }} -> {{ row.deliveryAddress }}</td>
              <td>
                <select [ngModel]="row.status" (ngModelChange)="updateStatus(row.id, $event)">
                  <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
                </select>
              </td>
              <td>{{ row.paid ? 'Oui' : 'Non' }}</td>
              <td>{{ row.price | number:'1.0-0' }} F CFA</td>
              <td class="actions">
                <button type="button" (click)="markPaid(row.id)" *ngIf="!row.paid">Marquer payee</button>
                <button type="button" class="ghost" (click)="assign(row.id)">Assigner courier</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .page { display:grid; gap:12px; }
    .head, .toolbar, .table-wrap { border:1px solid var(--line); border-radius:12px; padding:12px; }
    .head h1 { margin:0; font-size:1.3rem; }
    .toolbar { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    select, button { height:38px; border:1px solid var(--line); border-radius:10px; padding:0 10px; font:inherit; }
    button { background:#2f6eb8; color:#fff; border:none; font-weight:700; cursor:pointer; }
    button.ghost { background:#fff; color:#334e6b; border:1px solid #ceddeb; }
    table { width:100%; border-collapse:collapse; min-width:860px; }
    th, td { text-align:left; padding:10px; border-bottom:1px solid #e1ebf4; color:var(--ink-1); vertical-align:middle; }
    th { color:var(--ink-0); font-size:.86rem; text-transform:uppercase; letter-spacing:.04em; }
    .actions { display:flex; gap:6px; }
    .alert { padding:10px 12px; border-radius:10px; }
    .alert.error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; }
    .alert.ok { background:#e8f8f0; border:1px solid #9ad5be; color:#0f6d5f; }
  `],
})
export class ExpressDeliveriesManagementComponent implements OnInit {
  rows: DeliveryRow[] = [];
  statusFilter = '';
  error: string | null = null;
  notice: string | null = null;
  statuses = ['pending', 'confirmed', 'assigned', 'in_transit', 'delivered', 'canceled'];

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.error = null;
    const params = this.statusFilter ? { status: this.statusFilter } : undefined;
    this.api.get<DeliveryRow[]>('/admin/c-express/deliveries', params).subscribe({
      next: (rows) => (this.rows = Array.isArray(rows) ? rows : []),
      error: (err) => {
        this.error = this.extractError(err) || 'Impossible de charger les livraisons C\'Express.';
      },
    });
  }

  updateStatus(id: string, status: string): void {
    this.notice = null;
    this.api.patch(`/admin/c-express/delivery/${id}/status`, { status }).subscribe({
      next: () => {
        this.notice = 'Statut mis a jour.';
        this.load();
      },
      error: (err) => {
        this.error = this.extractError(err) || 'Mise a jour du statut impossible.';
      },
    });
  }

  markPaid(id: string): void {
    this.notice = null;
    this.api.patch(`/admin/c-express/delivery/${id}/mark-paid`, {}).subscribe({
      next: () => {
        this.notice = 'Livraison marquee payee.';
        this.load();
      },
      error: (err) => {
        this.error = this.extractError(err) || 'Action impossible.';
      },
    });
  }

  assign(id: string): void {
    const courierId = prompt('ID courier a assigner:');
    if (!courierId) return;
    this.notice = null;
    this.api.patch(`/admin/c-express/delivery/${id}/assign-courier`, { courierId }).subscribe({
      next: () => {
        this.notice = 'Courier assigne.';
        this.load();
      },
      error: (err) => {
        this.error = this.extractError(err) || 'Assignation impossible.';
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

