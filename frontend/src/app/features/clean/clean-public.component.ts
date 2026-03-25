import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { buildMediaUrl } from '../../core/config/api.config';
import { CurrencyXafPipe } from '../../shared/pipes/currency-xaf.pipe';

type CleanService = {
  id: string;
  title: string;
  description?: string;
  type: string;
  basePrice: number;
  currency?: string;
  estimatedDurationMin?: number;
  imageUrl?: string;
  avgRating?: number;
  reviewsCount?: number;
};

@Component({
  selector: 'app-clean-public',
  imports: [MatIconModule, RouterLink, DecimalPipe, CurrencyXafPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="clean-page page-enter">
      <header class="clean-subnav app-shell-card">
        <a href="#bureaux" class="active">Bureaux</a>
        <a href="#commerces">Commerces</a>
        <a href="#process">Vitres</a>
        <a href="#process">Chantiers</a>
        <a href="#prestations">Autres services</a>
        <a href="#contact">Contact</a>
      </header>

      <section class="hero app-shell-card" id="bureaux">
        <div class="hero-copy">
          <p class="eyebrow">C'Clean Cameroun</p>
          <h1><span>Confiez-nous</span> le nettoyage de vos bureaux</h1>
          <p>
            Vous souhaitez faire entretenir vos bureaux, surfaces commerciales ou industrielles ?
            Nos equipes assurent des prestations de qualite avec des produits adaptes et une
            execution rigoureuse.
          </p>
          <div class="hero-actions">
            <a class="btn solid" [routerLink]="['/clean/quote']">Demander un devis</a>
            <a class="btn ghost" href="#prestations">Voir nos prestations</a>
          </div>
        </div>
        <div class="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80"
            alt="Nettoyage de bureaux"
          />
        </div>
      </section>

      <section class="split app-shell-card" id="commerces">
        <div class="split-visual">
          <img
            src="https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80"
            alt="Nettoyage complet"
          />
        </div>
        <div class="split-copy">
          <h2><span>Nettoyage</span> complet</h2>
          <p>
            Afin de garantir un environnement impeccable a vos employes et clients, nous entretenons
            bureaux d'entreprises, commerces, cabinets, agences et espaces communs.
          </p>
          <ul>
            <li>Depoussierage du mobilier et des postes de travail</li>
            <li>Nettoyage des sols, y compris tapis et moquettes</li>
            <li>Nettoyage et desinfection des sanitaires</li>
            <li>Entretien des cuisines et espaces de pause</li>
            <li>Lavage de vitres, portes vitrees et cloisons</li>
            <li>Interventions ponctuelles ou recurrentes</li>
          </ul>
        </div>
      </section>

      <section class="kpi-row">
        <article class="kpi app-shell-card">
          <strong>+1 200</strong>
          <span>interventions realisees</span>
        </article>
        <article class="kpi app-shell-card">
          <strong>98%</strong>
          <span>clients satisfaits</span>
        </article>
        <article class="kpi app-shell-card">
          <strong>7j/7</strong>
          <span>disponibilite des equipes</span>
        </article>
        <article class="kpi app-shell-card">
          <strong>2h</strong>
          <span>delai moyen de reponse</span>
        </article>
      </section>

      <section class="process app-shell-card" id="process">
        <h2>Notre methode d'intervention</h2>
        <div class="process-grid">
          <article>
            <mat-icon>assignment</mat-icon>
            <h3>Audit des besoins</h3>
            <p>Nous evaluons vos espaces et contraintes avant toute intervention.</p>
          </article>
          <article>
            <mat-icon>event_available</mat-icon>
            <h3>Planification</h3>
            <p>Horaires flexibles: avant ouverture, apres fermeture, week-end.</p>
          </article>
          <article>
            <mat-icon>cleaning_services</mat-icon>
            <h3>Execution controlee</h3>
            <p>Protocoles stricts, checklists et chef d'equipe dedie.</p>
          </article>
          <article>
            <mat-icon>verified</mat-icon>
            <h3>Suivi qualite</h3>
            <p>Compte-rendu et ajustements continus selon vos retours.</p>
          </article>
        </div>
      </section>

      <section class="services app-shell-card" id="prestations">
        <div class="section-head">
          <h2>Nos prestations C'Clean</h2>
          <a [routerLink]="['/clean/book']">Reserver un service</a>
        </div>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        @if (loading()) {
          <div class="loading">Chargement des services...</div>
        }

        @if (!loading()) {
          <div class="grid">
            @for (item of services(); track item.id) {
              <article class="card">
                <div class="img">
                  @if (item.imageUrl) {
                    <img
                      [src]="item.imageUrl"
                      [alt]="item.title"
                      (error)="onServiceImageError(item.id)"
                    />
                  } @else {
                    <div class="fallback">
                      <mat-icon>cleaning_services</mat-icon>
                      <span>Service C'Clean</span>
                    </div>
                  }
                </div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.description || "Service professionnel C'Clean." }}</p>
                <div class="meta">
                  <span>{{ item.type }}</span>
                  <strong>{{ item.basePrice | currencyXaf }}</strong>
                </div>
                @if ((item.reviewsCount || 0) > 0) {
                  <div class="rating">
                    <span class="stars">
                      @for (s of stars(item.avgRating || 0); track $index) {
                        <mat-icon>{{ s ? 'star' : 'star_border' }}</mat-icon>
                      }
                    </span>
                    <span class="score">{{ (item.avgRating || 0) | number:'1.1-1' }}/5</span>
                    <span class="count">({{ item.reviewsCount }} avis)</span>
                  </div>
                } @else {
                  <p class="no-rating">Pas encore note</p>
                }
                <div class="actions">
                  <a [routerLink]="['/clean/book']" [queryParams]="{ serviceId: item.id, serviceTitle: item.title, amount: item.basePrice }">Reserver</a>
                </div>
              </article>
            }
          </div>
        }
      </section>

      <section class="contact app-shell-card" id="contact">
        <h2>Parlons de votre besoin</h2>
        <p>
          Besoin d'un contrat regulier, d'une remise en etat apres chantier ou d'une intervention
          express ? Notre equipe vous repond rapidement.
        </p>
        <a [routerLink]="['/clean/quote']">Contacter C'Clean</a>
      </section>
    </section>
  `,
  styles: [`
    .clean-page { display:grid; gap:18px; }
    .clean-subnav {
      border:1px solid var(--line);
      padding:10px 16px;
      display:flex;
      gap:12px;
      overflow-x:auto;
      border-radius:16px;
      position:sticky;
      top:94px;
      z-index:9;
      backdrop-filter:blur(8px);
      background:rgba(255,255,255,.92);
    }
    .clean-subnav a {
      text-decoration:none;
      color:#4a5565;
      font-weight:700;
      white-space:nowrap;
      padding:8px 10px;
      border-radius:999px;
    }
    .clean-subnav a.active,
    .clean-subnav a:hover { color:#2f8f2c; background:#edf7ed; }

    .hero {
      border:1px solid var(--line);
      border-radius:22px;
      display:grid;
      grid-template-columns:1fr 1fr;
      overflow:hidden;
      min-height:520px;
    }
    .hero-copy {
      padding:46px 40px;
      display:grid;
      align-content:center;
      gap:14px;
      background:linear-gradient(145deg,#ffffff,#f5f8fb);
    }
    .eyebrow {
      margin:0;
      font-size:.9rem;
      text-transform:uppercase;
      letter-spacing:.08em;
      color:#2f8f2c;
      font-weight:800;
    }
    .hero-copy h1 {
      margin:0;
      font-size:clamp(2rem,4vw,5rem);
      line-height:.95;
      text-transform:uppercase;
      color:#4d5562;
    }
    .hero-copy h1 span { color:#59a93b; }
    .hero-copy p {
      margin:0;
      color:#4e5f72;
      line-height:1.35;
      font-size:clamp(1rem,1.2vw,1.18rem);
      max-width:580px;
    }
    .hero-actions { display:flex; gap:10px; flex-wrap:wrap; }
    .btn {
      text-decoration:none;
      border-radius:999px;
      padding:12px 20px;
      font-weight:800;
      border:1px solid transparent;
    }
    .btn.solid { background:linear-gradient(135deg,#68bb3e,#3b8d2f); color:#fff; }
    .btn.ghost { background:#fff; color:#4c596a; border-color:#d6deea; }
    .hero-visual { position:relative; min-height:420px; }
    .hero-visual img { width:100%; height:100%; object-fit:cover; display:block; }
    .hero-visual::before {
      content:'';
      position:absolute;
      inset:0;
      background:linear-gradient(90deg,rgba(255,255,255,.82) 0%,rgba(255,255,255,.22) 45%,rgba(255,255,255,.04) 80%);
    }

    .split {
      border:1px solid var(--line);
      border-radius:22px;
      overflow:hidden;
      display:grid;
      grid-template-columns:1fr 1fr;
      min-height:520px;
    }
    .split-visual img { width:100%; height:100%; object-fit:cover; display:block; }
    .split-copy {
      padding:34px 34px 28px;
      display:grid;
      align-content:center;
      gap:14px;
      background:#f8fbff;
    }
    .split-copy h2 { margin:0; font-size:clamp(2rem,3.8vw,4.5rem); line-height:.95; color:#555d69; }
    .split-copy h2 span { color:#6abf43; }
    .split-copy p { margin:0; color:#495868; font-size:clamp(1rem,1.1vw,1.12rem); line-height:1.45; }
    .split-copy ul { margin:2px 0 0; padding:0; list-style:none; display:grid; gap:8px; }
    .split-copy li {
      position:relative;
      padding-left:28px;
      color:#4d5968;
      font-size:1rem;
    }
    .split-copy li::before {
      content:'';
      position:absolute;
      left:0;
      top:8px;
      width:14px;
      height:14px;
      border-radius:50%;
      border:2px solid #68b945;
    }

    .kpi-row { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
    .kpi {
      border:1px solid #d7e7da;
      border-radius:16px;
      background:linear-gradient(145deg,#f0faef,#e7f7ea);
      padding:16px;
      display:grid;
      gap:6px;
      text-align:center;
    }
    .kpi strong { color:#2c8431; font-size:1.7rem; line-height:1; }
    .kpi span { color:#47634f; font-weight:600; }

    .process {
      border:1px solid var(--line);
      border-radius:22px;
      padding:22px;
      display:grid;
      gap:14px;
      background:linear-gradient(165deg,#f9fcff,#f5faf5);
    }
    .process h2 { margin:0; font-size:clamp(1.4rem,2.4vw,2rem); }
    .process-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
    .process-grid article {
      border:1px solid #dbe4ee;
      border-radius:14px;
      padding:14px;
      background:#fff;
      display:grid;
      gap:7px;
      align-content:start;
    }
    .process-grid mat-icon { width:22px; height:22px; font-size:22px; color:#4fa533; }
    .process-grid h3 { margin:0; font-size:1.05rem; color:#2b3442; }
    .process-grid p { margin:0; color:#5b6778; font-size:.94rem; line-height:1.35; }

    .services {
      border:1px solid var(--line);
      border-radius:22px;
      padding:20px;
      display:grid;
      gap:14px;
      background:linear-gradient(180deg,#ffffff,#f8fbff);
    }
    .section-head {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:12px;
    }
    .section-head h2 { margin:0; font-size:clamp(1.4rem,2.3vw,1.9rem); }
    .section-head a {
      text-decoration:none;
      border:1px solid #79bf60;
      color:#2a8531;
      background:#edf9ee;
      border-radius:999px;
      padding:10px 14px;
      font-weight:800;
      white-space:nowrap;
    }

    .loading { color:var(--ink-2); font-weight:700; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:14px; }
    .card {
      border:1px solid #dbe5ef;
      border-radius:14px;
      padding:12px;
      display:grid;
      gap:10px;
      background:#fff;
    }
    .img { height:170px; border-radius:11px; overflow:hidden; background:#edf2f8; border:1px solid #dbe5ef; }
    .img img { width:100%; height:100%; object-fit:cover; display:block; }
    .fallback { width:100%; height:100%; display:grid; place-items:center; color:#7f93a6; font-weight:700; gap:6px; align-content:center; }
    .card h3 { margin:0; font-size:1.15rem; color:#2f3a48; }
    .card p { margin:0; color:#667488; }
    .meta { display:flex; justify-content:space-between; align-items:center; }
    .meta span { font-size:.78rem; text-transform:uppercase; letter-spacing:.05em; color:#2d8d36; font-weight:700; }
    .meta strong { color:#c44a18; font-size:1.08rem; }
    .rating { display:flex; align-items:center; gap:6px; }
    .stars { display:inline-flex; align-items:center; gap:1px; }
    .stars mat-icon { width:16px; height:16px; font-size:16px; color:#d89b2c; }
    .score { font-size:.82rem; font-weight:700; color:#3b4959; }
    .count { font-size:.8rem; color:#6b7688; }
    .no-rating { margin:0; color:#6b7688; font-size:.82rem; }
    .actions { display:flex; justify-content:flex-end; border-top:1px solid #e1e8f0; padding-top:10px; }
    .actions a {
      text-decoration:none;
      padding:8px 13px;
      border-radius:10px;
      color:#fff;
      background:linear-gradient(135deg,#68bb3e,#3c8f30);
      border:1px solid #5ca341;
      font-weight:800;
    }

    .contact {
      border:1px solid #d6e6d9;
      border-radius:22px;
      padding:24px;
      display:grid;
      gap:10px;
      background:linear-gradient(150deg,#edf9ee,#e4f4e8);
    }
    .contact h2 { margin:0; font-size:clamp(1.3rem,2vw,1.8rem); color:#2f4e36; }
    .contact p { margin:0; color:#4b6a52; max-width:820px; }
    .contact a {
      width:fit-content;
      text-decoration:none;
      border-radius:999px;
      padding:11px 16px;
      color:#fff;
      font-weight:800;
      border:1px solid #5aa046;
      background:linear-gradient(135deg,#66ba3f,#3c8f31);
    }

    .error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; border-radius:12px; padding:10px 12px; }

    @media (max-width: 1120px) {
      .hero, .split { grid-template-columns:1fr; min-height:auto; }
      .hero-visual, .split-visual { min-height:330px; }
      .kpi-row { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .process-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
    }
    @media (max-width: 720px) {
      .clean-subnav { top:82px; }
      .hero-copy, .split-copy { padding:20px 16px; }
      .services, .process, .contact { padding:14px; }
      .section-head { flex-direction:column; align-items:flex-start; }
      .kpi-row, .process-grid { grid-template-columns:1fr; }
    }
    @media (max-width: 480px) {
      .hero-copy, .split-copy { padding:14px 10px; gap:8px; }
      .hero-copy h1 { font-size:1.6rem; }
      .services, .process, .contact { padding:10px; }
      .grid { grid-template-columns:1fr 1fr; }
    }
    @media (max-width: 400px) {
      .grid { grid-template-columns:1fr; }
    }
  `],
})
export class CleanPublicComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly services = signal<CleanService[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.get<CleanService[]>('/cclean/services').subscribe({
      next: (data) => {
        this.services.set(
          (Array.isArray(data) ? data : []).map((item) => ({
            ...item,
            imageUrl: buildMediaUrl(item.imageUrl),
          })),
        );
        this.loading.set(false);
      },
      error: () => {
        this.error.set("Impossible de charger les services C'Clean.");
        this.loading.set(false);
      },
    });
  }

  onServiceImageError(id: string): void {
    this.services.update((arr) =>
      arr.map((item) => (item.id === id ? { ...item, imageUrl: '' } : item)),
    );
  }

  stars(rating: number): number[] {
    const rounded = Math.round(Number(rating || 0));
    return [1, 2, 3, 4, 5].map((i) => (i <= rounded ? 1 : 0));
  }
}
