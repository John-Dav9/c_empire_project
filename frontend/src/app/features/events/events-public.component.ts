import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { buildMediaUrl } from '../../core/config/api.config';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyXafPipe } from '../../shared/pipes/currency-xaf.pipe';

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

type PaymentProvider =
  | 'orange_money'
  | 'mtn_momo'
  | 'wave'
  | 'stripe'
  | 'paypal'
  | 'wallet'
  | 'card';

type BookingPayload = {
  eventId: string;
  eventDate: string;
  location: string;
  options?: Record<string, unknown>;
  paymentProvider: PaymentProvider;
};

@Component({
  selector: 'app-events-public',
  imports: [MatIconModule, FormsModule, RouterLink, CurrencyXafPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
            <a class="btn solid" routerLink="." fragment="planner">Creer mon brief</a>
            <a class="btn ghost" routerLink="." fragment="catalog">Voir les formules</a>
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
              [ngModel]="aiNeed()"
              (ngModelChange)="aiNeed.set($event)"
              placeholder="Ex: Je veux organiser un mariage de 250 personnes en septembre avec deco chic et animation live"
            ></textarea>
            <button type="button" class="ai-btn" (click)="runAiAssistant()" [disabled]="aiLoading() || !aiNeed().trim()">
              {{ aiLoading() ? 'Analyse en cours...' : 'Suggerez ma categorie et mon plan' }}
            </button>
            @if (aiError()) {
              <p class="planner-error">{{ aiError() }}</p>
            }
          </div>

          @if (aiCategory() || aiChecklist().length || aiDecorIdeas().length) {
            <div class="planner-right">
              @if (aiCategory()) {
                <div class="ai-card">
                  <h3>Categorie recommandee</h3>
                  <p>{{ categoryLabels[aiCategory()] || aiCategory() }}</p>
                  <button type="button" (click)="applySuggestedCategory()">Utiliser cette categorie</button>
                </div>
              }

              @if (aiChecklist().length > 0) {
                <div class="ai-card">
                  <h3>Checklist proposee</h3>
                  <ul>
                    @for (point of aiChecklist(); track point) {
                      <li>{{ point }}</li>
                    }
                  </ul>
                </div>
              }

              @if (aiPlanningEntries().length > 0) {
                <div class="ai-card">
                  <h3>Planning conseille</h3>
                  <ul>
                    @for (item of aiPlanningEntries(); track item[0]) {
                      <li><strong>{{ item[0] }}</strong> - {{ item[1] }}</li>
                    }
                  </ul>
                </div>
              }

              @if (aiDecorIdeas().length > 0) {
                <div class="ai-card">
                  <h3>Idees deco</h3>
                  <ul>
                    @for (idea of aiDecorIdeas(); track idea) {
                      <li>{{ idea }}</li>
                    }
                  </ul>
                </div>
              }
            </div>
          }
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
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Rechercher un event (titre, mot cle...)"
          />
          <div class="chips">
            <button type="button" [class.active]="selectedCategory() === ''" (click)="selectedCategory.set('')">Tous</button>
            @for (c of categories(); track c) {
              <button
                type="button"
                [class.active]="selectedCategory() === c"
                (click)="selectedCategory.set(c)"
              >
                {{ categoryLabels[c] || c }}
              </button>
            }
          </div>
        </div>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        @if (loading()) {
          <div class="loading">Chargement des offres events...</div>
        }

        @if (!loading()) {
          <section class="grid">
            @for (item of filteredEvents(); track item.id) {
              <article class="card">
                <div class="img">
                  @if (item.images?.[0]) {
                    <img
                      [src]="item.images![0]"
                      [alt]="item.title"
                      (error)="onEventImageError(item.id)"
                    />
                  } @else {
                    <div class="fallback">
                      <mat-icon>event</mat-icon>
                      <span>Pack evenement</span>
                    </div>
                  }
                  <span class="badge">{{ categoryLabels[item.category] || item.category }}</span>
                </div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
                <div class="meta">
                  <strong>{{ item.basePrice | currencyXaf }}</strong>
                  <button type="button" (click)="selectEvent(item)">Details</button>
                </div>
              </article>
            }
          </section>
        }
      </section>

      @if (selectedEvent(); as event) {
        <section class="booking app-shell-card">
          <div class="section-head">
            <h2>{{ event.title }}</h2>
            <span>Etape 3 - Finalisez votre reservation</span>
          </div>

          <div class="booking-grid">
            <article class="event-summary">
              @if (event.images?.[0]) {
                <img [src]="event.images![0]" [alt]="event.title" />
              } @else {
                <div class="fallback large">
                  <mat-icon>event_available</mat-icon>
                  <span>Visuel indisponible</span>
                </div>
              }
              <p>{{ event.description }}</p>
              <div class="summary-row">
                <span>Categorie</span>
                <strong>{{ categoryLabels[event.category] || event.category }}</strong>
              </div>
              <div class="summary-row">
                <span>Base tarifaire</span>
                <strong>{{ event.basePrice | currencyXaf }}</strong>
              </div>
            </article>

            <form class="booking-form" (ngSubmit)="submitBooking()">
              <label>
                Date de l'evenement
                <input type="date" [min]="today" [ngModel]="bookingDate()" (ngModelChange)="bookingDate.set($event)" name="bookingDate" required />
              </label>

              <label>
                Lieu
                <input
                  type="text"
                  [ngModel]="bookingLocation()"
                  (ngModelChange)="bookingLocation.set($event)"
                  name="bookingLocation"
                  placeholder="Ville, quartier, salle ou adresse"
                  required
                />
              </label>

              <label>
                Options / besoins specifiques
                <textarea
                  rows="5"
                  [ngModel]="bookingOptions()"
                  (ngModelChange)="bookingOptions.set($event)"
                  name="bookingOptions"
                  placeholder="Ex: 250 personnes, theme blanc-or, sonorisation complete, camera..."
                ></textarea>
              </label>

              <label>
                Moyen de paiement
                <select [ngModel]="bookingPaymentProvider()" (ngModelChange)="bookingPaymentProvider.set($event)" name="bookingPaymentProvider" required>
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
                <button type="submit" class="primary" [disabled]="bookingLoading()">
                  {{ bookingLoading() ? 'Creation en cours...' : 'Reserver maintenant' }}
                </button>
              </div>

              @if (bookingMessage()) {
                <p class="booking-info">{{ bookingMessage() }}</p>
              }
              @if (bookingError()) {
                <p class="booking-error">{{ bookingError() }}</p>
              }
            </form>
          </div>
        </section>
      }

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
    @media (max-width: 480px) {
      .hero-copy { padding:14px 12px; gap:8px; }
      .planner, .catalog, .booking, .process { padding:12px; }
      .kpis { grid-template-columns:1fr 1fr; }
    }
  `],
})
export class EventsPublicComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly today = new Date().toISOString().slice(0, 10);

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

  readonly events = signal<EventItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly selectedCategory = signal('');
  readonly searchTerm = signal('');
  readonly selectedEvent = signal<EventItem | null>(null);

  readonly aiNeed = signal('');
  readonly aiLoading = signal(false);
  readonly aiError = signal<string | null>(null);
  readonly aiCategory = signal('');
  readonly aiChecklist = signal<string[]>([]);
  readonly aiPlanningEntries = signal<Array<[string, string]>>([]);
  readonly aiDecorIdeas = signal<string[]>([]);

  readonly bookingDate = signal('');
  readonly bookingLocation = signal('');
  readonly bookingOptions = signal('');
  readonly bookingPaymentProvider = signal<PaymentProvider>('orange_money');
  readonly bookingLoading = signal(false);
  readonly bookingMessage = signal<string | null>(null);
  readonly bookingError = signal<string | null>(null);

  readonly categories = computed(() => {
    const set = new Set(
      this.events()
        .map((event) => String(event.category || '').trim())
        .filter(Boolean),
    );
    return Array.from(set);
  });

  readonly filteredEvents = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const cat = this.selectedCategory();
    return this.events().filter((event) => {
      const matchesCategory = !cat || event.category === cat;
      const matchesSearch =
        !q ||
        String(event.title || '').toLowerCase().includes(q) ||
        String(event.description || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  });

  ngOnInit(): void {
    this.api.get<EventItem[]>('/c-event/events').subscribe({
      next: (data) => {
        const loaded = (Array.isArray(data) ? data : [])
          .filter((e) => e.isActive !== false)
          .map((item) => ({
            ...item,
            images: (item.images || []).map((src) => buildMediaUrl(src)),
          }));

        this.events.set(loaded);
        if (loaded.length > 0) {
          this.selectedEvent.set(loaded[0]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set("Impossible de charger les offres C'Events.");
        this.loading.set(false);
      },
    });
  }

  selectEvent(item: EventItem): void {
    this.selectedEvent.set(item);
    this.bookingMessage.set(null);
    this.bookingError.set(null);
  }

  onEventImageError(id: string): void {
    this.events.update((arr) =>
      arr.map((item) => (item.id === id ? { ...item, images: [] } : item)),
    );
  }

  runAiAssistant(): void {
    this.aiError.set(null);
    this.aiLoading.set(true);
    this.aiCategory.set('');
    this.aiChecklist.set([]);
    this.aiPlanningEntries.set([]);
    this.aiDecorIdeas.set([]);

    this.api
      .post<SuggestCategoryResponse>('/c-event/ai/suggest-category', {
        need: this.aiNeed().trim(),
      })
      .subscribe({
        next: (res) => {
          const category = String(res?.category || '').trim();
          if (!category) {
            this.aiLoading.set(false);
            this.aiError.set("Aucune categorie n'a ete suggeree.");
            return;
          }

          this.aiCategory.set(category);

          forkJoin({
            checklist: this.api.get<ChecklistResponse>(`/c-event/ai/checklist/${category}`),
            planning: this.api.get<PlanningResponse>(`/c-event/ai/planning/${category}`),
            decor: this.api.get<DecorIdeasResponse>(`/c-event/ai/decor-ideas/${category}`),
          }).subscribe({
            next: ({ checklist, planning, decor }) => {
              this.aiChecklist.set(
                Array.isArray(checklist?.checklist) ? checklist.checklist : [],
              );
              this.aiPlanningEntries.set(
                Object.entries(planning?.planning || {}) as Array<[string, string]>,
              );
              this.aiDecorIdeas.set(Array.isArray(decor?.ideas) ? decor.ideas : []);
              this.aiLoading.set(false);
            },
            error: () => {
              this.aiLoading.set(false);
              this.aiError.set('Impossible de charger les recommandations detaillees.');
            },
          });
        },
        error: () => {
          this.aiLoading.set(false);
          this.aiError.set('Analyse indisponible pour le moment.');
        },
      });
  }

  applySuggestedCategory(): void {
    const cat = this.aiCategory();
    if (!cat) return;
    this.selectedCategory.set(cat);

    const firstMatch = this.filteredEvents()[0];
    if (firstMatch) {
      this.selectEvent(firstMatch);
    }
  }

  submitBooking(): void {
    this.bookingMessage.set(null);
    this.bookingError.set(null);

    const event = this.selectedEvent();
    if (!event) {
      this.bookingError.set('Selectionnez un evenement avant de reserver.');
      return;
    }

    const date = this.bookingDate();
    const location = this.bookingLocation().trim();

    if (!date || !location) {
      this.bookingError.set('Renseignez la date et le lieu de votre evenement.');
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/signin'], {
        queryParams: { returnUrl: '/events' },
      });
      return;
    }

    const options = this.bookingOptions().trim()
      ? {
          notes: this.bookingOptions().trim(),
          source: 'public-events-form',
          suggestedCategory: this.aiCategory() || undefined,
        }
      : undefined;

    const payload: BookingPayload = {
      eventId: event.id,
      eventDate: date,
      location,
      options,
      paymentProvider: this.bookingPaymentProvider(),
    };

    this.bookingLoading.set(true);

    this.api.post<Record<string, unknown>>('/c-event/bookings', payload).subscribe({
      next: (res) => {
        this.bookingLoading.set(false);
        const bookingIdValue = (res?.['booking'] as Record<string, unknown>)?.['id'] || res?.['id'];
        const bookingId = bookingIdValue ? ` (#${bookingIdValue})` : '';
        this.bookingMessage.set(`Reservation creee avec succes${bookingId}.`);

        const redirectUrl = (res?.['payment'] as Record<string, unknown>)?.['redirectUrl'] || res?.['redirectUrl'];
        if (redirectUrl) {
          window.location.href = String(redirectUrl);
          return;
        }

        this.clearBookingForm(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.bookingLoading.set(false);
        this.bookingError.set(
          err?.error?.message || 'Impossible de creer la reservation pour le moment.',
        );
      },
    });
  }

  clearBookingForm(resetMessages = true): void {
    this.bookingDate.set('');
    this.bookingLocation.set('');
    this.bookingOptions.set('');
    this.bookingPaymentProvider.set('orange_money');
    if (resetMessages) {
      this.bookingMessage.set(null);
      this.bookingError.set(null);
    }
  }
}
