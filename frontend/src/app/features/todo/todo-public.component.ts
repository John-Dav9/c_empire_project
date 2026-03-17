import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

type TodoServiceItem = {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  isActive?: boolean;
  category?: string;
  eta?: string;
  avgRating?: number;
  reviewsCount?: number;
};

@Component({
  selector: 'app-todo-public',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, FormsModule],
  template: `
    <section class="todo-page page-enter">
      <header class="hero app-shell-card">
        <div class="hero-content">
          <p class="eyebrow">C'To-Do - Life assistant</p>
          <h1>Deleguez vos taches du quotidien et gagnez du temps chaque semaine</h1>
          <p>Maison, administratif, lifestyle ou urgence: un seul espace pour planifier, suivre et valider vos missions.</p>
          <div class="hero-cta">
            <a class="btn solid" [routerLink]="[planRoute]">Planifier une mission</a>
            <a class="btn ghost" [routerLink]="[planRoute]">Voir mes demandes</a>
          </div>
        </div>
      </header>

      <section class="quick-pills app-shell-card">
        <button type="button" [class.active]="selectedCategory === 'all'" (click)="selectedCategory = 'all'">Tous</button>
        <button
          type="button"
          *ngFor="let category of categories"
          [class.active]="selectedCategory === category"
          (click)="selectedCategory = category"
        >
          {{ category }}
        </button>
      </section>

      <section class="simulator app-shell-card">
        <div>
          <h2>Estimateur rapide</h2>
          <p>Selectionnez votre besoin pour voir un budget indicatif.</p>
        </div>
        <div class="sim-grid">
          <label>
            Duree estimee (heures)
            <input type="number" min="1" [(ngModel)]="simHours" />
          </label>
          <label>
            Frequence (missions/mois)
            <input type="number" min="1" [(ngModel)]="simFrequency" />
          </label>
          <label>
            Niveau d'urgence
            <select [(ngModel)]="simUrgency">
              <option value="normal">Normal</option>
              <option value="priority">Prioritaire</option>
              <option value="critical">Critique</option>
            </select>
          </label>
          <div class="estimate">
            <span>Budget estime</span>
            <strong>{{ estimatedBudget | currency:'XAF' }}</strong>
          </div>
        </div>
      </section>

      <section class="services app-shell-card">
        <div class="services-head">
          <div>
            <h2>Services populaires C'To-Do</h2>
            <p>Des prestations pretes a l'emploi pour particuliers et pros.</p>
          </div>
          <input type="text" placeholder="Rechercher un service..." [(ngModel)]="searchTerm" />
        </div>

        <p class="error" *ngIf="error">{{ error }}</p>
        <div class="loading" *ngIf="loading">Chargement des services C'To-Do...</div>

        <section class="grid" *ngIf="!loading">
          <article class="card app-shell-card" *ngFor="let item of filteredServices">
            <div class="icon-wrap">
              <mat-icon>task_alt</mat-icon>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            <div class="meta">
              <span>{{ item.category || 'Service standard' }}</span>
              <strong>{{ item.basePrice | currency:'XAF' }}</strong>
            </div>
            <small class="eta" *ngIf="item.eta">Delai moyen: {{ item.eta }}</small>
            <div class="rating" *ngIf="(item.reviewsCount || 0) > 0; else noRating">
              <span class="stars">
                <mat-icon *ngFor="let s of stars(item.avgRating || 0)">{{ s ? 'star' : 'star_border' }}</mat-icon>
              </span>
              <span class="score">{{ (item.avgRating || 0) | number:'1.1-1' }}/5</span>
              <span class="count">({{ item.reviewsCount }} avis)</span>
            </div>
            <ng-template #noRating><p class="no-rating">Pas encore note</p></ng-template>
            <div class="actions">
              <a [routerLink]="[planRoute]">Planifier</a>
            </div>
          </article>
        </section>
      </section>

      <section class="workflow app-shell-card">
        <h2>Comment ca marche</h2>
        <div class="steps">
          <article><strong>1</strong><p>Vous decrivez votre besoin en 2 minutes.</p></article>
          <article><strong>2</strong><p>C'To-Do assigne un agent compatible.</p></article>
          <article><strong>3</strong><p>Vous suivez la mission en direct.</p></article>
          <article><strong>4</strong><p>Validation, note et historique disponible.</p></article>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .todo-page { display:grid; gap:16px; }
    .hero { border:1px solid #c8dced; padding:20px; background:linear-gradient(145deg, #f6fcfa, #f0f8f5); }
    .hero-content { max-width:860px; display:grid; gap:8px; }
    .eyebrow { margin:0; font-size:.82rem; letter-spacing:.08em; text-transform:uppercase; color:#0f756d; font-weight:800; }
    .hero h1 { margin:0; font-size:clamp(1.7rem,2.6vw,2.5rem); line-height:1.05; }
    .hero p { margin:0; color:var(--ink-2); }
    .hero-cta { display:flex; flex-wrap:wrap; gap:10px; margin-top:8px; }
    .btn { text-decoration:none; border-radius:999px; padding:10px 14px; font-weight:800; border:1px solid transparent; }
    .btn.solid { background:#148474; color:#fff; }
    .btn.ghost { background:#fff; color:#146e62; border-color:#c3e5df; }
    .quick-pills { border:1px solid var(--line); padding:10px; display:flex; flex-wrap:wrap; gap:8px; }
    .quick-pills button { border:1px solid #cbe7e2; border-radius:999px; padding:7px 12px; background:#f4fbf9; color:#1a6d62; font-weight:700; cursor:pointer; }
    .quick-pills button.active { background:#148474; color:#fff; border-color:#148474; }
    .simulator, .services, .workflow { border:1px solid #c8dced; padding:18px; background:#fff; }
    .simulator h2, .services h2, .workflow h2 { margin:0; }
    .simulator p { margin:6px 0 0; color:var(--ink-2); }
    .sim-grid { margin-top:12px; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
    .sim-grid label { display:grid; gap:6px; color:var(--ink-1); font-weight:700; }
    .sim-grid input, .sim-grid select { height:42px; border:1px solid var(--line); border-radius:10px; padding:0 10px; background:#fff; }
    .estimate { border:1px solid #bfe7df; border-radius:12px; background:#f0fbf8; padding:10px; display:grid; align-content:center; gap:4px; }
    .estimate span { color:#2f655d; font-size:.82rem; text-transform:uppercase; letter-spacing:.05em; font-weight:700; }
    .estimate strong { color:#0f756d; font-size:1.35rem; }
    .services-head { display:grid; grid-template-columns:1fr 320px; align-items:end; gap:12px; }
    .services-head p { margin:5px 0 0; color:var(--ink-2); }
    .services-head input { height:42px; border:1px solid var(--line); border-radius:10px; padding:0 12px; }
    .loading { color:var(--ink-2); font-weight:700; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:14px; }
    .card { border:1px solid #cce5df; padding:14px; display:grid; gap:10px; background:linear-gradient(160deg, #ffffff, #f5fbf9); }
    .icon-wrap { width:44px; height:44px; border-radius:12px; background:#e8f7f3; color:#0b6557; display:grid; place-items:center; border:1px solid #cce8e1; }
    .card h3 { margin:0; font-size:1.25rem; }
    .card p { margin:0; color:var(--ink-2); }
    .meta { display:flex; justify-content:space-between; align-items:center; }
    .meta span { font-size:.78rem; text-transform:uppercase; letter-spacing:.05em; color:#0b6557; font-weight:700; }
    .meta strong { color:var(--brand-strong); font-size:1.1rem; }
    .eta { color:#3d6b62; font-weight:700; }
    .rating { display:flex; align-items:center; gap:6px; }
    .stars { display:inline-flex; align-items:center; gap:1px; }
    .stars mat-icon { width:16px; height:16px; font-size:16px; color:#d89b2c; }
    .score { font-size:.82rem; font-weight:700; color:var(--ink-1); }
    .count { font-size:.8rem; color:var(--ink-2); }
    .no-rating { margin:0; color:var(--ink-2); font-size:.82rem; }
    .actions { display:flex; justify-content:flex-end; border-top:1px solid #d8ece8; padding-top:10px; }
    .actions a { text-decoration:none; padding:8px 12px; border-radius:10px; color:#0f6458; background:#e6f7f3; border:1px solid #c7e7e1; font-weight:700; }
    .steps { margin-top:12px; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
    .steps article { border:1px solid #cce5df; border-radius:14px; padding:12px; background:#f5fbf9; display:grid; gap:6px; }
    .steps strong { width:28px; height:28px; border-radius:50%; background:#148474; color:#fff; display:grid; place-items:center; }
    .steps p { margin:0; color:var(--ink-2); }
    .error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; border-radius:12px; padding:10px 12px; }
    @media (max-width: 980px) { .sim-grid { grid-template-columns:1fr 1fr; } .services-head { grid-template-columns:1fr; } .steps { grid-template-columns:1fr 1fr; } }
    @media (max-width: 760px) { .sim-grid, .steps { grid-template-columns:1fr; } }
  `],
})
export class TodoPublicComponent implements OnInit {
  services: TodoServiceItem[] = [];
  selectedCategory = 'all';
  searchTerm = '';
  simHours = 2;
  simFrequency = 4;
  simUrgency: 'normal' | 'priority' | 'critical' = 'normal';
  loading = true;
  error: string | null = null;
  planRoute = '/auth/signin';

