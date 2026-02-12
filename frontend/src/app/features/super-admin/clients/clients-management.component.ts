import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { buildApiUrl } from '../../../core/config/api.config';

type LoyaltyTier = 'classic' | 'gold' | 'platinum';

@Component({
  selector: 'app-clients-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="clients-container">
      <div class="header">
        <h1>🛒 Gestion des Clients</h1>
        <div class="stats-row">
          <div class="stat-badge">
            <span class="stat-icon">🥉</span>
            <span class="stat-label">Classic: {{ getClientsByTier('classic').length }}</span>
          </div>
          <div class="stat-badge">
            <span class="stat-icon">🥇</span>
            <span class="stat-label">Gold: {{ getClientsByTier('gold').length }}</span>
          </div>
          <div class="stat-badge">
            <span class="stat-icon">💎</span>
            <span class="stat-label">Platinum: {{ getClientsByTier('platinum').length }}</span>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <div *ngIf="!loading" class="clients-grid">
        <div *ngFor="let client of clients" class="client-card" [class]="'tier-' + (client.loyaltyTier || 'classic')">
          <div class="tier-badge">
            {{ getTierIcon(client.loyaltyTier || 'classic') }}
            {{ getTierLabel(client.loyaltyTier || 'classic') }}
          </div>
          <div class="client-header">
            <div class="avatar">{{ client.firstname?.charAt(0) }}{{ client.lastname?.charAt(0) }}</div>
            <div class="client-info">
              <h3>{{ client.firstname }} {{ client.lastname }}</h3>
              <p>{{ client.email }}</p>
            </div>
          </div>
          <div class="client-body">
            <div class="info-row">
              <span class="label">📞 Téléphone:</span>
              <span>{{ client.phone || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="label">📅 Membre depuis:</span>
              <span>{{ client.createdAt | date:'dd/MM/yyyy' }}</span>
            </div>
            <div class="info-row">
              <span class="label">✨ Niveau de fidélité:</span>
              <select [(ngModel)]="client.loyaltyTier" (change)="updateLoyaltyTier(client)" class="tier-select">
                <option value="classic">🥉 Classic</option>
                <option value="gold">🥇 Gold</option>
                <option value="platinum">💎 Platinum</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="clients.length === 0 && !loading" class="empty-state">
        <p>🛒 Aucun client trouvé</p>
      </div>
    </div>
  `,
  styles: [`
    .clients-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 2rem;

      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0 0 1rem;
      }

      .stats-row {
        display: flex;
        gap: 1rem;

        .stat-badge {
          background: white;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .stat-icon {
            font-size: 1.5rem;
          }

          .stat-label {
            font-weight: 600;
          }
        }
      }
    }

    .clients-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .client-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      &.tier-classic::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: #6c757d;
      }

      &.tier-gold::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: linear-gradient(180deg, #ffd700, #ffed4e);
      }

      &.tier-platinum::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: linear-gradient(180deg, #e5e4e2, #b9f2ff);
      }

      .tier-badge {
        position: absolute;
        top: 1rem;
        right: 1rem;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        background: rgba(0, 0, 0, 0.05);
      }

      .client-header {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #eee;

        .avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dc3545, #c82333);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .client-info {
          flex: 1;

          h3 {
            margin: 0 0 0.25rem;
            font-size: 1.125rem;
            font-weight: 600;
          }

          p {
            margin: 0;
            color: #666;
            font-size: 0.875rem;
          }
        }
      }

      .client-body {
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;

          .label {
            font-weight: 600;
            color: #666;
          }

          .tier-select {
            padding: 0.375rem 0.75rem;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 0.875rem;
            cursor: pointer;

            &:focus {
              outline: none;
              border-color: #dc3545;
            }
          }
        }
      }
    }

    .loading, .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;

      .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #dc3545;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ClientsManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = buildApiUrl('/admin/users');

  clients: any[] = [];
  loading = false;

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.loading = true;
    this.http.get<any>(this.apiUrl + '?role=client').subscribe({
      next: (response) => {
        this.clients = response.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getClientsByTier(tier: LoyaltyTier): any[] {
    return this.clients.filter(c => (c.loyaltyTier || 'classic') === tier);
  }

  updateLoyaltyTier(client: any) {
    // Pour l'instant, stockons localement. Vous pouvez ajouter un endpoint backend plus tard
    console.log(`Client ${client.email} updated to tier: ${client.loyaltyTier}`);
  }

  getTierIcon(tier: LoyaltyTier): string {
    const icons = {
      'classic': '🥉',
      'gold': '🥇',
      'platinum': '💎'
    };
    return icons[tier];
  }

  getTierLabel(tier: LoyaltyTier): string {
    const labels = {
      'classic': 'Classic',
      'gold': 'Gold',
      'platinum': 'Platinum'
    };
    return labels[tier];
  }
}
