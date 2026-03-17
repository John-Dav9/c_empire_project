import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { buildMediaUrl } from '../../core/config/api.config';
import { AuthService } from '../../core/services/auth.service';

type EventItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  basePrice: number;
  images?: string[];
  isActive?: boolean;
  avgRating?: number;
  reviewsCount?: number;
};

type SuggestCategoryResponse = {
  category: string;
};

type ChecklistResponse = {
  category: string;
  checklist: string[];
};

type PlanningResponse = {
  category: string;
  planning: Record<string, string>;
};

type DecorIdeasResponse = {
  category: string;
  ideas: string[];
};

type BookingPayload = {
  eventId: string;
  eventDate: string;
  location: string;
  options?: Record<string, unknown>;
  paymentProvider:
    | 'orange_money'
    | 'mtn_momo'
    | 'wave'
    | 'stripe'
    | 'paypal'
    | 'wallet'
    | 'card';
};

@Component({
  selector: 'app-events-public',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <section class="events-page page-enter">
      <header class="hero app-shell-card">
        <div class="hero-copy">
          <p class="eyebrow">C'Events Studio</p>
          <h1>Organisez vos evenements avec precision et serenite</h1>
          <p>
            Mariage, conference, anniversaire, seminaire ou celebration privee:
            C'Events centralise les prestations, le planning et le suivi de votre reservation.
          </p>
          <div class="hero-actions">
            <a class="btn solid" href="#planner">Creer mon brief</a>
            <a class="btn ghost" href="#catalog">Voir les formules</a>
          </div>
        </div>
        <div class="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80"
            alt="Organisation evenementielle"
          />
        </div>
      </header>

      <section class="kpis">
        <article class="kpi app-shell-card"><strong>+850</strong><span>events realises</span></article>
        <article class="kpi app-shell-card"><strong>96%</strong><span>clients satisfaits</span></article>
        <article class="kpi app-shell-card"><strong>48h</strong><span>delai moyen de validation</span></article>
        <article class="kpi app-shell-card"><strong>8</strong><span>categories specialistes</span></article>
      </section>

      <section class="planner app-shell-card" id="planner">
        <div class="section-head">
          <h2>Assistant evenementiel intelligent</h2>
          <span>Etape 1 - Clarifiez votre besoin</span>
        </div>

        <div class="planner-grid">
          <div class="planner-left">
            <label>Decrivez votre besoin</label>
            <textarea
              rows="5"
              [(ngModel)]="aiNeed"
              placeholder="Ex: Je veux organiser un mariage de 250 personnes en septembre avec deco chic et animation live"
            ></textarea>
            <button type="button" class="ai-btn" (click)="runAiAssistant()" [disabled]="aiLoading || !aiNeed.trim()">
              {{ aiLoading ? 'Analyse en cours...' : 'Suggerez ma categorie et mon plan' }}
            </button>
            <p class="planner-error" *ngIf="aiError">{{ aiError }}</p>
          </div>

          <div class="planner-right" *ngIf="aiCategory || aiChecklist.length || aiDecorIdeas.length">
            <div class="ai-card" *ngIf="aiCategory">
              <h3>Categorie recommandee</h3>
              <p>{{ categoryLabels[aiCategory] || aiCategory }}</p>
              <button type="button" (click)="applySuggestedCategory()">Utiliser cette categorie</button>
            </div>

            <div class="ai-card" *ngIf="aiChecklist.length > 0">
              <h3>Checklist proposee</h3>
              <ul>
                <li *ngFor="let point of aiChecklist">{{ point }}</li>
              </ul>
            </div>

            <div class="ai-card" *ngIf="aiPlanningEntries.length > 0">
              <h3>Planning conseille</h3>
              <ul>
                <li *ngFor="let item of aiPlanningEntries"><strong>{{ item[0] }}</strong> - {{ item[1] }}</li>
              </ul>
            </div>

            <div class="ai-card" *ngIf="aiDecorIdeas.length > 0">
              <h3>Idees deco</h3>
              <ul>
                <li *ngFor="let idea of aiDecorIdeas">{{ idea }}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section class="catalog app-shell-card" id="catalog">
        <div class="section-head">
          <h2>Catalogues des offres C'Events</h2>
          <span>Etape 2 - Choisissez votre formule</span>
        </div>

        <div class="filters">
          <input
            type="text"
            [(ngModel)]="searchTerm"
            placeholder="Rechercher un event (titre, mot cle...)"
          />
          <div class="chips">
            <button type="button" [class.active]="selectedCategory === ''" (click)="selectedCategory = ''">Tous</button>
            <button
              type="button"
              *ngFor="let c of categories"
              [class.active]="selectedCategory === c"
              (click)="selectedCategory = c"
            >
              {{ categoryLabels[c] || c }}
            </button>
          </div>
        </div>

        <p class="error" *ngIf="error">{{ error }}</p>
        <div class="loading" *ngIf="loading">Chargement des offres events...</div>

        <section class="grid" *ngIf="!loading">
          <article class="card" *ngFor="let item of filteredEvents">
            <div class="img">
              <img
                *ngIf="item.images?.[0]; else fallback"
                [src]="item.images?.[0]"
                [alt]="item.title"
                (error)="item.images=[]"
              />
              <ng-template #fallback>
                <div class="fallback">
                  <mat-icon>event</mat-icon>
                  <span>Pack evenement</span>
                </div>
              </ng-template>
              <span class="badge">{{ categoryLabels[item.category] || item.category }}</span>
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            <div class="meta">
              <strong>{{ item.basePrice | currency:'XOF' }}</strong>
              <button type="button" (click)="selectEvent(item)">Details</button>
            </div>
          </article>
        </section>
      </section>

      <section class="booking app-shell-card" *ngIf="selectedEvent as event">
        <div class="section-head">
          <h2>{{ event.title }}</h2>
          <span>Etape 3 - Finalisez votre reservation</span>
        </div>

        <div class="booking-grid">
          <article class="event-summary">
            <img *ngIf="event.images?.[0]; else summaryFallback" [src]="event.images?.[0]" [alt]="event.title" />
            <ng-template #summaryFallback>
              <div class="fallback large">
                <mat-icon>event_available</mat-icon>
                <span>Visuel indisponible</span>
              </div>
            </ng-template>
            <p>{{ event.description }}</p>
            <div class="summary-row">
              <span>Categorie</span>
              <strong>{{ categoryLabels[event.category] || event.category }}</strong>
            </div>
            <div class="summary-row">
              <span>Base tarifaire</span>
              <strong>{{ event.basePrice | currency:'XOF' }}</strong>
            </div>
          </article>

          <form class="booking-form" (ngSubmit)="submitBooking()">
            <label>
              Date de l'evenement
              <input type="date" [min]="today" [(ngModel)]="bookingDate" name="bookingDate" required />
            </label>

            <label>
              Lieu
              <input
                type="text"
                [(ngModel)]="bookingLocation"
                name="bookingLocation"
                placeholder="Ville, quartier, salle ou adresse"
                required
              />
            </label>

            <label>
              Options / besoins specifiques
              <textarea
                rows="5"
                [(ngModel)]="bookingOptions"
                name="bookingOptions"
                placeholder="Ex: 250 personnes, theme blanc-or, sonorisation complete, camera..."
              ></textarea>
            </label>

            <label>
              Moyen de paiement
              <select [(ngModel)]="bookingPaymentProvider" name="bookingPaymentProvider" required>
                <option value="orange_money">Orange Money</option>
                <option value="mtn_momo">MTN Momo</option>
                <option value="wave">Wave</option>
                <option value="card">Carte bancaire</option>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
              </select>
            </label>

            <div class="booking-actions">
              <button type="button" class="secondary" (click)="clearBookingForm()">Reinitialiser</button>
              <button type="submit" class="primary" [disabled]="bookingLoading">
                {{ bookingLoading ? 'Creation en cours...' : 'Reserver maintenant' }}
              </button>
            </div>

            <p class="booking-info" *ngIf="bookingMessage">{{ bookingMessage }}</p>
            <p class="booking-error" *ngIf="bookingError">{{ bookingError }}</p>
          </form>
        </div>
      </section>

      <section class="process app-shell-card">
        <h2>Le parcours C'Events en 3 phases</h2>
        <div class="process-grid">
          <article><strong>1</strong><p>Brief et recommendations IA</p></article>
          <article><strong>2</strong><p>Choix de formule et soumission reservation</p></article>
          <article><strong>3</strong><p>Validation admin puis execution terrain</p></article>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .events-page { display:grid; gap:16px; }

    .hero {
      border:1px solid var(--line);
      border-radius:24px;
      overflow:hidden;
      display:grid;
      grid-template-columns:1fr 1fr;
      min-height:460px;
      background:#fff;
    }
    .hero-copy {
      padding:30px 32px;
      display:grid;
      align-content:center;
      gap:12px;
      background:linear-gradient(150deg,#fff,#f7faff);
    }
    .eyebrow {
      margin:0;
      font-size:.86rem;
      text-transform:uppercase;
      letter-spacing:.08em;
      color:#2468a8;
      font-weight:800;
    }
    .hero h1 { margin:0; font-size:clamp(1.9rem,3vw,3.2rem); line-height:1.06; color:#243445; }
    .hero p { margin:0; color:#4f6177; line-height:1.45; font-size:clamp(1rem,1.06vw,1.12rem); }
    .hero-actions { display:flex; gap:10px; flex-wrap:wrap; }
    .btn {
      text-decoration:none;
      border-radius:999px;
      padding:10px 16px;
      font-weight:800;
      border:1px solid transparent;
    }
    .btn.solid { background:linear-gradient(135deg,#2f7bc2,#235d96); color:#fff; }
    .btn.ghost { background:#fff; border-color:#d6e4f3; color:#314a66; }
    .hero-visual { position:relative; }
    .hero-visual img { width:100%; height:100%; object-fit:cover; display:block; }
    .hero-visual::before {
      content:'';
      position:absolute;
      inset:0;
      background:linear-gradient(90deg,rgba(255,255,255,.62) 0%,rgba(255,255,255,.08) 45%,rgba(255,255,255,.02) 100%);
    }

    .kpis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
    .kpi {
      border:1px solid #dce8f4;
      border-radius:14px;
      padding:14px;
      background:#fff;
      display:grid;
      gap:4px;
      text-align:center;
    }
    .kpi strong { color:#255f99; font-size:1.45rem; line-height:1; }
    .kpi span { color:#5a6f88; font-weight:600; }

    .planner, .catalog, .booking, .process {
      border:1px solid var(--line);
      border-radius:20px;
      background:#fff;
      padding:20px;
      display:grid;
      gap:12px;
    }
    .section-head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
    .section-head h2 { margin:0; font-size:clamp(1.3rem,2vw,1.9rem); color:#27384c; }
    .section-head span { color:#61768f; font-weight:700; font-size:.88rem; }

    .planner-grid {
      display:grid;
      grid-template-columns:1.2fr .8fr;
      gap:12px;
    }
    .planner-left label { display:grid; gap:6px; font-weight:700; color:#3f546e; }
    .planner-left textarea {
      width:100%;
      border:1px solid #d6e4f3;
      border-radius:12px;
      padding:10px 12px;
      resize:vertical;
      font-family:inherit;
      font-size:.95rem;
      color:#2d4157;
      background:#fff;
    }
    .ai-btn {
      margin-top:10px;
      border:none;
      border-radius:999px;
      padding:11px 15px;
      background:linear-gradient(135deg,#2f7bc2,#235d96);
      color:#fff;
      font-weight:800;
      cursor:pointer;
    }
    .ai-btn:disabled { opacity:.6; cursor:not-allowed; }
    .planner-error { margin:8px 0 0; color:#b92016; font-weight:700; }

    .planner-right { display:grid; gap:8px; align-content:start; }
    .ai-card {
      border:1px solid #dce8f4;
      border-radius:12px;
      padding:10px;
      background:#f7fbff;
      display:grid;
      gap:7px;
    }
    .ai-card h3 { margin:0; font-size:1rem; color:#2f4a67; }
    .ai-card p { margin:0; color:#3f5a75; font-weight:700; }
    .ai-card ul { margin:0; padding-left:18px; color:#4d627a; display:grid; gap:4px; }
    .ai-card button {
      justify-self:start;
      border:1px solid #d4e4f4;
      border-radius:999px;
      background:#fff;
      color:#2b5f94;
      font-weight:700;
      padding:7px 12px;
      cursor:pointer;
    }

    .filters { display:grid; gap:10px; }
    .filters input {
      height:42px;
      border:1px solid #d6e4f3;
      border-radius:10px;
      padding:0 12px;
      color:#324c67;
      background:#fff;
    }
    .chips { display:flex; gap:8px; flex-wrap:wrap; }
    .chips button {
      border:1px solid #d6e4f3;
      border-radius:999px;
      background:#fff;
      color:#3b4f66;
      font-weight:700;
      padding:7px 11px;
      cursor:pointer;
    }
    .chips button.active {
      border-color:#2f7bc2;
      background:#eef6ff;
      color:#245f99;
    }

    .loading { color:var(--ink-2); font-weight:700; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; }
    .card {
      border:1px solid #dce7f2;
      border-radius:14px;
      padding:12px;
      display:grid;
      gap:10px;
      background:#fff;
    }
    .img { height:170px; border-radius:12px; overflow:hidden; background:#eff3f9; border:1px solid #dce7f2; position:relative; }
    .img img { width:100%; height:100%; object-fit:cover; display:block; }
    .fallback { width:100%; height:100%; display:grid; place-items:center; color:#8a9db3; font-weight:700; gap:6px; align-content:center; }
    .badge {
      position:absolute;
      left:8px;
      top:8px;
      border-radius:999px;
      padding:4px 8px;
      font-size:.72rem;
      font-weight:800;
      color:#fff;
      background:#2f7bc2;
      border:1px solid #1f5f98;
    }
    .card h3 { margin:0; font-size:1.15rem; color:#2d4056; }
    .card p { margin:0; color:#60758e; }
    .meta { display:flex; justify-content:space-between; align-items:center; gap:8px; }
    .meta strong { color:#c44a18; font-size:1.1rem; }
    .meta button {
      border:1px solid #d6e4f3;
      border-radius:10px;
      background:#f4f9ff;
      color:#2c5f95;
      font-weight:700;
      padding:6px 10px;
      cursor:pointer;
    }

    .booking-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .event-summary { display:grid; gap:10px; align-content:start; }
    .event-summary img { width:100%; height:230px; object-fit:cover; border-radius:12px; border:1px solid #dce7f2; }
    .fallback.large { height:230px; border-radius:12px; border:1px solid #dce7f2; }
    .event-summary p { margin:0; color:#60758e; }
    .summary-row {
      border:1px solid #dce7f2;
      border-radius:10px;
      padding:9px 10px;
      display:flex;
      justify-content:space-between;
      align-items:center;
      color:#3f556f;
    }
    .summary-row strong { color:#2c5f95; }

    .booking-form { display:grid; gap:10px; align-content:start; }
    .booking-form label { display:grid; gap:6px; color:#3f546e; font-weight:700; }
    .booking-form input,
    .booking-form textarea,
    .booking-form select {
      border:1px solid #d6e4f3;
      border-radius:10px;
      background:#fff;
      color:#2d4157;
      font:inherit;
      padding:10px 12px;
    }
    .booking-form input,
    .booking-form select { height:42px; padding-top:0; padding-bottom:0; }
    .booking-form textarea { resize:vertical; }
    .booking-actions { display:flex; gap:8px; justify-content:flex-end; }
    .booking-actions button {
      border-radius:10px;
      padding:10px 13px;
      font-weight:800;
      cursor:pointer;
    }
    .booking-actions .secondary {
      border:1px solid #d6e4f3;
      background:#fff;
      color:#3f546e;
    }
    .booking-actions .primary {
      border:1px solid #2f7bc2;
      background:linear-gradient(135deg,#2f7bc2,#235d96);
      color:#fff;
    }
    .booking-actions .primary:disabled { opacity:.6; cursor:not-allowed; }

    .booking-info { margin:0; color:#0d6a5b; font-weight:700; }
    .booking-error { margin:0; color:#b92016; font-weight:700; }

    .process-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
    .process-grid article {
      border:1px solid #dce7f2;
      border-radius:12px;
      padding:12px;
      background:#f8fbff;
      display:grid;
      gap:7px;
      align-content:start;
    }
    .process-grid strong {
      width:28px;
      height:28px;
      border-radius:50%;
      background:#2f7bc2;
      color:#fff;
      display:grid;
      place-items:center;
      font-size:.9rem;
    }
    .process-grid p { margin:0; color:#5a6f88; }

    .error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; border-radius:12px; padding:10px 12px; }

    @media (max-width: 1120px) {
      .hero { grid-template-columns:1fr; }
      .hero-visual { min-height:280px; }
      .kpis { grid-template-columns:1fr 1fr; }
      .planner-grid,
      .booking-grid { grid-template-columns:1fr; }
    }
    @media (max-width: 760px) {
      .planner, .catalog, .booking, .process { padding:14px; }
      .hero-copy { padding:20px 16px; }
      .kpis,
      .process-grid { grid-template-columns:1fr; }
      .section-head { flex-direction:column; align-items:flex-start; }
      .booking-actions { justify-content:flex-start; }
    }
  `],
})
export class EventsPublicComponent implements OnInit {
  readonly categoryLabels: Record<string, string> = {
    MARIAGE: 'Mariage',
    BAPTEME: 'Bapteme',
    ANNIVERSAIRE: 'Anniversaire',
    DEUIL: 'Deuil',
    SOUTENANCE: 'Soutenance',
    CONFERENCE: 'Conference',
    SEMINAIRE: 'Seminaire',
    SURPRISE: 'Surprise',
  };

  events: EventItem[] = [];
  loading = true;
  error: string | null = null;

  selectedCategory = '';
  searchTerm = '';

  selectedEvent: EventItem | null = null;

  aiNeed = '';
  aiLoading = false;
  aiError: string | null = null;
  aiCategory = '';
  aiChecklist: string[] = [];
  aiPlanningEntries: Array<[string, string]> = [];
  aiDecorIdeas: string[] = [];

  bookingDate = '';
  bookingLocation = '';
  bookingOptions = '';
  bookingPaymentProvider: BookingPayload['paymentProvider'] = 'orange_money';
  bookingLoading = false;
  bookingMessage: string | null = null;
  bookingError: string | null = null;

  constructor(
    private readonly api: ApiService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.api.get<EventItem[]>('/c-event/events').subscribe({
      next: (data) => {
        this.events = (Array.isArray(data) ? data : [])
          .filter((e) => e.isActive !== false)
          .map((item) => ({
            ...item,
            images: (item.images || []).map((src) => buildMediaUrl(src)),
          }));

        if (this.events.length > 0) {
          this.selectedEvent = this.events[0];
        }

        this.loading = false;
      },
      error: () => {
        this.error = "Impossible de charger les offres C'Events.";
        this.loading = false;
      },
    });
  }

  get categories(): string[] {
    const set = new Set(
      this.events
        .map((event) => String(event.category || '').trim())
        .filter(Boolean),
    );
    return Array.from(set);
  }

  get filteredEvents(): EventItem[] {
    const q = this.searchTerm.trim().toLowerCase();
    return this.events.filter((event) => {
      const matchesCategory = !this.selectedCategory || event.category === this.selectedCategory;
      const matchesSearch =
        !q ||
        String(event.title || '').toLowerCase().includes(q) ||
        String(event.description || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }

  get today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  selectEvent(item: EventItem): void {
    this.selectedEvent = item;
    this.bookingMessage = null;
    this.bookingError = null;
  }

  runAiAssistant(): void {
    this.aiError = null;
    this.aiLoading = true;
    this.aiCategory = '';
    this.aiChecklist = [];
    this.aiPlanningEntries = [];
    this.aiDecorIdeas = [];

    this.api.post<SuggestCategoryResponse>('/c-event/ai/suggest-category', {
      need: this.aiNeed.trim(),
    }).subscribe({
      next: (res) => {
        const category = String(res?.category || '').trim();
        if (!category) {
          this.aiLoading = false;
          this.aiError = 'Aucune categorie n\'a ete suggeree.';
          return;
        }

        this.aiCategory = category;

        forkJoin({
          checklist: this.api.get<ChecklistResponse>(`/c-event/ai/checklist/${category}`),
          planning: this.api.get<PlanningResponse>(`/c-event/ai/planning/${category}`),
          decor: this.api.get<DecorIdeasResponse>(`/c-event/ai/decor-ideas/${category}`),
        }).subscribe({
          next: ({ checklist, planning, decor }) => {
            this.aiChecklist = Array.isArray(checklist?.checklist)
              ? checklist.checklist
              : [];
            this.aiPlanningEntries = Object.entries(planning?.planning || {});
            this.aiDecorIdeas = Array.isArray(decor?.ideas) ? decor.ideas : [];
            this.aiLoading = false;
          },
          error: () => {
            this.aiLoading = false;
            this.aiError = 'Impossible de charger les recommandations detaillees.';
          },
        });
      },
      error: () => {
        this.aiLoading = false;
        this.aiError = 'Analyse indisponible pour le moment.';
      },
    });
  }

  applySuggestedCategory(): void {
    if (!this.aiCategory) return;
    this.selectedCategory = this.aiCategory;

    const firstMatch = this.filteredEvents[0];
    if (firstMatch) {
      this.selectEvent(firstMatch);
    }
  }

  submitBooking(): void {
    this.bookingMessage = null;
    this.bookingError = null;

    if (!this.selectedEvent) {
      this.bookingError = 'Selectionnez un evenement avant de reserver.';
      return;
    }

    if (!this.bookingDate || !this.bookingLocation.trim()) {
      this.bookingError = 'Renseignez la date et le lieu de votre evenement.';
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/signin'], {
        queryParams: { returnUrl: '/events' },
      });
      return;
    }

    const optionsPayload = this.bookingOptions.trim()
      ? {
          notes: this.bookingOptions.trim(),
          source: 'public-events-form',
          suggestedCategory: this.aiCategory || undefined,
        }
      : undefined;

    const payload: BookingPayload = {
      eventId: this.selectedEvent.id,
      eventDate: this.bookingDate,
      location: this.bookingLocation.trim(),
      options: optionsPayload,
      paymentProvider: this.bookingPaymentProvider,
    };

    this.bookingLoading = true;

    this.api.post<any>('/c-event/bookings', payload).subscribe({
      next: (res) => {
        this.bookingLoading = false;
        const bookingIdValue = res?.booking?.id || res?.id;
        const bookingId = bookingIdValue ? ` (#${bookingIdValue})` : '';
        this.bookingMessage = `Reservation creee avec succes${bookingId}.`;

        const redirectUrl = res?.payment?.redirectUrl || res?.redirectUrl;
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }

        this.clearBookingForm(false);
      },
      error: (err) => {
        this.bookingLoading = false;
        this.bookingError =
          err?.error?.message ||
          'Impossible de creer la reservation pour le moment.';
      },
    });
  }

  clearBookingForm(resetMessages = true): void {
    this.bookingDate = '';
    this.bookingLocation = '';
    this.bookingOptions = '';
    this.bookingPaymentProvider = 'orange_money';
    if (resetMessages) {
      this.bookingMessage = null;
      this.bookingError = null;
    }
  }

  stars(rating: number): number[] {
    const rounded = Math.round(Number(rating || 0));
    return [1, 2, 3, 4, 5].map((i) => (i <= rounded ? 1 : 0));
  }
}