  constructor(
    private readonly api: ApiService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.planRoute = this.authService.isAuthenticated()
      ? '/client/todo/requests'
      : '/auth/signin';

    this.api.get<TodoServiceItem[]>('/todo').subscribe({
      next: (data) => {
        this.services = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: () => {
        this.error = "Impossible de charger les services C'Todo.";
        this.loading = false;
      },
    });
  }

  stars(rating: number): number[] {
    const rounded = Math.round(Number(rating || 0));
    return [1, 2, 3, 4, 5].map((i) => (i <= rounded ? 1 : 0));
  }

  get filteredServices(): TodoServiceItem[] {
    const q = this.searchTerm.trim().toLowerCase();
    return this.services.filter((item) => {
      const categoryOk =
        this.selectedCategory === 'all' ||
        String(item.category || '').toLowerCase() === this.selectedCategory.toLowerCase();
      if (!categoryOk) return false;
      if (!q) return true;
      return (
        String(item.title || '').toLowerCase().includes(q) ||
        String(item.description || '').toLowerCase().includes(q)
      );
    });
  }

  get categories(): string[] {
    const set = new Set(
      this.services
        .map((item) => String(item.category || '').trim())
        .filter(Boolean),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  get estimatedBudget(): number {
    const urgencyFactor = this.simUrgency === 'critical' ? 1.5 : this.simUrgency === 'priority' ? 1.25 : 1;
    return Math.round(Number(this.simHours || 0) * 3500 * Number(this.simFrequency || 0) * urgencyFactor);
  }
}
