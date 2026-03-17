import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

type ExpressOffer = {
  id: string;
  title: string;
  description: string;
  eta: string;
  baseEstimate: number;
  currency: string;
  avgRating?: number;
  reviewsCount?: number;
};

@Component({
  selector: 'app-express-public',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, FormsModule],
  template: `
    <section class="express-page page-enter">
      <header class="top-strip app-shell-card">
        <span><mat-icon>local_shipping</mat-icon> Collecte rapide partout en ville</span>
        <span><mat-icon>verified</mat-icon> Garantie de suivi en temps reel</span>
        <span><mat-icon>savings</mat-icon> Jusqu'a 20% d'economie sur les flux recurrents</span>
      </header>

      <nav class="section-nav app-shell-card">
        <button
          type="button"
          *ngFor="let section of sectionLinks"
          [class.active]="activeSection === section.id"
          (click)="scrollToSection(section.id)"
        >
          {{ section.label }}
        </button>
      </nav>

      <section class="hero app-shell-card" id="hero">
        <div class="hero-copy">
          <p class="eyebrow">C'Express Business Logistics</p>
          <h1>Gerez vos envois pros simplement, rapidement et moins cher</h1>
          <p>
            C'Express prend en charge la collecte, le tri et la livraison de vos courriers,
            colis et expeditions sensibles. Une experience fluide, inspiree des meilleures
            plateformes europeennes de logistique corporate.
          </p>
          <div class="hero-cta">
            <a class="btn solid" [routerLink]="['/express/request']">Demander un devis</a>
            <a class="btn ghost" [routerLink]="['/express/import-export/request']">Demande import/export</a>
          </div>
          <div class="hero-stats">
            <article><strong>+4 800</strong><span>livraisons / mois</span></article>
            <article><strong>97%</strong><span>livrees a temps</span></article>
            <article><strong>24/7</strong><span>suivi digital</span></article>
          </div>
        </div>
        <div class="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1400&q=80"
            alt="Logistique C'Express"
          />
        </div>
      </section>

      <section class="trust app-shell-card" id="trust">
        <h2>Des entreprises nous confient leurs flux sortants</h2>
        <div class="logo-row">
          <span *ngFor="let logo of trustedBrands">{{ logo }}</span>
        </div>
      </section>

      <section class="benefits app-shell-card" id="benefits">
        <h2>Pourquoi choisir C'Express ?</h2>
        <div class="benefit-grid">
          <article>
            <mat-icon>payments</mat-icon>
            <h3>Tarifs competitifs</h3>
            <p>Nous mutualisons les volumes et optimisons chaque expedition pour reduire vos couts.</p>
          </article>
          <article>
            <mat-icon>bolt</mat-icon>
            <h3>Execution rapide</h3>
            <p>Collecte locale, priorisation des urgences et circuit court pour les livraisons critiques.</p>
          </article>
          <article>
            <mat-icon>hub</mat-icon>
            <h3>Pilotage centralise</h3>
            <p>Suivi des courses, preuves de livraison et etats des commandes depuis la plateforme.</p>
          </article>
        </div>
      </section>

      <section class="calculator app-shell-card" id="calculator">
        <div>
          <h2>Estimez vos economies</h2>
          <p>Calculez rapidement le gain potentiel sur vos envois mensuels.</p>
        </div>
        <div class="calc-form">
          <label>
            Volume mensuel
            <input type="number" min="0" [(ngModel)]="monthlyVolume" />
          </label>
          <label>
            Cout moyen actuel (XAF)
            <input type="number" min="0" [(ngModel)]="averageCurrentCost" />
          </label>
          <div class="result">
            <span>Economies estimees (20%)</span>
            <strong>{{ estimatedSavings | currency:'XOF' }}</strong>
          </div>
        </div>
      </section>

      <section class="offers app-shell-card" id="offers">
        <div class="section-head">
          <div>
            <h2>Nos offres logistiques</h2>
            <p>Choisissez un service selon votre delai et vos contraintes.</p>
          </div>
          <a [routerLink]="['/express/request']">Creer une demande</a>
        </div>

        <div class="filters">
          <input
            type="text"
            placeholder="Rechercher une offre..."
            [(ngModel)]="searchTerm"
          />
          <select [(ngModel)]="etaFilter">
            <option value="">Tous les delais</option>
            <option value="urgent">Urgent</option>
            <option value="standard">Standard</option>
            <option value="planifie">Planifie</option>
          </select>
        </div>

        <p class="error" *ngIf="error">{{ error }}</p>
        <div class="loading" *ngIf="loading">Chargement des offres logistiques...</div>

        <section class="grid" *ngIf="!loading">
          <article class="card" *ngFor="let item of filteredOffers">
            <div class="icon-wrap"><mat-icon>local_shipping</mat-icon></div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            <div class="meta">
              <span>{{ item.eta }}</span>
              <strong>{{ formatPrice(item.baseEstimate) }}</strong>
            </div>
            <div class="rating" *ngIf="(item.reviewsCount || 0) > 0; else noRating">
              <span class="stars">
                <mat-icon *ngFor="let s of stars(item.avgRating || 0)">{{ s ? 'star' : 'star_border' }}</mat-icon>
              </span>
              <span class="score">{{ (item.avgRating || 0) | number:'1.1-1' }}/5</span>
              <span class="count">({{ item.reviewsCount }} avis)</span>
            </div>
            <ng-template #noRating><p class="no-rating">Pas encore note</p></ng-template>
            <div class="actions">
              <a [routerLink]="['/express/request']">Demander une course</a>
            </div>
          </article>
        </section>
      </section>

      <section class="process app-shell-card" id="process">
        <h2>Comment ca marche ?</h2>
        <div class="process-grid">
          <article><strong>1</strong><p>Vous soumettez une demande ou un volume regulier.</p></article>
          <article><strong>2</strong><p>Nous planifions collecte, tri et affectation des ressources.</p></article>
          <article><strong>3</strong><p>Vous suivez l'execution et les preuves de livraison.</p></article>
          <article><strong>4</strong><p>Vous analysez couts, delais et performance par periode.</p></article>
        </div>
      </section>

      <section class="final-cta app-shell-card">
        <h2>Pret a optimiser votre logistique sortante ?</h2>
        <p>Parlez avec l'equipe C'Express pour un cadrage rapide de vos besoins.</p>
        <a [routerLink]="['/express/request']">Lancer ma demande</a>
      </section>
    </section>
  `,
  styles: [`
    .express-page { display:grid; gap:16px; width:100%; overflow-x:hidden; }
    .top-strip {
      border:1px solid var(--line);
      border-radius:16px;
      padding:10px 14px;
      display:flex;
      flex-wrap:wrap;
      gap:12px 24px;
      background:linear-gradient(130deg,#f6faff,#f1f7ff);
    }
    .top-strip span { display:inline-flex; align-items:center; gap:6px; color:#2f4562; font-weight:700; }
    .top-strip mat-icon { width:18px; height:18px; font-size:18px; color:#2f6eb8; }

    .section-nav {
      border: 1px solid #c7daef;
      border-radius: 16px;
      padding: 8px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      position: sticky;
      top: 82px;
      z-index: 9;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(4px);
    }
    .section-nav button {
      border: 1px solid #d1e1f2;
      border-radius: 999px;
      background: #fff;
      color: #33506f;
      font-weight: 700;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .section-nav button:hover {
      border-color: #98bce1;
      color: #234a74;
    }
    .section-nav button.active {
      background: #e9f3ff;
      border-color: #85add7;
      color: #1c456f;
      box-shadow: 0 6px 16px rgba(51, 102, 153, 0.16);
    }

    .hero {
      border:1px solid var(--line);
      border-radius:24px;
      overflow:hidden;
      display:grid;
      grid-template-columns:1.1fr .9fr;
      min-height:520px;
      background:#fff;
    }
    .hero-copy {
      padding:34px 36px;
      display:grid;
      align-content:center;
      gap:12px;
      background:linear-gradient(140deg,#ffffff,#f7fbff);
    }
    .eyebrow { margin:0; font-size:.86rem; letter-spacing:.08em; text-transform:uppercase; color:#2f6eb8; font-weight:800; }
    .hero-copy h1 { margin:0; font-size:clamp(2rem,3.2vw,3.6rem); line-height:1.02; color:#243548; max-width:760px; }
    .hero-copy p { margin:0; color:#4f6176; line-height:1.45; font-size:clamp(1rem,1.08vw,1.14rem); max-width:780px; }
    .hero-cta { display:flex; flex-wrap:wrap; gap:10px; }
    .btn { text-decoration:none; border-radius:999px; padding:11px 16px; font-weight:800; border:1px solid transparent; }
    .btn.solid { background:linear-gradient(135deg,#2f7bc2,#235d96); color:#fff; }
    .btn.ghost { background:#fff; border-color:#d6e4f3; color:#314a66; }
    .hero-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:6px; }
    .hero-stats article { border:1px solid #d6e5f4; background:#f4f9ff; border-radius:12px; padding:10px; display:grid; gap:2px; }
    .hero-stats strong { color:#2f6eb8; font-size:1.3rem; line-height:1; }
    .hero-stats span { color:#566b83; font-weight:600; font-size:.86rem; }
    .hero-visual { position:relative; }
    .hero-visual img { width:100%; height:100%; object-fit:cover; display:block; }
    .hero-visual::before {
      content:'';
      position:absolute;
      inset:0;
      background:linear-gradient(90deg,rgba(255,255,255,.65) 0%,rgba(255,255,255,.1) 45%,rgba(255,255,255,.03) 100%);
    }

    .trust, .benefits, .calculator, .offers, .process, .final-cta {
      border:1px solid #c8dced;
      border-radius:20px;
      padding:20px;
      background:#fff;
      box-shadow: 0 14px 28px rgba(57, 92, 128, 0.08);
    }
    .trust h2, .benefits h2, .calculator h2, .offers h2, .process h2, .final-cta h2 {
      margin:0;
      font-size:clamp(1.35rem,2vw,2rem);
      color:#27384c;
    }
    .trust { background: linear-gradient(145deg, #ffffff, #f6fbff); }
    .benefits { background: linear-gradient(145deg, #ffffff, #f3f8ff); }
    .offers { background: linear-gradient(145deg, #ffffff, #f7fbff); }
    .process { background: linear-gradient(145deg, #ffffff, #f4f9ff); }
    .logo-row { margin-top:10px; display:flex; flex-wrap:wrap; gap:10px; }
    .logo-row span {
      border:1px solid #dce7f2;
      border-radius:999px;
      padding:8px 12px;
      background:#f7fbff;
      color:#43617f;
      font-weight:700;
      font-size:.85rem;
    }

    .benefit-grid { margin-top:12px; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
    .benefit-grid article { border:1px solid #cbdff3; border-radius:16px; padding:14px; background:#eef5ff; display:grid; gap:7px; }
    .benefit-grid mat-icon { width:22px; height:22px; font-size:22px; color:#2f6eb8; }
    .benefit-grid h3 { margin:0; font-size:1.08rem; color:#2d4057; }
    .benefit-grid p { margin:0; color:#5a6f88; line-height:1.35; }

    .calculator { display:grid; grid-template-columns:1fr 1fr; gap:14px; align-items:start; background:linear-gradient(150deg,#f6fbff,#f2f8ff); }
    .calculator p { margin:8px 0 0; color:#5a6f88; }
    .calc-form { display:grid; gap:10px; }
    .calc-form label { display:grid; gap:6px; color:#3d556f; font-weight:700; }
    .calc-form input { height:42px; border:1px solid #d6e4f3; border-radius:10px; padding:0 12px; background:#fff; }
    .result { border:1px solid #c8dbef; background:#fff; border-radius:12px; padding:12px; display:grid; gap:4px; }
    .result span { color:#5a6f88; }
    .result strong { color:#245f99; font-size:1.5rem; }

    .section-head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .section-head p { margin:5px 0 0; color:#647992; }
    .section-head a {
      text-decoration:none;
      border:1px solid #cfe0f2;
      background:#f4f9ff;
      color:#245f99;
      border-radius:999px;
      padding:10px 14px;
      font-weight:800;
      white-space:nowrap;
    }
    .filters { margin-top:12px; display:grid; grid-template-columns:1fr 210px; gap:10px; }
    .filters input, .filters select {
      height:42px;
      border:1px solid #d6e4f3;
      border-radius:10px;
      padding:0 12px;
      background:#fff;
      color:#324c67;
    }
    .loading { color:var(--ink-2); font-weight:700; margin-top:12px; }
    .grid { margin-top:12px; display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:14px; }
    .card {
      border:1px solid #c9ddf1;
      border-radius:18px;
      padding:16px;
      display:grid;
      gap:10px;
      background:linear-gradient(165deg, #ffffff, #f6faff);
      box-shadow: 0 10px 22px rgba(63, 96, 131, 0.09);
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 14px 28px rgba(63, 96, 131, 0.16);
    }
    .icon-wrap { width:44px; height:44px; border-radius:12px; background:#eef4ff; color:#2562a5; display:grid; place-items:center; border:1px solid #d7e6ff; }
    .card h3 { margin:0; font-size:1.15rem; color:#2f4157; }
    .card p { margin:0; color:#60748d; }
    .meta { display:flex; justify-content:space-between; align-items:center; }
    .meta span { font-size:.78rem; text-transform:uppercase; letter-spacing:.05em; color:#2562a5; font-weight:700; }
    .meta strong { color:#c44a18; font-size:1.35rem; font-weight:800; }
    .rating { display:flex; align-items:center; gap:6px; }
    .stars { display:inline-flex; align-items:center; gap:1px; }
    .stars mat-icon { width:16px; height:16px; font-size:16px; color:#d89b2c; }
    .score { font-size:.82rem; font-weight:700; color:#324b65; }
    .count { font-size:.8rem; color:#60748d; }
    .no-rating { margin:0; color:#60748d; font-size:.82rem; }
    .actions { display:flex; justify-content:flex-end; border-top:1px solid #dce7f2; padding-top:10px; }
    .actions a { text-decoration:none; padding:10px 13px; border-radius:12px; color:#245f99; background:#e8f2ff; border:1px solid #c4daf5; font-weight:800; width:100%; text-align:center; }

    .process-grid { margin-top:12px; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
    .process-grid article { border:1px solid #dce7f2; border-radius:12px; padding:12px; background:#f8fbff; display:grid; gap:6px; }
    .process-grid strong { width:28px; height:28px; border-radius:50%; background:#2f6eb8; color:#fff; display:grid; place-items:center; font-size:.9rem; }
    .process-grid p { margin:0; color:#597089; line-height:1.34; }

    .final-cta { text-align:center; background:linear-gradient(150deg,#f6fbff,#f2f8ff); display:grid; gap:8px; }
    .final-cta p { margin:0; color:#5a6f88; }
    .final-cta a {
      justify-self:center;
      text-decoration:none;
      border-radius:999px;
      padding:12px 18px;
      color:#fff;
      border:1px solid #2f6eb8;
      background:linear-gradient(135deg,#2f7bc2,#235d96);
      font-weight:800;
    }

    .error { margin-top:10px; background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; border-radius:12px; padding:10px 12px; }

    @media (max-width: 1120px) {
      .hero { grid-template-columns:1fr; min-height:auto; }
      .hero-visual { min-height:320px; }
      .benefit-grid { grid-template-columns:1fr 1fr; }
      .calculator { grid-template-columns:1fr; }
      .process-grid { grid-template-columns:1fr 1fr; }
    }
    @media (max-width: 760px) {
      .section-nav { top: 72px; }
      .trust, .benefits, .calculator, .offers, .process, .final-cta { padding:14px; }
      .hero-copy { padding:20px 16px; }
      .hero-stats, .benefit-grid, .process-grid { grid-template-columns:1fr; }
      .section-head { flex-direction:column; align-items:flex-start; }
      .filters { grid-template-columns:1fr; }
    }
  `],
})
export class ExpressPublicComponent implements OnInit, AfterViewInit {
  offers: ExpressOffer[] = [];
  trustedBrands = ['KDG Academy', 'Balta Group', 'Eco Services', 'Banking Partners', 'Retail Network'];
  sectionLinks = [
    { id: 'hero', label: 'Presentation' },
    { id: 'trust', label: 'Clients' },
    { id: 'benefits', label: 'Avantages' },
    { id: 'calculator', label: 'Simulateur' },
    { id: 'offers', label: 'Offres' },
    { id: 'process', label: 'Process' },
  ];
  activeSection = 'hero';
  searchTerm = '';
  etaFilter = '';
  monthlyVolume = 400;
  averageCurrentCost = 3500;
  loading = true;
  error: string | null = null;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.get<ExpressOffer[]>('/c-express/public/services').subscribe({
      next: (data) => {
        this.offers = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: () => {
        this.error = "Impossible de charger les offres C'Express.";
        this.loading = false;
      },
    });
  }

  ngAfterViewInit(): void {
    this.updateActiveSection();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateActiveSection();
  }

  scrollToSection(sectionId: string): void {
    const section = document.getElementById(sectionId);
    if (!section) return;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.activeSection = sectionId;
  }

  get estimatedSavings(): number {
    return Math.max(0, Number(this.monthlyVolume || 0) * Number(this.averageCurrentCost || 0) * 0.2);
  }

  get filteredOffers(): ExpressOffer[] {
    const q = this.searchTerm.trim().toLowerCase();
    const filter = this.etaFilter.trim().toLowerCase();
    return this.offers.filter((item) => {
      const matchesText =
        !q ||
        String(item.title || '').toLowerCase().includes(q) ||
        String(item.description || '').toLowerCase().includes(q);
      const eta = String(item.eta || '').toLowerCase();
      const matchesEta = !filter || eta.includes(filter);
      return matchesText && matchesEta;
    });
  }

  stars(rating: number): number[] {
    const rounded = Math.round(Number(rating || 0));
    return [1, 2, 3, 4, 5].map((i) => (i <= rounded ? 1 : 0));
  }

  formatPrice(value: number): string {
    const amount = Number(value || 0);
    return `${amount.toLocaleString('fr-FR')} F CFA`;
  }

  private updateActiveSection(): void {
    const viewportOffset = 140;
    for (const section of this.sectionLinks) {
      const element = document.getElementById(section.id);
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      if (rect.top <= viewportOffset && rect.bottom > viewportOffset) {
        this.activeSection = section.id;
        return;
      }
    }
  }
}
